import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
 
@Component({
  selector: 'app-questionnaire',
  standalone: true,
  templateUrl: './questionnaire.component.html',
  styleUrls: ['./questionnaire.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ]
})
export class QuestionnaireComponent implements OnInit {
  private apiBaseUrl = 'https://a691-14-143-149-238.ngrok-free.app'; // Using the proxied path to avoid CORS issues
  clientId!: string;
  questions: { question_id: string; text: string; answer: string | null }[] = [];
  newQuestionText: string = ''; // For adding new questions
  loading: boolean = false;
  errorMessage: string = '';
 
  constructor(private http: HttpClient, private route: ActivatedRoute) {}
 
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'] || '001';
      this.fetchQuestions();
    });
  }
 
  fetchQuestions() {
    this.loading = true;
    this.errorMessage = '';
    console.log('Fetching questions for clientId:', this.clientId);
 
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': '69420'
    });
 
    this.http.get(`${this.apiBaseUrl}/fetch_qa/${this.clientId}`, { 
      headers: headers, 
      responseType: 'text' 
    }).subscribe(
      (response: string) => {
        console.log('Raw server response:', response);
 
        try {
          const data = JSON.parse(response);
          this.questions = data.responses.map((q: any) => ({
            question_id: q.question_id.toString(),
            text: q.question,
            answer: q.answer || null
          }));
          this.loading = false;
        } catch (error) {
          console.error('Failed to parse response as JSON:', error);
          this.errorMessage = '⚠️ Invalid response format from server.';
          this.loading = false;
        }
      },
      error => {
        console.error('Error fetching questions:', error);
        this.errorMessage = '⚠️ Failed to load questions: ' + (error.message || 'Unknown error');
        this.loading = false;
      }
    );
  }
 
  addQuestion() {
    if (!this.newQuestionText.trim()) {
      this.errorMessage = '⚠️ Please enter a question.';
      return;
    }
 
    // Create the payload for the new question
    const payloadData = {
      client_id: this.clientId,
      questions: [{ text: this.newQuestionText }]
    };
 
    // Convert the payload to FormData
    const formData = new FormData();
    formData.append('client_id', payloadData.client_id);
    formData.append('questions', JSON.stringify(payloadData.questions));
 
    this.loading = true;
    this.errorMessage = '';
 
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': '69420'
    });
 
    this.http.post(`${this.apiBaseUrl}/insert_form/`, formData, { headers }).subscribe(
      (response: any) => {
        this.loading = false;
        this.errorMessage = '✅ ' + response.message;
        this.newQuestionText = ''; // Clear the input field
        console.log('Add question response:', response);
        // Refresh the questions list after adding the new question
        this.fetchQuestions();
      },
      error => {
        console.error('Error adding question:', error);
        console.log('Error details:', error.error?.detail);
        this.errorMessage = '⚠️ Failed to add question: ' + (error.message || 'Unknown error');
        this.loading = false;
      }
    );
  }
 
  trackByQuestion(index: number, question: any): string {
    return question.question_id;
  }
}