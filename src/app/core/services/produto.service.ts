import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LocalStorageService } from './local-storage.service';
import { 
  Produto, 
  CreateProdutoRequest, 
  UpdateProdutoRequest 
} from '../../shared/models/api.interfaces';

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService,
    private router: Router
  ) {}

  /**
   * Listar produtos ativos (público)
   */
  obterProdutosAtivos(): Observable<Produto[]> {
    return this.http.get<Produto[]>(`${this.baseUrl}/produtos/ativos`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Listar todos os produtos (Admin)
   */
  obterTodosProdutos(): Observable<Produto[]> {
    return this.http.get<Produto[]>(`${this.baseUrl}/produtos`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Buscar produto por ID
   */
  obterProdutoPorId(id: string): Observable<Produto> {
    return this.http.get<Produto>(`${this.baseUrl}/produtos/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Criar novo produto (Admin)
   */
  criarProduto(produto: CreateProdutoRequest): Observable<Produto> {
    return this.http.post<Produto>(`${this.baseUrl}/produtos`, produto).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Atualizar produto (Admin)
   */
  atualizarProduto(id: string, updates: UpdateProdutoRequest): Observable<Produto> {
    return this.http.put<Produto>(`${this.baseUrl}/produtos/${id}`, updates).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Desativar produto (Admin)
   */
  desativarProduto(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/produtos/${id}/desativar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Tratamento de erros
   */
  private handleError = (error: HttpErrorResponse) => {
    console.error('Erro no ProdutoService:', error);
    
    let errorMessage = 'Erro desconhecido';
    
    if (error.status === 401) {
      // Token expirado ou inválido
      this.localStorageService.clearUserData();
      this.router.navigate(['/start']);
      errorMessage = 'Sessão expirada. Faça login novamente.';
    } else if (error.status === 403) {
      // Acesso negado
      errorMessage = 'Acesso negado';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Erro de conexão com o servidor';
    } else if (error.status === 404) {
      errorMessage = 'Produto não encontrado';
    } else if (error.status === 400) {
      errorMessage = 'Dados inválidos';
    } else if (error.status >= 500) {
      errorMessage = 'Erro interno do servidor';
    }

    return throwError(() => new Error(errorMessage));
  }
}
