import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ComparisonService, JobResponse } from '../../services/comparison.service';
import { PartsService, Part } from '../../services/parts.service';
import { interval, startWith, switchMap, map} from 'rxjs';

enum Status {
  Initial,
  Processing,
  Ready,
  Approved,
  Rejected
}

@Component({
  selector: 'app-comparison',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css']
})
export class ComparisonComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private comparisonService = inject(ComparisonService);
  zoom$ = this.fb.control(50);

  public status = Status.Initial;
  public StatusEnum = Status; 

  uploadForm: FormGroup;

  private partReferentialId!: number;
  private jobId: string | null = null;
  
  constructor() {
    this.uploadForm = this.fb.group({
      imageFront: [null, Validators.required],
      imagemSide: [null, Validators.required],
      zoom: this.zoom$
    });
  }

  ngOnInit(): void {
    this.partReferentialId = +this.route.snapshot.params['id'];
  }

  zoomValue$ = this.zoom$.valueChanges.pipe(
    startWith(this.zoom$.value),
    map(value => `${value}%`)
  );

  onFileSelected(event: Event, controlName: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.uploadForm.patchValue({ [controlName]: file });
    }
  }

  generate3DModel(): void {
    if (this.uploadForm.invalid) return;

    this.status = Status.Processing;

    const formData = new FormData();
    formData.append('imagem_frontal', this.uploadForm.get('imagemFrontal')?.value);
    formData.append('imagem_lateral', this.uploadForm.get('imagemLateral')?.value);
    formData.append('peca_referencia_id', this.partReferentialId.toString());

    this.comparisonService.startModelGeneration(formData).pipe(
      switchMap(response => {
        this.jobId = response.jobId;
        return interval(2000).pipe(
          startWith(0), 
          switchMap(() => this.comparisonService.checkJobStatus(this.jobId!))
        );
      }),
    ).subscribe(statusResponse => {
      if (statusResponse.status === 'complete') {
        this.status = Status.Ready;
        console.log('Modelo gerado com sucesso!', statusResponse.modelUrl);
      } else if (statusResponse.status === 'failed') {
        this.reboot();
      }
    });
  }


  approvePart(): void {
    if (this.status !== Status.Ready || !this.jobId) return;

    this.comparisonService.saveResult({ 
      jobId: +this.jobId, 
      status: 'APPROVED' 
    }).subscribe({
      next: () => {
        this.status = Status.Approved;
        console.log('Inspeção APROVADA e registrada no banco para o Job:', this.jobId);
      },
      error: (err) => {
        console.error('Falha ao registrar aprovação:', err);
      }
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
        console.log('Inspeção REPROVADA e registrada no banco para o Job:', this.jobId);
      },
      error: (err) => {
        console.error('Falha ao registrar reprovação:', err);
      }
    });
  }

  reboot(): void {
    this.status = Status.Initial;
    this.uploadForm.reset();
    this.jobId = null;
    // TODO: Cleaning up the 3D scenes
  }
}