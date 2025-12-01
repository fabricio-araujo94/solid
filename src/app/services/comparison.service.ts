import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { backend_api } from '../../environments/backend-api';

export interface DefectBox {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  area: number;
}

export interface DefectResponse {
  total_defects: number;
  image_dimensions: { width: number, height: number };
  defects: DefectBox[];
}

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
  private apiUrl = `${backend_api.apiUrl}/api`; 

  startModelGeneration(formData: FormData): Observable<JobResponse> {
    return this.http.post<JobResponse>(`${this.apiUrl}/compare`, formData);
  }

  checkJobStatus(jobId: string): Observable<JobStatusResponse> {
    return this.http.get<JobStatusResponse>(`${this.apiUrl}/compare/status/${jobId}`);
  }

  saveResult(result: FinalResult): Observable<any> {
    const { jobId, status } = result;
    return this.http.put(`${this.apiUrl}/compare/${jobId}/status`, null, { params: { new_status: status } });
  }

  analyzeDefects(formData: FormData): Observable<DefectResponse> {
    return this.http.post<DefectResponse>(`${this.apiUrl}/analyze/defects`, formData);
  }
}