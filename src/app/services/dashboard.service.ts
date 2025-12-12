import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api.token';

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
  private apiUrl = `${inject(API_URL)}/api/stats`;


  constructor() { }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.apiUrl);
  }
}
