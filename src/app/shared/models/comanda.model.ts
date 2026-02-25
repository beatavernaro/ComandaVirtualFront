import { Comanda as ApiComanda, ItemComanda, ComandaStatus } from './api.interfaces';

export interface Comanda extends ApiComanda {}

export interface ComandaResumo {
  id: string;
  nomeCliente: string;
  valorTotal: number;
  quantidadeItens: number;
  status: string;
  dataCriacao: string;
}

export type { ItemComanda };
