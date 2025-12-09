import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { login } from '../components/auth/login/login.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.origin.replace(/\/+$/, '')}/api/Users`;

  constructor(private http: HttpClient) {}

  login(login:login): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`,login);
  }
}