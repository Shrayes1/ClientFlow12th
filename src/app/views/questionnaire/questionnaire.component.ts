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
  private apiBaseUrl = 'https://13c7-14-143-149-238.ngrok-free.app';
  clientId!: string;
  otherUserId!: string; // Add this to specify which user's answers to fetch
  questions: { question_id: string; text: string; answer: string | null; otherUserAnswer?: string }[] = [];
  newQuestionText: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'] || '001';
      this.otherUserId = params['otherUserId'] || '002'; // Add parameter for other user's ID
      this.fetchQuestionsAndAnswers();
    });
  }

  fetchQuestionsAndAnswers() {
    this.loading = true;
    this.errorMessage = '';
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': '69420'
    });

    // First fetch the questions for current client
    this.http.get(`${this.apiBaseUrl}/fetch_qa/${this.clientId}`, { 
      headers: headers, 
      responseType: 'text' 
    }).subscribe(
      (response: string) => {
        try {
          const data = JSON.parse(response);
          this.questions = data.responses.map((q: any) => ({
            question_id: q.question_id.toString(),
            text: q.question,
            answer: q.answer || null
          }));

          // Then fetch answers from the other user
          this.fetchOtherUserAnswers();
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

  fetchOtherUserAnswers() {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': '69420'
    });

    // Assuming your API has an endpoint to fetch answers by user ID
    this.http.get(`${this.apiBaseUrl}/fetch_qa/0001`, { 
      headers: headers, 
      responseType: 'text' 
    }).subscribe(
      (response: string) => {
        try {
          const data = JSON.parse(response);
          const otherUserResponses = data.responses;
          
          // Match other user's answers with current questions
          this.questions = this.questions.map(question => {
            const matchingResponse = otherUserResponses.find(
              (r: any) => r.question_id.toString() === question.question_id
            );
            return {
              ...question,
              otherUserAnswer: matchingResponse?.answer || null
            };
          });
          this.loading = false;
        } catch (error) {
          console.error('Failed to parse other user answers:', error);
          this.errorMessage = '⚠️ Invalid response format for other user answers.';
          this.loading = false;
        }
      },
      error => {
        console.error('Error fetching other user answers:', error);
        this.errorMessage = '⚠️ Failed to load other user answers: ' + (error.message || 'Unknown error');
        this.loading = false;
      }
    );
  }

  addQuestion() {
    if (!this.newQuestionText.trim()) {
      this.errorMessage = '⚠️ Please enter a question.';
      return;
    }

    const payloadData = {
      client_id: this.clientId,
      questions: [{ text: this.newQuestionText }]
    };

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
        this.newQuestionText = '';
        this.fetchQuestionsAndAnswers(); // Refresh both questions and answers
      },
      error => {
        console.error('Error adding question:', error);
        this.errorMessage = '⚠️ Failed to add question: ' + (error.message || 'Unknown error');
        this.loading = false;
      }
    );
  }

  trackByQuestion(index: number, question: any): string {
    return question.question_id;
  }
}