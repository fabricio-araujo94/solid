import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { backend_api } from '../../environments/backend-api';

export interface Part {
  id: number;
  name: string;
  sku: string;
  side_image_url: string;
  front_image_url: string;
  model_3d_url: string;
}

export interface JobHistory {
  id: number;
  status: string;
  created_at: string;
  output_model_url?: string;
}

export interface ComparisonJob {
  id: number;
  part_id: number;
  status: string;
  input_front_image_url: string;
  input_side_image_url: string;
  output_model_url: string | null; 
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class PartsService {
  private http = inject(HttpClient);
  private apiUrl = `${backend_api.apiUrl}/api/parts/`;

  constructor() { }

  addPart(partData: FormData): Observable<Part> {
    console.log(partData);
    // Let the browser set the correct Content-Type (multipart/form-data with boundary)
    return this.http.post<Part>(this.apiUrl, partData);
  }

  getParts(): Observable<Part[]> {
    return this.http.get<Part[]>(this.apiUrl);
  }

  getPart(id: number): Observable<Part> {
    return this.http.get<Part>(`${this.apiUrl}${id}`);
  }

  getPartHistory(partId: number): Observable<ComparisonJob[]> {
    return this.http.get<ComparisonJob[]>(`${this.apiUrl}${partId}/jobs`);
  }

  deletePart(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}`);
  }
}
