import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Mock credentials
  private mockAdmin = {
    email: 'admin@luderia.com',
    password: 'admin123',
  };

  constructor(private apiService: ApiService) {
    this.verificarToken();
  }

  login(email: string, password: string): Observable<{ token: string; success: boolean }> {
    // Mock implementation
    if (email === this.mockAdmin.email && password === this.mockAdmin.password) {
      const token = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('adminToken', token);
      this.isAuthenticatedSubject.next(true);
      return of({ token, success: true });
    }

    return of({ token: '', success: false });
    // return this.apiService.post<{ token: string; success: boolean }>('auth/login', { email, password });
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
