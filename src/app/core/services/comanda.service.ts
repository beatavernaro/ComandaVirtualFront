import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Comanda } from '../../shared/models/comanda.model';
import { ItemComanda } from '../../shared/models/item-comanda.model';
import { ApiService } from './api.service';

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

  constructor(private apiService: ApiService) {
    this.carregarComandaAtual();
  }

  criarComanda(nomeCliente: string, celular: string): Observable<Comanda> {
    const novaComanda: Comanda = {
      id: this.generateId(),
      nomeCliente,
      celular,
      status: 'ABERTA',
      total: 0,
      dataCriacao: new Date(),
    };

    // Mock implementation
    this.comandasMock.push(novaComanda);
    this.salvarComandaLocal(novaComanda);
    this.comandaAtualSubject.next(novaComanda);

    return of(novaComanda);
    // return this.apiService.post<Comanda>('comandas', novaComanda);
  }

  adicionarItem(item: Omit<ItemComanda, 'id' | 'comandaId'>): Observable<ItemComanda> {
    let comandaAtual = this.comandaAtualSubject.value;
    console.log('Estado atual da comanda:', comandaAtual);

    // Se não há comanda ativa, cria uma temporária
    if (!comandaAtual) {
      console.log('Criando comanda temporária...');
      const comandaTemp: Comanda = {
        id: this.generateId(),
        nomeCliente: 'Cliente',
        celular: '',
        status: 'ABERTA',
        total: 0,
        dataCriacao: new Date(),
      };

      this.comandasMock.push(comandaTemp);
      this.salvarComandaLocal(comandaTemp);
      this.comandaAtualSubject.next(comandaTemp);
      comandaAtual = comandaTemp;
      console.log('Comanda temporária criada:', comandaTemp);
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

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
