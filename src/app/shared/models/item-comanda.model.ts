export interface ItemComanda {
  id?: string;
  comandaId: string;
  produtoId?: string; // ID do produto para matching mais confiável
  nome: string;
  valorUnitario: number;
  quantidade: number;
  origem: 'CATALOGO' | 'MANUAL';
}
