import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Observable } from 'rxjs';
import { Comanda } from '../../../shared/models/comanda.model';
import { ComandaService } from '../../../core/services/comanda.service';

@Component({
  selector: 'app-encerrada',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './encerrada.component.html',
  styleUrl: './encerrada.component.scss',
})
export class EncerradaComponent implements OnInit {
  comandaAtual$!: Observable<Comanda | null>;

  // Dados de Pix mockados - em um ambiente real, viriam da configuração
  pixDados = {
    chave: 'contato@luderia.com.br',
    banco: 'Banco do Brasil',
    favorecido: 'Luderia Jogos e Diverso LTDA',
    cnpj: '12.345.678/0001-90',
  };

  constructor(
    private comandaService: ComandaService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.comandaAtual$ = this.comandaService.comandaAtual$;
  }

  novaComanda(): void {
    this.router.navigate(['/']);
  }

  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  }

  formatarData(data: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(data));
  }

  copiarChavePix(): void {
    navigator.clipboard.writeText(this.pixDados.chave).then(() => {
      // Could show a snackbar here
    });
  }
}
