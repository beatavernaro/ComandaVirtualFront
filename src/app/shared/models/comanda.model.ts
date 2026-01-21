export interface Comanda {
  id: string;
  nomeCliente: string;
  celular: string;
  status: 'ABERTA' | 'ENCERRADA';
  total: number;
  dataCriacao: Date;
  dataEncerramento?: Date;
}
