import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { backend_api } from '../../environments/backend-api';

export interface JobResponse {
  jobId: string;
}

export interface JobStatusResponse {
  status: 'processing' | 'complete' | 'failed';
  modelUrl?: string; 
}

@Injectable({
  providedIn: 'root'
})
export class ComparisonService {
  private http = inject(HttpClient);
  private apiUrl = `${backend_api.apiUrl}/compare`; 

  startModelGeneration(formData: FormData): Observable<JobResponse> {
    return this.http.post<JobResponse>(this.apiUrl, formData);
  }

  checkJobStatus(jobId: string): Observable<JobStatusResponse> {
    return this.http.get<JobStatusResponse>(`${this.apiUrl}/status/${jobId}`);
  }

  saveResult(resultDate: { partId: number, status: 'approved' | 'failed' }) {
    console.log('Salvando resultado:', resultDate);
  }
}