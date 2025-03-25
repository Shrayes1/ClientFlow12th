import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuestionnaireService {
  private apiUrl = 'https://a691-14-143-149-238.ngrok-free.app';

  constructor(private http: HttpClient) {}

  // Fetch questions for a given client_id
  getQuestions(clientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/fetch_qa/${clientId}`);
  }

  // Add a new question
  addQuestion(clientId: string, question: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const body = new URLSearchParams();
    body.set('client_id', clientId);
    body.set('questions', JSON.stringify([{ text: question }]));

    return this.http.post(`${this.apiUrl}/insert_form/`, body.toString(), { headers });
  }
}