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
  JobStatusResponse
} from '../../services/comparison.service';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, startWith, switchMap, map, forkJoin, takeWhile } from 'rxjs';
import { Viewer3dComponent } from '../../components/viewer3d/viewer3d.component';
import { PartsService } from '../../services/parts.service';
import { CanvasDrawerService } from '../../services/canvas-drawer.service';

// Enums and Types
enum Status {
  Initial,
  Processing,
  Ready,
  Approved,
  Rejected,
  ViewOnly
}

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Viewer3dComponent],
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css']
})
export class ComparisonComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router); // Injected Router
  private readonly comparisonService = inject(ComparisonService);
  private readonly partsService = inject(PartsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly canvasDrawer = inject(CanvasDrawerService);

  @ViewChild('defectCanvasFront') defectCanvasFront!: ElementRef<HTMLCanvasElement>;
  @ViewChild('defectCanvasSide') defectCanvasSide!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInputFront') fileInputFront!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInputSide') fileInputSide!: ElementRef<HTMLInputElement>;

  public status = Status.Initial;
  public StatusEnum = Status;
  public showAnalysis = false;
  public analysisTime = 0;
  public isViewMode = false;

  public defectsFront: DefectBox[] = [];
  public defectsSide: DefectBox[] = [];
  public totalDefects = 0;

  public uploadForm: FormGroup;
  public referenceModelUrl: string | null = null;
  public generatedModelUrl: string | null = null;

  private partReferentialId!: number;
  protected jobId: string | null = null;

  constructor() {
    this.uploadForm = this.fb.group({
      imageFront: [null, Validators.required],
      imageSide: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.partReferentialId = +this.route.snapshot.params['id'];

    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'view' && params['jobId']) {
        this.isViewMode = true;
        this.status = Status.ViewOnly;
        this.jobId = params['jobId'];
        this.loadHistoricalJob(this.jobId!);
      }
    });

    this.partsService.getPart(this.partReferentialId).subscribe(part => {
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

  // Public Methods - main flow
  generate3DModel(): void {
    if (this.uploadForm.invalid) return;

    this.status = Status.Processing;
    this.showAnalysis = false;
    this.resetDefects();
    this.generatedModelUrl = null;
    this.jobId = null;

    const frontFile = this.uploadForm.get('imageFront')?.value;
    const sideFile = this.uploadForm.get('imageSide')?.value;

    this.analyzeDefects(frontFile, sideFile);
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

  saveAsSample(): void {
    if (this.status !== Status.Ready) return;

    const frontFile = this.uploadForm.get('imageFront')?.value;
    const sideFile = this.uploadForm.get('imageSide')?.value;

    // Naming strategy: Sample - [Date]
    const name = `Amostra - ${new Date().toLocaleTimeString()}`;
    // SKU strategy: SMP-[Random]
    const sku = `SMP-${Math.floor(Math.random() * 100000)}`;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('sku', sku);
    formData.append('side_image', sideFile);
    formData.append('front_image', frontFile);
    formData.append('part_type', 'sample');

    this.partsService.addPart(formData).subscribe({
      next: () => {
        alert('Amostra salva com sucesso!');
      },
      error: (err) => console.error('Erro ao salvar amostra:', err)
    });
  }

  reboot(): void {
    this.status = Status.Initial;
    this.uploadForm.reset();

    if (this.fileInputFront) this.fileInputFront.nativeElement.value = '';
    if (this.fileInputSide) this.fileInputSide.nativeElement.value = '';

    this.jobId = null;
    this.generatedModelUrl = null;
    this.resetDefects();
    this.isViewMode = false;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: null, jobId: null },
      queryParamsHandling: 'merge'
    });
  }

  goBack(): void {
    this.router.navigate(['/parts', this.partReferentialId]);
  }

  // Private Methods - Comparison Flow
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

  // Private Methods - 3D Model Flow
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
          switchMap(() => this.comparisonService.checkJobStatus(this.jobId!)),
          takeWhile((res) => res.status !== 'complete' && res.status !== 'failed', true) // 'true' includes the last emission (complete/failed)
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

  private loadHistoricalJob(jobId: string): void {
    this.comparisonService.checkJobStatus(jobId).subscribe({
      next: (statusResponse) => {
        if (statusResponse.modelUrl) {
          this.generatedModelUrl = statusResponse.modelUrl;
        } else {
          console.warn('No model URL found for this job.');
        }
      },
      error: (err) => {
        console.error('Error loading historical job:', err);
      }
    });
  }

  // === PRIVATE METHODS - RENDERING ===
  private drawCanvases(frontFile: File, sideFile: File): void {
    if (this.defectCanvasFront) {
      this.canvasDrawer.draw(this.defectCanvasFront, frontFile, this.defectsFront);
    } else {
      console.warn('Front Canvas not found!');
    }

    if (this.defectCanvasSide) {
      this.canvasDrawer.draw(this.defectCanvasSide, sideFile, this.defectsSide);
    } else {
      console.warn('Side Canvas not found!');
    }
  }

  // Private Methods - Utility
  private resetDefects(): void {
    this.defectsFront = [];
    this.defectsSide = [];
    this.totalDefects = 0;
    this.analysisTime = 0;
  }
}