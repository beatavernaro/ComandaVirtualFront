import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Produto } from '../../../../shared/models/produto.model';
import { ProdutoService } from '../../../../core/services/produto.service';
import { ComandaService } from '../../../../core/services/comanda.service';
import { Comanda } from '../../../../shared/models/comanda.model';
import { ItemComanda } from '../../../../shared/models/item-comanda.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-produto-detalhes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div style="padding: 24px;">
      <!-- Header com navegação -->
      <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 16px;">
        <button mat-icon-button (click)="voltar()" matTooltip="Voltar">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div style="display: flex; align-items: center; gap: 12px;">
          <mat-icon style="color: #556b2f; font-size: 32px; width: 32px; height: 32px;"
            >restaurant_menu</mat-icon
          >
          <h1 style="margin: 0; color: #556b2f; font-weight: 500; font-size: 28px;">
            {{ produto?.nome || 'Carregando...' }}
          </h1>
          <mat-chip
            *ngIf="produto && !produto.ativo"
            style="background-color: #ff5722; color: white;"
          >
            INATIVO
          </mat-chip>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;" *ngIf="produto">
        <!-- Informações básicas do produto -->
        <mat-card>
          <mat-card-header>
            <mat-card-title style="color: #556b2f;">
              <mat-icon>info</mat-icon>
              Informações do Produto
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div>
                <label style="font-weight: 500; color: #666; display: block; margin-bottom: 4px;"
                  >Nome:</label
                >
                <span style="font-size: 18px; color: #333;">{{ produto.nome }}</span>
              </div>
              <div>
                <label style="font-weight: 500; color: #666; display: block; margin-bottom: 4px;"
                  >Preço:</label
                >
                <span style="font-size: 24px; font-weight: 600; color: #556b2f;">
                  R$ {{ formatarMoeda(produto.preco) }}
                </span>
              </div>
              <div>
                <label style="font-weight: 500; color: #666; display: block; margin-bottom: 4px;"
                  >Status:</label
                >
                <mat-chip
                  [style.background-color]="produto.ativo ? '#4caf50' : '#ff5722'"
                  style="color: white;"
                >
                  {{ produto.ativo ? 'ATIVO' : 'INATIVO' }}
                </mat-chip>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Estatísticas do produto -->
        <mat-card>
          <mat-card-header>
            <mat-card-title style="color: #556b2f;">
              <mat-icon>analytics</mat-icon>
              Estatísticas de Vendas
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div
                style="text-align: center; padding: 16px; background-color: #f5f5f5; border-radius: 8px;"
              >
                <div style="font-size: 32px; font-weight: 600; color: #556b2f;">
                  {{ estatisticas.totalVendido }}
                </div>
                <div style="color: #666; font-size: 14px;">Total de Unidades Vendidas</div>
              </div>
              <div
                style="text-align: center; padding: 16px; background-color: #f5f5f5; border-radius: 8px;"
              >
                <div style="font-size: 32px; font-weight: 600; color: #556b2f;">
                  R$ {{ formatarMoeda(estatisticas.receitaTotal) }}
                </div>
                <div style="color: #666; font-size: 14px;">Receita Total Gerada</div>
              </div>
              <div
                style="text-align: center; padding: 16px; background-color: #f5f5f5; border-radius: 8px;"
              >
                <div style="font-size: 32px; font-weight: 600; color: #556b2f;">
                  {{ estatisticas.comandasComProduto }}
                </div>
                <div style="color: #666; font-size: 14px;">Comandas que Incluíram</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Ações do produto -->
      <div style="margin-top: 24px; display: flex; gap: 16px;" *ngIf="produto">
        <button
          mat-raised-button
          style="background-color: #556b2f; color: white;"
          (click)="editarProduto()"
        >
          <mat-icon>edit</mat-icon>
          Editar Produto
        </button>
        <button
          mat-raised-button
          [style.background-color]="produto.ativo ? '#ff5722' : '#4caf50'"
          style="color: white;"
          (click)="toggleStatus()"
        >
          <mat-icon>{{ produto.ativo ? 'toggle_off' : 'toggle_on' }}</mat-icon>
          {{ produto.ativo ? 'Desativar' : 'Ativar' }} Produto
        </button>
      </div>

      <!-- Loading state -->
      <div *ngIf="!produto" style="text-align: center; padding: 48px;">
        <mat-icon
          style="font-size: 64px; width: 64px; height: 64px; color: #ddd; animation: spin 1s linear infinite;"
          >sync</mat-icon
        >
        <p style="margin: 16px 0; color: #666;">Carregando informações do produto...</p>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      mat-card {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class ProdutoDetalhesComponent implements OnInit {
  produto: Produto | null = null;
  estatisticas = {
    totalVendido: 0,
    receitaTotal: 0,
    comandasComProduto: 0,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private produtoService: ProdutoService,
    private comandaService: ComandaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const produtoId = this.route.snapshot.paramMap.get('id');
    if (produtoId) {
      this.carregarProduto(produtoId);
      this.carregarEstatisticas(produtoId);
    }
  }

  private carregarProduto(id: string): void {
    this.produtoService.obterTodosProdutos().subscribe({
      next: (produtos) => {
        this.produto = produtos.find((p) => p.id === id) || null;
        if (!this.produto) {
          this.router.navigate(['/admin/produtos']);
        }
      },
      error: (error) => {
        console.error('Erro ao carregar produto:', error);
        this.router.navigate(['/admin/produtos']);
      },
    });
  }

  private carregarEstatisticas(produtoId: string): void {
    // Primeiro obter todos os produtos para encontrar o produto específico
    this.produtoService.obterTodosProdutos().subscribe({
      next: (produtos: Produto[]) => {
        const produto = produtos.find((p) => p.id === produtoId);

        if (!produto) {
          console.error('Produto não encontrado');
          return;
        }

        // Agora buscar estatísticas baseadas no nome do produto
        this.comandaService.obterComandas().subscribe({
          next: (comandas: Comanda[]) => {
            let totalVendido = 0;
            let receitaTotal = 0;
            let comandasComProduto = 0;
            let comandasProcessadas = 0;

            if (comandas.length === 0) {
              this.estatisticas = {
                totalVendido: 0,
                receitaTotal: 0,
                comandasComProduto: 0,
              };
              return;
            }

            // Para cada comanda, buscar seus itens
            comandas.forEach((comanda: Comanda) => {
              this.comandaService.obterItensComanda(comanda.id).subscribe({
                next: (itens: ItemComanda[]) => {
                  let temProduto = false;
                  itens.forEach((item: ItemComanda) => {
                    if (item.nome === produto.nome) {
                      totalVendido += item.quantidade;
                      receitaTotal += item.quantidade * item.valorUnitario;
                      if (!temProduto) {
                        temProduto = true;
                      }
                    }
                  });
                  if (temProduto) {
                    comandasComProduto++;
                  }

                  comandasProcessadas++;
                  // Atualizar estatísticas apenas quando todas as comandas foram processadas
                  if (comandasProcessadas === comandas.length) {
                    this.estatisticas = {
                      totalVendido,
                      receitaTotal,
                      comandasComProduto,
                    };
                  }
                },
              });
            });
          },
          error: (error: any) => {
            console.error('Erro ao carregar comandas:', error);
          },
        });
      },
      error: (error: any) => {
        console.error('Erro ao carregar produtos:', error);
      },
    });
  }

  voltar(): void {
    this.router.navigate(['/admin/produtos']);
  }

  formatarMoeda(valor: number): string {
    return valor.toFixed(2).replace('.', ',');
  }

  editarProduto(): void {
    if (this.produto) {
      this.router.navigate(['/admin/produtos', this.produto.id, 'editar']);
    }
  }

  toggleStatus(): void {
    if (!this.produto) return;

    const novoStatus = !this.produto.ativo;
    const acao = novoStatus ? 'ativar' : 'desativar';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `${acao.charAt(0).toUpperCase()}${acao.slice(1)} Produto`,
        message: `Tem certeza que deseja ${acao} o produto "${this.produto.nome}"?`,
        confirmText: acao.charAt(0).toUpperCase() + acao.slice(1),
        cancelText: 'Cancelar',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.produto && this.produto.id) {
        const produtoAtualizado = { ...this.produto, ativo: novoStatus };

        this.produtoService.atualizarProduto(this.produto.id, produtoAtualizado).subscribe({
          next: () => {
            this.produto!.ativo = novoStatus;
            const mensagem = `Produto ${acao === 'ativar' ? 'ativado' : 'desativado'} com sucesso!`;
            this.snackBar.open(mensagem, 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
          },
          error: (error) => {
            console.error(`Erro ao ${acao} produto:`, error);
            this.snackBar.open(`Erro ao ${acao} produto. Tente novamente.`, 'Fechar', {
              duration: 3000,
              panelClass: ['error-snackbar'],
            });
          },
        });
      }
    });
  }
}
