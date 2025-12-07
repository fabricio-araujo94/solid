import { 
  Component, 
  OnInit, 
  inject, 
  ViewChild, 
  ElementRef, 
  ChangeDetectorRef 
} from '@angular/core';

import { 
  FormBuilder, 
  FormGroup, 
  FormsModule, 
  ReactiveFormsModule, 
  Validators 
} from '@angular/forms';

import { 
  ComparisonService, 
  DefectBox, 
  JobStatusResponse } 
from '../../services/comparison.service';
  
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { interval, startWith, switchMap, map, forkJoin } from 'rxjs';
import { Viewer3dComponent } from '../../components/viewer3d/viewer3d.component';
import { PartsService } from '../../services/parts.service';


// Enums and Types
enum Status {
  Initial,
  Processing,
  Ready,
  Approved,
  Rejected
}

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Viewer3dComponent],
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css']
})
export class ComparisonComponent implements OnInit {
  // Dependency Injection
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly comparisonService = inject(ComparisonService);
  private readonly partsService = inject(PartsService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ViewChildren
  @ViewChild('defectCanvasFront') defectCanvasFront!: ElementRef<HTMLCanvasElement>;
  @ViewChild('defectCanvasSide') defectCanvasSide!: ElementRef<HTMLCanvasElement>;

  // Public Properties - Analysis State
  public status = Status.Initial;
  public StatusEnum = Status;
  public showAnalysis = false;
  public analysisTime = 0;

  // Public Properties - Defects
  public defectsFront: DefectBox[] = [];
  public defectsSide: DefectBox[] = [];
  public totalDefects = 0;

  // Public Properties - Form
  public uploadForm: FormGroup;
  public referenceModelUrl: string | null = "http://localhost:8000/uploads/models/job_2.stl";
  public generatedModelUrl: string | null = null; 

  // Private Properties
  private partReferentialId!: number;
  private jobId: string | null = null;

  // Constructor
  constructor() {
    this.uploadForm = this.fb.group({
      imageFront: [null, Validators.required],
      imageSide: [null, Validators.required]
    });
  }

  // Lifecycle Hooks
  ngOnInit(): void {
    this.partReferentialId = +this.route.snapshot.params['id'];
  
    // Load the Reference Part to get its 3D Model
    this.partsService.getPart(this.partReferentialId).subscribe(part => {
        // If the part has a registered model, we use it
        if (part.model_3d_url) {
            this.referenceModelUrl = part.model_3d_url;
        }
    });
  }

  // Public Methods - File Selection
  onFileSelected(event: Event, controlName: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.uploadForm.patchValue({ [controlName]: file });
    }
  }

  // === PUBLIC METHODS - MAIN FLOW ===
  generate3DModel(): void {
    if (this.uploadForm.invalid) return;

    this.status = Status.Processing;
    this.showAnalysis = false;
    this.resetDefects();
    this.generatedModelUrl = null; // Clears previous generated model
    this.jobId = null;

    const frontFile = this.uploadForm.get('imageFront')?.value;
    const sideFile = this.uploadForm.get('imageSide')?.value;
    
    // 1. Execute Defect Analysis (AI/CV)
    this.analyzeDefects(frontFile, sideFile);

    // 2. Execute 3D Generation
    this.generate3DModelRequest(frontFile, sideFile);
  }

  // Public Methods - Approval/Rejection
  approvePart(): void {
    if (this.status !== Status.Ready || !this.jobId) return;

    this.comparisonService.saveResult({
      jobId: +this.jobId,
      status: 'APPROVED'
    }).subscribe({
      next: () => {
        this.status = Status.Approved;
        console.log('Inspection APPROVED');
      },
      error: (err) => console.error('Failed to register approval:', err)
    });
  }

  rejectPart(): void {
    if (this.status !== Status.Ready || !this.jobId) return;

    this.comparisonService.saveResult({
      jobId: +this.jobId,
      status: 'REJECTED'
    }).subscribe({
      next: () => {
        this.status = Status.Rejected;
        console.log('Inspection REJECTED');
      },
      error: (err) => console.error('Failed to register rejection:', err)
    });
  }

  reboot(): void {
    this.status = Status.Initial;
    this.uploadForm.reset();
    this.jobId = null;
    this.generatedModelUrl = null;
    this.resetDefects();
    console.log("Eu estive aqui");
  }

  // === PRIVATE METHODS - COMPARISON FLOW ===

  private analyzeDefects(frontFile: File, sideFile: File): void {
    const analysisStartTime = performance.now();
    const formDataFront = new FormData();
    const formDataSide = new FormData();

    formDataFront.append('file', frontFile);
    formDataSide.append('file', sideFile);

    forkJoin({
      front: this.comparisonService.analyzeDefects(formDataFront),
      side: this.comparisonService.analyzeDefects(formDataSide)
    }).subscribe({
      next: (results) => {
        const analysisEndTime = performance.now();
        this.analysisTime = Math.round(analysisEndTime - analysisStartTime);

        this.defectsFront = results.front.defects || [];
        this.defectsSide = results.side.defects || [];
        this.totalDefects = (results.front.total_defects || 0) + (results.side.total_defects || 0);

        this.showAnalysis = true;
        this.cdr.detectChanges();

        // Small delay to ensure Canvas is ready
        setTimeout(() => {
          this.drawCanvases(frontFile, sideFile);
        }, 50);
      },
      error: (err) => console.error('Error in AI analysis:', err)
    });
  }

  // comparison.component.ts

  private generate3DModelRequest(frontFile: File, sideFile: File): void {
    const formData = new FormData();
    
    // These names MUST match the Python function parameters exactly
    formData.append('front_image', frontFile); 
    formData.append('side_image', sideFile);
    formData.append('reference_part_id', this.partReferentialId.toString());

    // --- DEBUG STEP: CHECK WHAT IS BEING SENT ---
    const entries: Array<[string, any]> = [];
    formData.forEach((value, key) => entries.push([key, value]));
    console.log('FormData Contents sent to /api/compare/ (Angular):', entries);

    this.comparisonService.startModelGeneration(formData).pipe(
      switchMap(response => {
        this.jobId = response.id.toString();  // Backend returns 'id', not 'jobId'
        return interval(2000).pipe(
          startWith(0),
          switchMap(() => this.comparisonService.checkJobStatus(this.jobId!))
        );
      })
    ).subscribe({
      next: (statusResponse: JobStatusResponse) => {
        if (statusResponse.status === 'complete') {
          this.status = Status.Ready;
          // Captures the URL of the model generated by the Backend
          this.generatedModelUrl = statusResponse.modelUrl || null;
          console.log('Model generated:', this.generatedModelUrl);
        } else if (statusResponse.status === 'failed') {
          this.reboot();
        }
      },
      error: (err) => console.error('Error generating 3D model:', err)
    });
  }

  // === PRIVATE METHODS - RENDERING ===

  private drawCanvases(frontFile: File, sideFile: File): void {
    if (this.defectCanvasFront) {
      this.drawResults(this.defectCanvasFront, frontFile, this.defectsFront);
    } else {
      console.warn('Front Canvas not found!');
    }

    if (this.defectCanvasSide) {
      this.drawResults(this.defectCanvasSide, sideFile, this.defectsSide);
    } else {
      console.warn('Side Canvas not found!');
    }
  }

  private drawResults(
    canvasRef: ElementRef<HTMLCanvasElement>,
    imageFile: File,
    defects: DefectBox[]
  ): void {
    if (!canvasRef) return;

    const canvas = canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e: any) => {
      img.src = e.target.result;
      img.onload = () => {
        this.renderCanvas(canvas, ctx, img, defects);
      };
    };

    if (imageFile) {
      reader.readAsDataURL(imageFile);
    }
  }

  private renderCanvas(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    defects: DefectBox[]
  ): void {
    const displayWidth = 300;
    const ratio = displayWidth / img.width;

    canvas.width = displayWidth;
    canvas.height = (img.height * ratio) || 150;

    // Draw Image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw Bounding Boxes
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';

    (defects || []).forEach(defect => {
      const x = defect.x * ratio;
      const y = defect.y * ratio;
      const w = defect.width * ratio;
      const h = defect.height * ratio;

      ctx.strokeRect(x, y, w, h);
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.fillText(defect.type.toUpperCase(), x + 2, y + 10);
    });
  }

  // Private Methods - Utility
  private resetDefects(): void {
    this.defectsFront = [];
    this.defectsSide = [];
    this.totalDefects = 0;
    this.analysisTime = 0;
  }
}