import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  templateUrl: './questionnaire.component.html',
  styleUrls: ['./questionnaire.component.scss'],
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule]
})
export class QuestionnaireComponent implements OnInit {
  private apiBaseUrl = 'https://9aae-14-143-149-238.ngrok-free.app'; // Base API URL
  clientId!: string;
  questions: { text: string }[] = [{ text: '' }];
  // ✅ Store questions as objects
  submittedQuestions: any[] = [];
  loading: boolean = false;
  errorMessage: string = '';

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'];
      if (this.clientId) {
        this.fetchQuestions();
      }
    });
  }

  fetchQuestions() {
    this.loading = true;
    this.http.get(`${this.apiBaseUrl}/api/fetch_form?client_id=${this.clientId}`).subscribe(
      (data: any) => {
        this.submittedQuestions = data.questions || [];
        this.loading = false;
      },
      error => {
        this.errorMessage = '⚠️ Failed to load questions.';
        this.loading = false;
      }
    );
  }

  addQuestion() {
    this.questions.push({ text: '' }); // ✅ Adds an empty paragraph question
  }

  removeQuestion(index: number) {
    if (this.questions.length > 1) {
      this.questions.splice(index, 1); // ✅ Prevents accidental removal of the last question
    }
  }

  submitQuestions() {
    const filteredQuestions = this.questions.filter(q => q.text.trim().length > 1);
    if (filteredQuestions.length === 0) {
      this.errorMessage = '⚠️ Please enter at least one valid question.';
      return;
    }

    const questionData = filteredQuestions.map(q => ({
      clientId: this.clientId,
      question: q.text
    }));

    this.loading = true;
    this.errorMessage = '';
    this.http.post(`${this.apiBaseUrl}/api/insert_form`, questionData).subscribe(
      () => {
        this.submittedQuestions.push(...filteredQuestions.map(q => ({ text: q.text, answer: null })));
        this.questions = [{ text: '' }]; // ✅ Reset form after successful submission
        this.loading = false;
      },
      () => {
        this.errorMessage = '⚠️ Failed to add questions.';
        this.loading = false;
      }
    );
  }
}
