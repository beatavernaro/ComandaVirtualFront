import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Produto } from '../../shared/models/produto.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  // Mock data para desenvolvimento
  private produtosMock: Produto[] = [
    { id: '1', nome: 'Água Mineral', preco: 3.0, ativo: true },
    { id: '2', nome: 'Refrigerante Coca-Cola', preco: 5.0, ativo: true },
    { id: '3', nome: 'Salgadinho Doritos', preco: 8.0, ativo: true },
    { id: '4', nome: 'Sanduíche Natural', preco: 12.0, ativo: true },
    { id: '5', nome: 'Café Espresso', preco: 4.0, ativo: true },
  ];

  constructor(private apiService: ApiService) {}

  obterProdutosAtivos(): Observable<Produto[]> {
    const produtosAtivos = this.produtosMock.filter((p) => p.ativo);
    return of(produtosAtivos);
    // return this.apiService.get<Produto[]>('produtos/ativos');
  }

  obterTodosProdutos(): Observable<Produto[]> {
    return of(this.produtosMock);
    // return this.apiService.get<Produto[]>('produtos');
  }

  criarProduto(produto: Omit<Produto, 'id'>): Observable<Produto> {
    const novoProduto: Produto = {
      id: this.generateId(),
      ...produto,
    };

    this.produtosMock.push(novoProduto);
    return of(novoProduto);
    // return this.apiService.post<Produto>('produtos', produto);
  }

  atualizarProduto(id: string, produto: Partial<Produto>): Observable<Produto> {
    const index = this.produtosMock.findIndex((p) => p.id === id);
    if (index > -1) {
      this.produtosMock[index] = { ...this.produtosMock[index], ...produto };
      return of(this.produtosMock[index]);
    }
    throw new Error('Produto não encontrado');
    // return this.apiService.put<Produto>(`produtos/${id}`, produto);
  }

  desativarProduto(id: string): Observable<void> {
    const index = this.produtosMock.findIndex((p) => p.id === id);
    if (index > -1) {
      this.produtosMock[index].ativo = false;
    }
    return of(void 0);
    // return this.apiService.put<void>(`produtos/${id}/desativar`, {});
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
