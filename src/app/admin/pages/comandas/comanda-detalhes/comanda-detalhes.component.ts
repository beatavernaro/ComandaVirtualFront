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
import { switchMap, map, catchError, shareReplay } from 'rxjs/operators';
import { of } from 'rxjs';
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

      <div *ngIf="!(comanda$ | async); else content" class="loading-container">
        <mat-spinner diameter="60"></mat-spinner>
        <p>Carregando detalhes da comanda...</p>
      </div>

      <ng-template #content>
        <ng-container *ngIf="comanda$ | async as comanda">
          <div class="content-container">
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
                  <span>{{ comanda.dataCriacao | date: 'dd/MM/yyyy' }}</span>
                </div>
                <div *ngIf="comanda.dataEncerramento" class="info-item">
                  <strong>Encerrada em:</strong>
                  <span>{{ comanda.dataEncerramento | date: 'dd/MM/yyyy' }}</span>
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
          <ng-container *ngIf="itens$ | async as itens">
            <h2 class="section-title">
              <mat-icon>shopping_cart</mat-icon>
              Itens da Comanda ({{ itens.length }})
            </h2>

            <div *ngIf="itens.length === 0" class="no-items">
              <mat-icon>shopping_cart_off</mat-icon>
              <p>Nenhum item adicionado à comanda</p>
            </div>

            <div *ngIf="itens.length > 0" class="itens-table-container">
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
          </ng-container>
        </div>
        </div>
      </ng-container>
      </ng-template>

      <div *ngIf="(comanda$ | async) === null" class="error-container">
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
  comanda$!: Observable<Comanda | null>;
  itens$!: Observable<ItemComanda[]>;
  displayedColumns: string[] = ['quantidade', 'nome', 'valorUnitario', 'valorTotal'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comandaService: ComandaService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    const comandaId = this.route.snapshot.params['id'];
    if (comandaId) {
      this.comanda$ = this.comandaService.obterComandasCompletas().pipe(
        map((comandas) => comandas.find((c) => c.id === comandaId) || null),
        catchError((error) => {
          console.error('Erro ao carregar comanda:', error);
          this.snackBar.open('Erro ao carregar comanda', 'Fechar', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return of(null);
        }),
        shareReplay(1),
      );

      this.itens$ = this.comanda$.pipe(
        switchMap((comanda) => {
          if (!comanda) {
            return of([]);
          }
          return this.comandaService.obterItensComanda(comanda.id).pipe(
            catchError((error) => {
              console.error('Erro ao carregar itens:', error);
              this.snackBar.open('Erro ao carregar itens da comanda', 'Fechar', { 
                duration: 3000,
                panelClass: ['error-snackbar']
              });
              return of([]);
            }),
          );
        }),
        shareReplay(1),
      );
    }
  }

  encerrarComanda(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Encerrar Comanda',
        message: 'Tem certeza que deseja encerrar esta comanda?',
        confirmText: 'Encerrar',
        cancelText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.comanda$.pipe(
          switchMap((comanda) => {
            if (!comanda) {
              return of(null);
            }
            return this.comandaService.encerrarComandaAdmin(comanda.id);
          }),
          catchError((error) => {
            console.error('Erro ao encerrar comanda:', error);
            this.snackBar.open('Erro ao encerrar comanda', 'Fechar', {
              duration: 3000,
              panelClass: ['error-snackbar'],
            });
            return of(null);
          }),
        ).subscribe((result) => {
          if (result !== null) {
            this.snackBar.open('Comanda encerrada com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
            setTimeout(() => location.reload(), 1500);
          }
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
          this.snackBar.open('Quantidade atualizada!', 'OK', { 
            duration: 1500,
            panelClass: ['success-snackbar']
          });
          setTimeout(() => location.reload(), 1000);
        },
        error: () => {
          this.snackBar.open('Erro ao atualizar quantidade', 'OK', { 
            duration: 2000,
            panelClass: ['error-snackbar']
          });
        },
      });
    }
  }

  diminuirQuantidade(item: ItemComanda): void {
    if (item.id) {
      if (item.quantidade === 1) {
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
                this.snackBar.open('Item removido!', 'OK', { 
                  duration: 2000,
                  panelClass: ['success-snackbar']
                });
                setTimeout(() => location.reload(), 1000);
              },
              error: () => {
                this.snackBar.open('Erro ao remover item', 'OK', { 
                  duration: 3000,
                  panelClass: ['error-snackbar']
                });
              },
            });
          }
        });
      } else {
        this.comandaService.diminuirQuantidade(item.id).subscribe({
          next: () => {
            this.snackBar.open('Quantidade atualizada!', 'OK', { 
              duration: 1500,
              panelClass: ['success-snackbar']
            });
            setTimeout(() => location.reload(), 1000);
          },
          error: () => {
            this.snackBar.open('Erro ao atualizar quantidade', 'OK', { 
              duration: 2000,
              panelClass: ['error-snackbar']
            });
          },
        });
      }
    }
  }
}
