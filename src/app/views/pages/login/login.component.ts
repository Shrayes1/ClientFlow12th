import { Component } from '@angular/core';
import { NgStyle } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { IconDirective } from '@coreui/icons-angular';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http'; // ✅ Added for API call

import {
  ContainerComponent,
  RowComponent,
  ColComponent,
  CardGroupComponent,
  TextColorDirective,
  CardComponent,
  CardBodyComponent,
  FormDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  FormControlDirective,
  ButtonDirective,
} from '@coreui/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardGroupComponent,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    FormDirective,
    InputGroupComponent,
    InputGroupTextDirective,
    IconDirective,
    FormControlDirective,
    ButtonDirective
  ],
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  errorMessage: string = ''; // ✅ Added for error handling
  private apiUrl = 'https://firrst-host-try.onrender.com/login'; // 🔹 Replace with your actual API endpoint

  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, this.usernameValidator]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  usernameValidator(control: any) {
    const username = control.value;
    if (username && !username.includes('@')) {
      return { invalidUsername: true };
    }
    return null;
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    // 🔹 Call authentication API
    this.http.post<any>(this.apiUrl, this.loginForm.value).subscribe({
      next: (response) => {
        if (response.token) {
          localStorage.setItem('authToken', response.token); // ✅ Store JWT token
          this.router.navigate(['/views/contract-add']); // ✅ Redirect to Dashboard
        } else {
          this.errorMessage = 'Invalid login credentials';
        }
      },
      error: (err) => {
        console.error('Login failed', err);
        this.errorMessage = 'Authentication failed. Please try again.';
      }
    });
  }
}
