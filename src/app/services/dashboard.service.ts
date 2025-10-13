import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { backend_api } from '../../environments/backend-api';

export interface DashboardStats {
  totalParts: number;
  totalAnalyses: number;
  activeComparisons: number;
};

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${backend_api.apiUrl}/stats`;


  constructor() { }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.apiUrl);
  }
}
