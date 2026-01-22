import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Comanda } from '../../shared/models/comanda.model';
import { ItemComanda } from '../../shared/models/item-comanda.model';
import { ApiService } from './api.service';
import { SessionService, SessionData } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class ComandaService {
  private comandaAtualSubject = new BehaviorSubject<Comanda | null>(null);
  public comandaAtual$ = this.comandaAtualSubject.asObservable();

  private itensComandaSubject = new BehaviorSubject<ItemComanda[]>([]);
  public itensComanda$ = this.itensComandaSubject.asObservable();

  // Mock data para desenvolvimento
  private comandasMock: Comanda[] = [];
  private itensMock: ItemComanda[] = [];

  constructor(
    private apiService: ApiService,
    private sessionService: SessionService,
  ) {
    this.initializeService();
  }

  private initializeService(): void {
    // Assinar as mudanças de sessão
    this.sessionService.session$.subscribe((session) => {
      if (session?.comandaId) {
        this.carregarComandaPorId(session.comandaId);
      } else if (!session) {
        // Sessão encerrada, limpar comanda atual
        this.comandaAtualSubject.next(null);
        this.itensComandaSubject.next([]);
      }
    });

    // Carregar comanda existente se houver
    this.carregarComandaAtual();
  }

  criarComanda(nomeCliente: string, celular: string): Observable<Comanda> {
    // Primeiro criar a sessão
    const session = this.sessionService.createSession(nomeCliente, celular);

    const novaComanda: Comanda = {
      id: this.generateId(),
      sessionId: session.sessionId,
      nomeCliente,
      celular,
      status: 'ABERTA',
      total: 0,
      dataCriacao: new Date(),
    };

    // Salvar a comanda
    this.comandasMock.push(novaComanda);
    this.salvarComandaLocal(novaComanda);
    this.comandaAtualSubject.next(novaComanda);

    // Vincular comanda à sessão
    this.sessionService.setComandaId(novaComanda.id);

    return of(novaComanda);
    // return this.apiService.post<Comanda>('comandas', novaComanda);
  }

  adicionarItem(item: Omit<ItemComanda, 'id' | 'comandaId'>): Observable<ItemComanda> {
    let comandaAtual = this.comandaAtualSubject.value;
    const session = this.sessionService.getCurrentSession();

    // Se não há comanda ativa mas há sessão, tentar criar comanda
    if (!comandaAtual && session) {
      console.log('Criando comanda baseada na sessão atual...');
      const comandaTemp: Comanda = {
        id: this.generateId(),
        sessionId: session.sessionId,
        nomeCliente: session.nomeCliente,
        celular: session.celular,
        status: 'ABERTA',
        total: 0,
        dataCriacao: new Date(),
      };

      this.comandasMock.push(comandaTemp);
      this.salvarComandaLocal(comandaTemp);
      this.comandaAtualSubject.next(comandaTemp);
      this.sessionService.setComandaId(comandaTemp.id);
      comandaAtual = comandaTemp;
      console.log('Comanda criada baseada na sessão:', comandaTemp);
    } else if (!comandaAtual) {
      throw new Error('Não é possível adicionar item sem sessão ativa');
    }

    // Verifica se já existe um item com o mesmo nome
    const itemExistente = this.itensMock.find(
      (existingItem) =>
        existingItem.comandaId === comandaAtual.id && existingItem.nome === item.nome,
    );

    if (itemExistente) {
      // Se já existe, incrementa a quantidade
      console.log('Item já existe, incrementando quantidade:', itemExistente);
      itemExistente.quantidade += item.quantidade;
      this.atualizarItens();
      this.atualizarTotal();
      console.log('Quantidade atualizada:', itemExistente);
      return of(itemExistente);
    } else {
      // Se não existe, cria novo item
      const novoItem: ItemComanda = {
        id: this.generateId(),
        comandaId: comandaAtual.id,
        ...item,
      };

      console.log('Adicionando novo item:', novoItem);
      this.itensMock.push(novoItem);
      this.atualizarItens();
      this.atualizarTotal();
      console.log('Itens atuais:', this.itensMock);
      console.log('Total de itens:', this.itensComandaSubject.value.length);
      return of(novoItem);
    }

    // return this.apiService.post<ItemComanda>('itens-comanda', novoItem);
  }

  removerItem(itemId: string): Observable<void> {
    // Mock implementation
    const index = this.itensMock.findIndex((item) => item.id === itemId);
    if (index > -1) {
      this.itensMock.splice(index, 1);
      this.atualizarItens();
      this.atualizarTotal();
    }

    return of(void 0);
    // return this.apiService.delete<void>(`itens-comanda/${itemId}`);
  }

  alterarQuantidadeItem(itemId: string, novaQuantidade: number): Observable<ItemComanda | null> {
    if (novaQuantidade <= 0) {
      // Se quantidade é 0 ou negativa, remove o item
      return this.removerItem(itemId).pipe(map(() => null));
    }

    // Mock implementation
    const index = this.itensMock.findIndex((item) => item.id === itemId);
    if (index > -1) {
      this.itensMock[index].quantidade = novaQuantidade;
      this.atualizarItens();
      this.atualizarTotal();
      return of(this.itensMock[index]);
    }

    return of(null);
    // return this.apiService.put<ItemComanda>(`itens-comanda/${itemId}`, { quantidade: novaQuantidade });
  }

  aumentarQuantidade(itemId: string): Observable<ItemComanda | null> {
    const item = this.itensMock.find((item) => item.id === itemId);
    if (item) {
      return this.alterarQuantidadeItem(itemId, item.quantidade + 1);
    }
    return of(null);
  }

  diminuirQuantidade(itemId: string): Observable<ItemComanda | null> {
    const item = this.itensMock.find((item) => item.id === itemId);
    if (item) {
      return this.alterarQuantidadeItem(itemId, item.quantidade - 1);
    }
    return of(null);
  }

  encerrarComanda(): Observable<Comanda> {
    const comandaAtual = this.comandaAtualSubject.value;
    if (!comandaAtual) {
      throw new Error('Nenhuma comanda ativa');
    }

    const comandaEncerrada: Comanda = {
      ...comandaAtual,
      status: 'ENCERRADA',
      dataEncerramento: new Date(),
    };

    // Mock implementation
    const index = this.comandasMock.findIndex((c) => c.id === comandaAtual.id);
    if (index > -1) {
      this.comandasMock[index] = comandaEncerrada;
    }

    this.limparComandaLocal();
    this.comandaAtualSubject.next(comandaEncerrada);

    return of(comandaEncerrada);
    // return this.apiService.put<Comanda>(`comandas/${comandaAtual.id}/encerrar`, {});
  }

  obterComandas(): Observable<Comanda[]> {
    return of(this.comandasMock);
    // return this.apiService.get<Comanda[]>('comandas');
  }

  private carregarComandaAtual(): void {
    const comandaId = localStorage.getItem('comandaId');
    if (comandaId) {
      // Busca no mock ou cria se não encontrar
      let comanda = this.comandasMock.find((c) => c.id === comandaId && c.status === 'ABERTA');

      if (!comanda) {
        // Se não encontrou no mock, cria uma nova baseada no localStorage
        comanda = {
          id: comandaId,
          nomeCliente: localStorage.getItem('nomeCliente') || 'Cliente',
          celular: localStorage.getItem('celular') || '',
          status: 'ABERTA',
          total: 0,
          dataCriacao: new Date(),
        };
        this.comandasMock.push(comanda);
      }

      this.comandaAtualSubject.next(comanda);
      this.atualizarItens();
    }
  }

  private salvarComandaLocal(comanda: Comanda): void {
    localStorage.setItem('comandaId', comanda.id);
    localStorage.setItem('nomeCliente', comanda.nomeCliente);
    localStorage.setItem('celular', comanda.celular);
  }

  private limparComandaLocal(): void {
    localStorage.removeItem('comandaId');
    localStorage.removeItem('nomeCliente');
    localStorage.removeItem('celular');
    // Limpa também os itens da memória
    this.itensMock = [];
    this.itensComandaSubject.next([]);
  }

  private atualizarItens(): void {
    const comandaAtual = this.comandaAtualSubject.value;
    if (comandaAtual) {
      const itens = this.itensMock.filter((item) => item.comandaId === comandaAtual.id);
      this.itensComandaSubject.next(itens);
    }
  }

  private atualizarTotal(): void {
    const comandaAtual = this.comandaAtualSubject.value;
    if (comandaAtual) {
      const itens = this.itensMock.filter((item) => item.comandaId === comandaAtual.id);
      const total = itens.reduce((acc, item) => acc + item.valorUnitario * item.quantidade, 0);

      comandaAtual.total = total;
      this.comandaAtualSubject.next({ ...comandaAtual });
    }
  }

  /**
   * Carregar comanda específica por ID
   */
  private carregarComandaPorId(comandaId: string): void {
    const comanda = this.comandasMock.find((c) => c.id === comandaId);
    if (comanda) {
      this.comandaAtualSubject.next(comanda);
      this.atualizarItens();
    }
  }

  /**
   * Verificar se há sessão ativa
   */
  hasActiveSession(): boolean {
    return this.sessionService.hasActiveSession();
  }

  /**
   * Obter dados da sessão atual
   */
  getCurrentSession(): SessionData | null {
    return this.sessionService.getCurrentSession();
  }

  /**
   * Recuperar comanda baseada no celular
   */
  async recuperarComanda(celular: string): Promise<Comanda | null> {
    try {
      // Tentar recuperar sessão
      const session = await this.sessionService.recoverSession(celular);
      if (session?.comandaId) {
        const comanda = this.comandasMock.find((c) => c.id === session.comandaId);
        if (comanda && comanda.status === 'ABERTA') {
          this.comandaAtualSubject.next(comanda);
          this.atualizarItens();
          return comanda;
        }
      }
      return null;
    } catch (error) {
      console.error('Erro ao recuperar comanda:', error);
      return null;
    }
  }

  /**
   * Encerrar sessão e comanda
   */
  encerrarSessao(): Observable<Comanda> {
    const comandaEncerrada = this.encerrarComanda();
    this.sessionService.endSession();
    return comandaEncerrada;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
