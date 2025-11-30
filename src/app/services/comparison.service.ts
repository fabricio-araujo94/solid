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

export interface FinalResult {
    jobId: number;
    status: 'APPROVED' | 'REJECTED'; 
}

@Injectable({
  providedIn: 'root'
})
export class ComparisonService {
  private http = inject(HttpClient);
  private apiUrl = `${backend_api.apiUrl}/api/compare`; 

  startModelGeneration(formData: FormData): Observable<JobResponse> {
    return this.http.post<JobResponse>(this.apiUrl, formData);
  }

  checkJobStatus(jobId: string): Observable<JobStatusResponse> {
    return this.http.get<JobStatusResponse>(`${this.apiUrl}/status/${jobId}`);
  }

  updateJobStatus(jobId: number, status: 'approved' | 'rejected'): Observable<any> {
    return this.http.put(`${this.apiUrl}/${jobId}`, { status });
  }

  saveResult(result: FinalResult): Observable<any> {
    const { jobId, status } = result;
    return this.http.put(`${this.apiUrl}/${jobId}/status`, status);
  }
}