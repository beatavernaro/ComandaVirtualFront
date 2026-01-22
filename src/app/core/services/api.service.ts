import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl || 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`).pipe(catchError(this.handleError));
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}/${endpoint}`, data)
      .pipe(catchError(this.handleError));
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, data).pipe(catchError(this.handleError));
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`).pipe(catchError(this.handleError));
  }

  // Métodos específicos para sessões
  createSession<T>(sessionData: any): Observable<T> {
    return this.post<T>('sessions', sessionData);
  }

  updateSession<T>(sessionId: string, sessionData: any): Observable<T> {
    return this.put<T>(`sessions/${sessionId}`, sessionData);
  }

  getSessionByPhone<T>(celular: string): Observable<T> {
    return this.get<T>(`sessions/phone/${celular}`);
  }

  // Métodos específicos para comandas
  getComandaBySession<T>(sessionId: string): Observable<T> {
    return this.get<T>(`comandas/session/${sessionId}`);
  }

  syncComanda<T>(comandaData: T): Observable<T> {
    return this.post<T>('comandas/sync', comandaData);
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}
