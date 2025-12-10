import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { Observable } from 'rxjs';
import { RouterModule, Router } from '@angular/router';
import { PartsService } from '../../services/parts.service';

// components
import { ActionCardComponent } from '../../components/action-card/action-card.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    RouterModule,
    ActionCardComponent,
    StatCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private partsService = inject(PartsService);
  private router = inject(Router);

  public stats$!: Observable<DashboardStats>;

  protected selectedPartId: number | null = null;

  ngOnInit() {
    this.stats$ = this.dashboardService.getStats();
    this.selectedPartId = this.partsService.getSelectedPartForComparison();
  }
}
