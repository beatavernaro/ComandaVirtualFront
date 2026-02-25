import { ItemComanda as ApiItemComanda } from './api.interfaces';

export interface ItemComanda extends ApiItemComanda {}

// Interface para compatibilidade com código existente
export interface ItemComandaLegacy {
  id?: string;
  comandaId: string;
  produtoId?: string;
  nome: string;
  valorUnitario: number;
  quantidade: number;
  origem: 'CATALOGO' | 'MANUAL';
}
