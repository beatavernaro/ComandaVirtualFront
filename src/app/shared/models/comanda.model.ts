export interface Comanda {
  id: string;
  sessionId?: string;
  nomeCliente: string;
  celular: string;
  status: 'ABERTA' | 'ENCERRADA';
  total: number;
  dataCriacao: Date;
  dataEncerramento?: Date;
  observacoes?: string;
}

export interface ComandaResumo {
  id: string;
  nomeCliente: string;
  total: number;
  quantidadeItens: number;
  status: 'ABERTA' | 'ENCERRADA';
  dataCriacao: Date;
}
