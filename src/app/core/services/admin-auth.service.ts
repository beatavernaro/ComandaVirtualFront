import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, catchError, tap, of } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../../shared/models/api.interfaces';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    this.verificarToken();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const loginData: LoginRequest = { email, password };
    
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, loginData).pipe(
      tap(response => {
        if (response.success && response.token) {
          localStorage.setItem('adminToken', response.token);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Login error:', error);
        return of({ success: false, token: '' });
      })
    );
  }

  register(email: string, password: string, nome: string): Observable<RegisterResponse> {
    const registerData: RegisterRequest = { email, password, nome };
    
    return this.http.post<RegisterResponse>(`${this.baseUrl}/auth/register`, registerData).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Register error:', error);
        return of({ success: false, message: 'Erro ao criar administrador' });
      })
    );
  }

  logout(): void {
    localStorage.removeItem('adminToken');
    this.isAuthenticatedSubject.next(false);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('adminToken');
  }

  getToken(): string | null {
    return localStorage.getItem('adminToken');
  }

  private verificarToken(): void {
    const token = this.getToken();
    this.isAuthenticatedSubject.next(!!token);
  }
}
