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
  private comandasMock: Comanda[] = [
    {
      id: 'cmd-001',
      sessionId: 'sess-001',
      nomeCliente: 'João Silva',
      celular: '(11) 99999-1111',
      status: 'ABERTA',
      total: 25.5,
      dataCriacao: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
    },
    {
      id: 'cmd-002',
      sessionId: 'sess-002',
      nomeCliente: 'Maria Santos',
      celular: '(11) 99999-2222',
      status: 'ABERTA',
      total: 18.0,
      dataCriacao: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
    },
    {
      id: 'cmd-003',
      sessionId: 'sess-003',
      nomeCliente: 'Pedro Costa',
      celular: '(11) 99999-3333',
      status: 'ENCERRADA',
      total: 42.75,
      dataCriacao: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 horas atrás
      dataEncerramento: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
    },
    {
      id: 'cmd-004',
      sessionId: 'sess-004',
      nomeCliente: 'Ana Oliveira',
      celular: '(11) 99999-4444',
      status: 'ENCERRADA',
      total: 31.2,
      dataCriacao: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
      dataEncerramento: new Date(Date.now() - 22 * 60 * 60 * 1000), // 22 horas atrás
    },
  ];

  private itensMock: ItemComanda[] = [
    // Itens da cmd-001 (João Silva)
    {
      id: 'item-001',
      comandaId: 'cmd-001',
      nome: 'Coca-Cola 350ml',
      valorUnitario: 5.5,
      quantidade: 2,
      origem: 'CATALOGO',
    },
    {
      id: 'item-002',
      comandaId: 'cmd-001',
      nome: 'Batata Frita',
      valorUnitario: 14.5,
      quantidade: 1,
      origem: 'CATALOGO',
    },
    // Itens da cmd-002 (Maria Santos)
    {
      id: 'item-003',
      comandaId: 'cmd-002',
      nome: 'Suco de Laranja',
      valorUnitario: 6.0,
      quantidade: 2,
      origem: 'CATALOGO',
    },
    {
      id: 'item-004',
      comandaId: 'cmd-002',
      nome: 'Cookies',
      valorUnitario: 6.0,
      quantidade: 1,
      origem: 'MANUAL',
    },
    // Itens da cmd-003 (Pedro Costa)
    {
      id: 'item-005',
      comandaId: 'cmd-003',
      nome: 'Pizza Individual',
      valorUnitario: 22.0,
      quantidade: 1,
      origem: 'CATALOGO',
    },
    {
      id: 'item-006',
      comandaId: 'cmd-003',
      nome: 'Refrigerante 600ml',
      valorUnitario: 7.5,
      quantidade: 2,
      origem: 'CATALOGO',
    },
    {
      id: 'item-007',
      comandaId: 'cmd-003',
      nome: 'Sobremesa especial',
      valorUnitario: 5.75,
      quantidade: 1,
      origem: 'MANUAL',
    },
    // Itens da cmd-004 (Ana Oliveira)
    {
      id: 'item-008',
      comandaId: 'cmd-004',
      nome: 'Hambúrguer',
      valorUnitario: 18.5,
      quantidade: 1,
      origem: 'CATALOGO',
    },
    {
      id: 'item-009',
      comandaId: 'cmd-004',
      nome: 'Água 500ml',
      valorUnitario: 3.5,
      quantidade: 2,
      origem: 'CATALOGO',
    },
    {
      id: 'item-010',
      comandaId: 'cmd-004',
      nome: 'Brownie',
      valorUnitario: 5.7,
      quantidade: 1,
      origem: 'MANUAL',
    },
  ];

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

  /**
   * Obter itens de uma comanda específica (para admin)
   */
  obterItensComanda(comandaId: string): Observable<ItemComanda[]> {
    const itens = this.itensMock.filter((item) => item.comandaId === comandaId);
    return of(itens);
    // return this.apiService.get<ItemComanda[]>(`comandas/${comandaId}/itens`);
  }

  /**
   * Encerrar uma comanda específica (para admin)
   */
  encerrarComandaAdmin(comandaId: string): Observable<Comanda> {
    const comanda = this.comandasMock.find((c) => c.id === comandaId);
    if (!comanda) {
      throw new Error('Comanda não encontrada');
    }

    if (comanda.status === 'ENCERRADA') {
      throw new Error('Comanda já está encerrada');
    }

    const comandaEncerrada: Comanda = {
      ...comanda,
      status: 'ENCERRADA',
      dataEncerramento: new Date(),
    };

    // Atualizar no mock
    const index = this.comandasMock.findIndex((c) => c.id === comandaId);
    if (index > -1) {
      this.comandasMock[index] = comandaEncerrada;
    }

    // Se for a comanda atual ativa, limpar a sessão
    const comandaAtual = this.comandaAtualSubject.value;
    if (comandaAtual?.id === comandaId) {
      this.limparComandaLocal();
      this.comandaAtualSubject.next(comandaEncerrada);
    }

    return of(comandaEncerrada);
    // return this.apiService.put<Comanda>(`comandas/${comandaId}/encerrar`, {});
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
