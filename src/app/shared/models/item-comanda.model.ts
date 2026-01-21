export interface ItemComanda {
  id?: string;
  comandaId: string;
  nome: string;
  valorUnitario: number;
  quantidade: number;
  origem: 'CATALOGO' | 'MANUAL';
}
