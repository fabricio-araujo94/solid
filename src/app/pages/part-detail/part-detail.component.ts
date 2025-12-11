import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ComparisonJob, Part, PartsService } from '../../services/parts.service';

@Component({
  selector: 'app-part-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './part-detail.component.html',
  styleUrl: './part-detail.component.css'
})
export class PartDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private partService = inject(PartsService);

  part: Part | undefined;
  history: ComparisonJob[] = [];
  isLoading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id) {
      this.loadPartDetails(id);
    } else {
      this.isLoading = false;
    }
  }

  loadPartDetails(id: number): void {
    this.partService.getPart(id).subscribe({
      next: (part) => {
        this.part = part;
        this.loadPartHistory(id);
      },
      error: (err) => {
        console.error('Erro ao carregar a peça:', err);
        this.isLoading = false;
      }
    });
  }

  loadPartHistory(id: number): void {
    this.partService.getPartHistory(id).subscribe({
      next: (jobs) => {
        this.history = jobs;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar o histórico de inspeções:', err);
        this.isLoading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-rejected';
    }
  }

  viewAnalysis(job: ComparisonJob): void {
    if (!this.part) return;

    this.router.navigate(['/compare-models', this.part.id], {
      queryParams: {
        mode: 'view',
        jobId: job.id
      }
    });
  }
}