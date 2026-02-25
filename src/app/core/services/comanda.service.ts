import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, catchError, tap, throwError, map, of, switchMap } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LocalStorageService } from './local-storage.service';
import { 
  Comanda as ApiComanda,
  ItemComanda,
  CreateItemComandaRequest,
  UpdateItemComandaRequest,
  CreateComandaRequest,
  CreateComandaResponse,
  ComandaStatus
} from '../../shared/models/api.interfaces';
import { Comanda, ComandaResumo } from '../../shared/models/comanda.model';

@Injectable({
  providedIn: 'root',
})
export class ComandaService {
  private comandaAtualSubject = new BehaviorSubject<Comanda | null>(null);
  public comandaAtual$ = this.comandaAtualSubject.asObservable();

  private itensComandaSubject = new BehaviorSubject<ItemComanda[]>([]);
  public itensComanda$ = this.itensComandaSubject.asObservable();

  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService,
    private router: Router
  ) {}

  // === MÉTODOS DE COMANDA ===

  /**
   * Lista todas as comandas (Admin) - Compatível com interface antiga
   */
  obterTodasComandas(filtros?: { status?: string, dataInicio?: string, dataFim?: string }): Observable<ComandaResumo[]> {
    let queryParams = '';
    const params = [];
    
    if (filtros?.status) params.push(`status=${filtros.status}`);
    if (filtros?.dataInicio) params.push(`dataInicio=${filtros.dataInicio}`);
    if (filtros?.dataFim) params.push(`dataFim=${filtros.dataFim}`);
    
    if (params.length > 0) {
      queryParams = '?' + params.join('&');
    }

    return this.http.get<ApiComanda[]>(`${this.baseUrl}/comandas${queryParams}`).pipe(
      map(comandas => comandas.map(this.convertToComandaResumo)),
      catchError(this.handleError)
    );
  }

  /**
   * Lista todas as comandas completas (para admin)
   */
  obterComandasCompletas(filtros?: { status?: string, dataInicio?: string, dataFim?: string }): Observable<Comanda[]> {
    let queryParams = '';
    const params = [];
    
    if (filtros?.status) params.push(`status=${filtros.status}`);
    if (filtros?.dataInicio) params.push(`dataInicio=${filtros.dataInicio}`);
    if (filtros?.dataFim) params.push(`dataFim=${filtros.dataFim}`);
    
    if (params.length > 0) {
      queryParams = '?' + params.join('&');
    }

    return this.http.get<ApiComanda[]>(`${this.baseUrl}/comandas${queryParams}`).pipe(
      map(comandas => comandas.map(this.convertToComanda)),
      catchError(this.handleError)
    );
  }

  /**
   * Buscar comanda aberta por celular
   */
  buscarComandaPorCelular(celular: string): Observable<Comanda | null> {
    return this.http.get<ApiComanda>(`${this.baseUrl}/comandas/celular/${celular}`).pipe(
      map(comanda => {
        if (comanda) {
          const comandaConvertida = this.convertToComanda(comanda);
          this.comandaAtualSubject.next(comandaConvertida);
          if (comanda.itens) {
            this.itensComandaSubject.next(comanda.itens);
          }
          return comandaConvertida;
        }
        return null;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          // Comanda não encontrada é um caso normal
          return of(null);
        }
        console.error('Erro ao buscar comanda por celular:', error);
        return of(null);
      })
    );
  }

  /**
   * Criar nova comanda com dados do usuário
   */
  criarNovaComanda(nomeCliente: string, celular: string): Observable<Comanda> {
    const comandaData: CreateComandaRequest = {
      nomeCliente: nomeCliente.trim(),
      celular: celular.trim()
    };

    return this.http.post<CreateComandaResponse>(`${this.baseUrl}/comandas`, comandaData).pipe(
      tap(response => {
        // Salvar o token JWT no localStorage
        this.localStorageService.saveAccessToken(response.accessToken);
        
        // Atualizar comanda atual
        const comandaConvertida = this.convertToComanda(response.comanda);
        this.comandaAtualSubject.next(comandaConvertida);
      }),
      map(response => this.convertToComanda(response.comanda)),
      catchError(this.handleError)
    );
  }

  /**
   * Criar nova comanda ou obter comanda existente - método legacy
   * @deprecated Use buscarComandaPorCelular ou criarNovaComanda diretamente
   */
  criarOuObterComanda(): Observable<Comanda> {
    const userData = this.localStorageService.getUserData();
    
    if (!userData || !userData.nomeCliente || !userData.celular) {
      return throwError(() => new Error('Dados do usuário não encontrados'));
    }

    // Se já tem comandaId, buscar por ID
    if (userData.comandaId) {
      return this.buscarComanda(userData.comandaId);
    }

    // Caso contrário, buscar por celular ou criar nova
    return this.buscarComandaPorCelular(userData.celular).pipe(
      map((comanda) => {
        if (comanda) {
          this.localStorageService.updateComandaId(comanda.id);
          return comanda;
        }
        throw new Error('Comanda não encontrada');
      }),
      catchError(() => this.criarNovaComanda(userData.nomeCliente, userData.celular))
    );
  }

  /**
   * Buscar comanda por ID
   */
  buscarComanda(id: number | string): Observable<Comanda> {
    return this.http.get<ApiComanda>(`${this.baseUrl}/comandas/${id}`).pipe(
      tap(comanda => {
        const comandaConvertida = this.convertToComanda(comanda);
        this.comandaAtualSubject.next(comandaConvertida);
        if (comanda.itens) {
          this.itensComandaSubject.next(comanda.itens);
        }
      }),
      map(this.convertToComanda),
      catchError(this.handleError)
    );
  }

  /**
   * Obter comanda atual - Compatível com interface antiga
   */
  obterComandaAtual(): Observable<Comanda | null> {
    return this.comandaAtual$;
  }

  /**
   * Sincronizar dados da comanda
   */
  sincronizarComanda(): Observable<Comanda> {
    const userData = this.localStorageService.getUserData();
    const comandaAtual = this.comandaAtualSubject.value;

    if (!userData || !comandaAtual) {
      return throwError(() => new Error('Dados do usuário ou comanda não encontrada'));
    }

    // Para a nova abordagem, uma sincronização simples pode ser apenas recarregar a comanda
    return this.buscarComanda(comandaAtual.id);
  }

  /**
   * Encerrar comanda
   */
  encerrarComanda(): Observable<void> {
    const comandaAtual = this.comandaAtualSubject.value;
    
    if (!comandaAtual) {
      return throwError(() => new Error('Nenhuma comanda ativa encontrada'));
    }

    return this.http.put<void>(`${this.baseUrl}/comandas/${comandaAtual.id}/encerrar`, {}).pipe(
      tap(() => {
        // Atualizar status local
        const comandaEncerrada = { ...comandaAtual, status: 'ENCERRADA' as ComandaStatus };
        this.comandaAtualSubject.next(comandaEncerrada);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obter itens de uma comanda específica (para admin)
   */
  obterItensComanda(comandaId: string): Observable<ItemComanda[]> {
    return this.http.get<ItemComanda[]>(`${this.baseUrl}/comandas/${comandaId}/itens`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Encerrar comanda específica (para admin)
   */
  encerrarComandaAdmin(comandaId: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/comandas/${comandaId}/encerrar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  // === MÉTODOS DE ITENS ===

  /**
   * Adicionar item à comanda
   */
  adicionarItem(produtoId: number, quantidade: number, observacoes?: string): Observable<ItemComanda> {
    const comandaAtual = this.comandaAtualSubject.value;
    
    if (!comandaAtual) {
      return throwError(() => new Error('Nenhuma comanda ativa encontrada'));
    }

    const itemData: CreateItemComandaRequest = {
      comandaId: comandaAtual.id.toString(),
      produtoId: produtoId.toString(),
      quantidade
    };

    return this.http.post<ItemComanda>(`${this.baseUrl}/itens-comanda`, itemData).pipe(
      tap(novoItem => {
        const itensAtuais = this.itensComandaSubject.value;
        this.itensComandaSubject.next([...itensAtuais, novoItem]);
        this.atualizarValorTotal();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Aumentar quantidade de um item
   */
  aumentarQuantidade(itemId: string): Observable<ItemComanda> {
    const item = this.itensComandaSubject.value.find(i => i.id === itemId);
    
    if (!item) {
      return throwError(() => new Error('Item não encontrado'));
    }

    const novaQuantidade = item.quantidade + 1;
    
    return this.atualizarQuantidadeItem(itemId, novaQuantidade);
  }

  /**
   * Diminuir quantidade de um item
   */
  diminuirQuantidade(itemId: string): Observable<ItemComanda> {
    const item = this.itensComandaSubject.value.find(i => i.id === itemId);
    
    if (!item) {
      return throwError(() => new Error('Item não encontrado'));
    }

    const novaQuantidade = item.quantidade - 1;

    if (novaQuantidade <= 0) {
      return this.removerItem(itemId).pipe(
        map(() => item) // Retorna o item removido
      );
    }

    return this.atualizarQuantidadeItem(itemId, novaQuantidade);
  }

  /**
   * Atualizar quantidade de um item
   */
  private atualizarQuantidadeItem(itemId: string, novaQuantidade: number): Observable<ItemComanda> {
    const comandaAtual = this.comandaAtualSubject.value;
    
    if (!comandaAtual) {
      return throwError(() => new Error('Nenhuma comanda ativa encontrada'));
    }

    const updateData: UpdateItemComandaRequest = {
      quantidade: novaQuantidade
    };

    return this.http.put<ItemComanda>(`${this.baseUrl}/itens-comanda/${itemId}`, updateData).pipe(
      tap(itemAtualizado => {
        const itensAtuais = this.itensComandaSubject.value;
        const indice = itensAtuais.findIndex(i => i.id === itemId);
        
        if (indice !== -1) {
          const novosItens = [...itensAtuais];
          novosItens[indice] = itemAtualizado;
          this.itensComandaSubject.next(novosItens);
          this.atualizarValorTotal();
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Remover item da comanda
   */
  removerItem(itemId: string): Observable<void> {
    const comandaAtual = this.comandaAtualSubject.value;
    
    if (!comandaAtual) {
      return throwError(() => new Error('Nenhuma comanda ativa encontrada'));
    }

    return this.http.delete<void>(`${this.baseUrl}/itens-comanda/${itemId}`).pipe(
      tap(() => {
        const itensAtuais = this.itensComandaSubject.value;
        const novosItens = itensAtuais.filter(i => i.id !== itemId);
        this.itensComandaSubject.next(novosItens);
        this.atualizarValorTotal();
      }),
      catchError(this.handleError)
    );
  }

  // === MÉTODOS AUXILIARES ===

  /**
   * Calcular valor total da comanda
   */
  calcularValorTotal(): number {
    const itens = this.itensComandaSubject.value;
    return itens.reduce((total, item) => total + (item.valorUnitario * item.quantidade), 0);
  }

  /**
   * Verificar se a comanda pode ser modificada
   */
  comandaPodeSerModificada(): boolean {
    const comanda = this.comandaAtualSubject.value;
    return comanda ? comanda.status === 'ABERTA' : false;
  }

  /**
   * Limpar dados da comanda atual
   */
  limparComanda(): void {
    this.comandaAtualSubject.next(null);
    this.itensComandaSubject.next([]);
  }

  /**
   * Obter comanda atual sincronamente
   */
  getComandaAtual(): Comanda | null {
    return this.comandaAtualSubject.value;
  }

  /**
   * Atualizar valor total da comanda
   */
  private atualizarValorTotal(): void {
    const comandaAtual = this.comandaAtualSubject.value;
    if (comandaAtual) {
      const valorTotal = this.calcularValorTotal();
      const comandaAtualizada = { ...comandaAtual, valorTotal };
      this.comandaAtualSubject.next(comandaAtualizada);
    }
  }

  /**
   * Converter ApiComanda para Comanda
   */
  private convertToComanda = (apiComanda: ApiComanda): Comanda => {
    return {
      id: apiComanda.id,
      nomeCliente: apiComanda.nomeCliente,
      celular: apiComanda.celular,
      status: apiComanda.status,
      valorTotal: apiComanda.valorTotal || 0,
      total: apiComanda.total || apiComanda.valorTotal || 0,
      dataCriacao: apiComanda.dataCriacao,
      dataEncerramento: apiComanda.dataEncerramento,
      observacoes: apiComanda.observacoes,
      itens: apiComanda.itens || []
    };
  }

  /**
   * Converter ApiComanda para ComandaResumo
   */
  private convertToComandaResumo = (apiComanda: ApiComanda): ComandaResumo => {
    return {
      id: apiComanda.id,
      nomeCliente: apiComanda.nomeCliente,
      status: apiComanda.status,
      valorTotal: apiComanda.valorTotal || 0,
      quantidadeItens: apiComanda.itens?.length || 0,
      dataCriacao: apiComanda.dataCriacao
    };
  }

  /**
   * Manipulador de erros
   */
  private handleError = (error: HttpErrorResponse) => {
    console.error('Erro na requisição:', error);
    
    if (error.status === 401) {
      // Token expirado ou inválido
      this.localStorageService.clearUserData();
      this.router.navigate(['/start']);
    } else if (error.status === 403) {
      // Tentativa de modificar comanda de outro cliente
      console.warn('Tentativa de acessar comanda de outro cliente');
      this.localStorageService.clearUserData();
      this.router.navigate(['/start']);
    }
    
    return throwError(() => error);
  }
}