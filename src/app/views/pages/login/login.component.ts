import { Component } from '@angular/core';
import { NgStyle } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { IconDirective } from '@coreui/icons-angular';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
    ButtonDirective,
  ],
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  errorMessage: string = '';
  loading = false;
  private apiUrl = 'https://firrst-host-try.onrender.com/login';

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
    this.errorMessage = '';
    console.log('Login button clicked');

    if (this.loginForm.invalid) {
      console.log('Form is invalid:', this.loginForm.errors);
      return;
    }

    this.loading = true;
    const payload = this.loginForm.value;
    console.log('Sending payload to server:', payload);

    this.http.post<any>(this.apiUrl, payload, { observe: 'response' }).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Server response:', response);
        console.log('Response body:', response.body);
        if (response.body && (response.body.token || response.body.success)) {
          console.log('Login successful, token:', response.body.token || 'none');
          localStorage.setItem('authToken', response.body.token || 'no-token');
          console.log('Navigating to /views/contract-add'); // Updated log
          this.router.navigate(['/contract-add']).then(success => {
            console.log('Navigation success:', success);
            if (!success) {
              this.errorMessage = 'Failed to navigate to contract-add page';
            }
          });
        } else {
          console.log('No token or success indicator in response');
          this.errorMessage = 'Invalid login credentials or no valid response';
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        console.error('Server error:', err);
        const serverError = err.error?.error || 'Unknown server error';
        this.errorMessage = `Authentication failed: ${serverError}. Please try again.`;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}