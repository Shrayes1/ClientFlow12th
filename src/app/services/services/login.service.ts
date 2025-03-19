import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = 'https://firrst-host-try.onrender.com/login'; // Replace with your actual Ngrok API URL

  constructor(private http: HttpClient) {}

  authenticate(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, credentials);
  }
}

