import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ✅ Interface for Step 2 and 3 (Uploading Files)
export interface TaskFileData {
  username: string;
  client_id: string;
  file_name: string;
}

// ✅ Interface for Step 4 (Invoice)
export interface TaskInvoiceData {
  username: string;
  client_id: string;
  invoice_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private apiBaseUrl = 'https://9aae-14-143-149-238.ngrok-free.app';  // 🔹 Change to your API URL

  constructor(private http: HttpClient) {}

  // ✅ API to save task step progress
  saveTaskStep(client_id: string, username: string, step: number): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/saveTaskStep`, { client_id, username, step });
  }

  // ✅ API to save file upload progress (Step 2 & 3)
  saveTaskFile(data: TaskFileData): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/saveTaskFile`, data);
  }

  // ✅ API to save invoice (Step 4)
  saveTaskInvoice(data: TaskInvoiceData): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/saveTaskInvoice`, data);
  }
}
