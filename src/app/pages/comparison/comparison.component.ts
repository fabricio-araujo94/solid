import { Component, OnInit, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ComparisonService, DefectBox, JobStatusResponse } from '../../services/comparison.service';
import { interval, startWith, switchMap, map, forkJoin } from 'rxjs';

// Enums e Tipos
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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css']
})
export class ComparisonComponent implements OnInit {
  // Injeção de Dependências
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly comparisonService = inject(ComparisonService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ViewChildren
  @ViewChild('defectCanvasFront') defectCanvasFront!: ElementRef<HTMLCanvasElement>;
  @ViewChild('defectCanvasSide') defectCanvasSide!: ElementRef<HTMLCanvasElement>;

  // Propriedades Públicas - Estado da Análise
  public status = Status.Initial;
  public StatusEnum = Status;
  public showAnalysis = false;
  public analysisTime = 0;

  // Propriedades Públicas - Defeitos
  public defectsFront: DefectBox[] = [];
  public defectsSide: DefectBox[] = [];
  public totalDefects = 0;

  // Propriedades Públicas - Formulário e Zoom
  public uploadForm: FormGroup;
  public zoom$ = this.fb.control(50);
  public zoomValue$ = this.zoom$.valueChanges.pipe(
    startWith(this.zoom$.value),
    map(value => `${value}%`)
  );

  // Propriedades Privadas
  private partReferentialId!: number;
  private jobId: string | null = null;

  // Constructor
  constructor() {
    this.uploadForm = this.fb.group({
      imageFront: [null, Validators.required],
      imageSide: [null, Validators.required],
      zoom: this.zoom$
    });
  }

  // Lifecycle Hooks
  ngOnInit(): void {
    this.partReferentialId = +this.route.snapshot.params['id'];
  }

  // Métodos Públicos - Seleção de Arquivo
  onFileSelected(event: Event, controlName: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.uploadForm.patchValue({ [controlName]: file });
    }
  }

  // Métodos Públicos - Geração de Modelo 3D
  generate3DModel(): void {
    if (this.uploadForm.invalid) return;

    this.status = Status.Processing;
    this.showAnalysis = false;
    this.resetDefects();

    const frontFile = this.uploadForm.get('imageFront')?.value;
    const sideFile = this.uploadForm.get('imageSide')?.value;

    // Análise de Defeitos em Paralelo
    this.analyzeDefects(frontFile, sideFile);

    // Geração do Modelo 3D
    this.generate3DModelRequest(frontFile, sideFile);
  }

  // Métodos Públicos - Aprovação/Rejeição
  approvePart(): void {
    if (this.status !== Status.Ready || !this.jobId) return;

    this.comparisonService.saveResult({
      jobId: +this.jobId,
      status: 'APPROVED'
    }).subscribe({
      next: () => {
        this.status = Status.Approved;
        console.log('Inspeção APROVADA');
      },
      error: (err) => console.error('Falha ao registrar aprovação:', err)
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
        console.log('Inspeção REPROVADA');
      },
      error: (err) => console.error('Falha ao registrar reprovação:', err)
    });
  }

  reboot(): void {
    this.status = Status.Initial;
    this.uploadForm.reset();
    this.jobId = null;
    this.resetDefects();
  }

  // Métodos Privados - Análise de Defeitos
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

        // Pequeno delay para garantir que o Canvas esteja pronto
        setTimeout(() => {
          this.drawCanvases(frontFile, sideFile);
        }, 50);
      },
      error: (err) => console.error('Erro na análise de IA:', err)
    });
  }

  private generate3DModelRequest(frontFile: File, sideFile: File): void {
    const formData = new FormData();
    formData.append('imagem_frontal', frontFile);
    formData.append('imagem_lateral', sideFile);
    formData.append('peca_referencia_id', this.partReferentialId.toString());

    this.comparisonService.startModelGeneration(formData).pipe(
      switchMap(response => {
        this.jobId = response.jobId;
        return interval(2000).pipe(
          startWith(0),
          switchMap(() => this.comparisonService.checkJobStatus(this.jobId!))
        );
      })
    ).subscribe({
      next: (statusResponse: JobStatusResponse) => {
        if (statusResponse.status === 'complete') {
          this.status = Status.Ready;
          console.log('Modelo gerado com sucesso!', statusResponse.modelUrl);
        } else if (statusResponse.status === 'failed') {
          this.reboot();
        }
      },
      error: (err) => console.error('Erro na geração do modelo 3D:', err)
    });
  }

  // Métodos Privados - Renderização de Canvas
  private drawCanvases(frontFile: File, sideFile: File): void {
    if (this.defectCanvasFront) {
      this.drawResults(this.defectCanvasFront, frontFile, this.defectsFront);
    } else {
      console.warn('Canvas Frontal não encontrado!');
    }

    if (this.defectCanvasSide) {
      this.drawResults(this.defectCanvasSide, sideFile, this.defectsSide);
    } else {
      console.warn('Canvas Lateral não encontrado!');
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

    // Desenhar Imagem
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Desenhar Bounding Boxes
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

  // Métodos Privados - Utilitários
  private resetDefects(): void {
    this.defectsFront = [];
    this.defectsSide = [];
    this.totalDefects = 0;
    this.analysisTime = 0;
  }
}