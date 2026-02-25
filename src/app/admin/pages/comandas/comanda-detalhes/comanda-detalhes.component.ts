import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Comanda } from '../../../../shared/models/comanda.model';
import { ItemComanda } from '../../../../shared/models/item-comanda.model';
import { ComandaService } from '../../../../core/services/comanda.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-comanda-detalhes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-section">
        <button mat-icon-button (click)="voltar()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="page-title">
          <mat-icon>receipt</mat-icon>
          Detalhes da Comanda
        </h1>
      </div>

      <div *ngIf="carregando" class="loading-container">
        <mat-spinner diameter="60"></mat-spinner>
        <p>Carregando detalhes da comanda...</p>
      </div>

      <div *ngIf="!carregando && comanda" class="content-container">
        <div class="comanda-info-grid">
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>person</mat-icon>
                Informações do Cliente
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-item">
                <strong>Nome:</strong>
                <span>{{ comanda.nomeCliente }}</span>
              </div>
              <div class="info-item">
                <strong>Celular:</strong>
                <span>{{ comanda.celular }}</span>
              </div>
              <div class="info-item">
                <strong>ID da Comanda:</strong>
                <span>{{ comanda.id }}</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="status-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>info</mat-icon>
                Status da Comanda
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="status-info">
                <mat-chip-set>
                  <mat-chip [color]="comanda.status === 'ABERTA' ? 'accent' : 'primary'" selected>
                    {{ comanda.status }}
                  </mat-chip>
                </mat-chip-set>
                <div class="total-value">
                  <strong>Total: R$ {{ comanda.valorTotal | number: '1.2-2' }}</strong>
                </div>
              </div>
              <div class="dates-info">
                <div class="info-item">
                  <strong>Criada em:</strong>
                  <span>{{ comanda.dataCriacao | date: 'dd/MM/yyyy HH:mm:ss' }}</span>
                </div>
                <div *ngIf="comanda.dataEncerramento" class="info-item">
                  <strong>Encerrada em:</strong>
                  <span>{{ comanda.dataEncerramento | date: 'dd/MM/yyyy HH:mm:ss' }}</span>
                </div>
              </div>
            </mat-card-content>
            <mat-card-actions *ngIf="comanda.status === 'ABERTA'">
              <button mat-raised-button color="warn" (click)="encerrarComanda()">
                <mat-icon>close</mat-icon>
                Encerrar Comanda
              </button>
            </mat-card-actions>
          </mat-card>
        </div>

        <div class="itens-section">
          <h2 class="section-title">
            <mat-icon>shopping_cart</mat-icon>
            Itens da Comanda ({{ itens.length }})
          </h2>

          <div *ngIf="carregandoItens" class="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Carregando itens...</p>
          </div>

          <div *ngIf="!carregandoItens && itens.length === 0" class="no-items">
            <mat-icon>shopping_cart_off</mat-icon>
            <p>Nenhum item adicionado à comanda</p>
          </div>

          <div *ngIf="!carregandoItens && itens.length > 0" class="itens-table-container">
            <table mat-table [dataSource]="itens" class="itens-table">
              <ng-container matColumnDef="quantidade">
                <th mat-header-cell *matHeaderCellDef>Quantidade</th>
                <td mat-cell *matCellDef="let item">
                  <div class="quantity-controls">
                    <button
                      mat-icon-button
                      (click)="diminuirQuantidade(item)"
                      class="quantity-btn decrease"
                      matTooltip="Diminuir quantidade"
                    >
                      <mat-icon>remove</mat-icon>
                    </button>
                    <span class="quantity-display">{{ item.quantidade }}</span>
                    <button
                      mat-icon-button
                      (click)="aumentarQuantidade(item)"
                      class="quantity-btn increase"
                      matTooltip="Aumentar quantidade"
                    >
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="nome">
                <th mat-header-cell *matHeaderCellDef>Nome do Item</th>
                <td mat-cell *matCellDef="let item">
                  <span class="item-nome">{{ item.nome }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="valorUnitario">
                <th mat-header-cell *matHeaderCellDef>Valor Unitário</th>
                <td mat-cell *matCellDef="let item">
                  <span class="valor-unitario">R$ {{ item.valorUnitario | number: '1.2-2' }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="valorTotal">
                <th mat-header-cell *matHeaderCellDef>Valor Total</th>
                <td mat-cell *matCellDef="let item">
                  <span class="valor-total"
                    >R$ {{ item.quantidade * item.valorUnitario | number: '1.2-2' }}</span
                  >
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns" class="item-row"></tr>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="!carregando && !comanda" class="error-container">
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon>error</mat-icon>
            <h3>Comanda não encontrada</h3>
            <p>A comanda solicitada não foi encontrada ou não existe.</p>
            <button mat-raised-button color="primary" (click)="voltar()">
              <mat-icon>arrow_back</mat-icon>
              Voltar para Comandas
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styleUrl: './comanda-detalhes.component.scss',
})
export class ComandaDetalhesComponent implements OnInit {
  comanda: Comanda | null = null;
  itens: ItemComanda[] = [];
  carregando = true;
  carregandoItens = false;
  comandaId!: string;
  displayedColumns: string[] = ['quantidade', 'nome', 'valorUnitario', 'valorTotal'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comandaService: ComandaService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.comandaId = this.route.snapshot.params['id'];
    if (this.comandaId) {
      this.carregarComanda();
    } else {
      this.carregando = false;
    }
  }

  private carregarComanda(): void {
    this.comandaService.obterComandasCompletas().subscribe({
      next: (comandas) => {
        this.comanda = comandas.find((c) => c.id === this.comandaId) || null;
        if (this.comanda) {
          this.carregarItens();
        }
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar comanda:', error);
        this.carregando = false;
        this.snackBar.open('Erro ao carregar comanda', 'Fechar', { duration: 3000 });
      },
    });
  }

  private carregarItens(): void {
    if (!this.comanda) return;

    this.carregandoItens = true;
    this.comandaService.obterItensComanda(this.comanda.id).subscribe({
      next: (itens: ItemComanda[]) => {
        this.itens = itens;
        this.carregandoItens = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar itens:', error);
        this.carregandoItens = false;
        this.snackBar.open('Erro ao carregar itens da comanda', 'Fechar', { duration: 3000 });
      },
    });
  }

  encerrarComanda(): void {
    if (!this.comanda) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Encerrar Comanda',
        message: 'Tem certeza que deseja encerrar esta comanda?',
        confirmText: 'Encerrar',
        cancelText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed && this.comanda) {
        this.comandaService.encerrarComandaAdmin(this.comanda.id).subscribe({
          next: () => {
            // Atualizar status local
            if (this.comanda) {
              this.comanda.status = 'Encerrada' as any;
            }
            this.snackBar.open('Comanda encerrada com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
          },
          error: (error: any) => {
            console.error('Erro ao encerrar comanda:', error);
            this.snackBar.open('Erro ao encerrar comanda', 'Fechar', {
              duration: 3000,
              panelClass: ['error-snackbar'],
            });
          },
        });
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/admin/comandas']);
  }

  trackByItemId(index: number, item: ItemComanda): string {
    return item.id || index.toString();
  }

  aumentarQuantidade(item: ItemComanda): void {
    if (item.id) {
      this.comandaService.aumentarQuantidade(item.id).subscribe({
        next: () => {
          this.carregarItens(); // Recarrega os itens para atualizar a exibição
          this.snackBar.open('Quantidade atualizada!', 'OK', { duration: 1500 });
        },
        error: () => {
          this.snackBar.open('Erro ao atualizar quantidade', 'OK', { duration: 2000 });
        },
      });
    }
  }

  diminuirQuantidade(item: ItemComanda): void {
    if (item.id) {
      if (item.quantidade === 1) {
        // Se é o último item, confirma remoção com modal
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          data: {
            title: 'Remover Item',
            message: 'Deseja remover este item da comanda?',
            confirmText: 'Remover',
            cancelText: 'Cancelar',
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result && item.id) {
            this.comandaService.removerItem(item.id).subscribe({
              next: () => {
                this.carregarItens(); // Recarrega os itens
                this.snackBar.open('Item removido!', 'OK', { duration: 2000 });
              },
              error: () => {
                this.snackBar.open('Erro ao remover item', 'OK', { duration: 3000 });
              },
            });
          }
        });
      } else {
        this.comandaService.diminuirQuantidade(item.id).subscribe({
          next: () => {
            this.carregarItens(); // Recarrega os itens para atualizar a exibição
            this.snackBar.open('Quantidade atualizada!', 'OK', { duration: 1500 });
          },
          error: () => {
            this.snackBar.open('Erro ao atualizar quantidade', 'OK', { duration: 2000 });
          },
        });
      }
    }
  }
}
