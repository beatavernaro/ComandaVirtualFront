import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { ItemComanda } from '../../../shared/models/item-comanda.model';
import { Comanda } from '../../../shared/models/comanda.model';
import { ComandaService } from '../../../core/services/comanda.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule,
    HeaderComponent,
  ],
  templateUrl: './carrinho.component.html',
  styleUrl: './carrinho.component.scss',
})
export class CarrinhoComponent implements OnInit {
  itensComanda$!: Observable<ItemComanda[]>;
  comandaAtual$!: Observable<Comanda | null>;
  totalItens = 0;

  constructor(
    private comandaService: ComandaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.itensComanda$ = this.comandaService.itensComanda$;
    this.comandaAtual$ = this.comandaService.comandaAtual$;

    // Calcular total de itens para o header
    this.itensComanda$.subscribe((itens) => {
      this.totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);
    });
  }

  voltarCardapio(): void {
    this.router.navigate(['/cardapio']);
  }

  removerItem(item: ItemComanda): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remover Item',
        message: `Deseja remover "${item.nome}" da comanda?`,
        confirmText: 'Remover',
        cancelText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && item.id) {
        this.comandaService.removerItem(item.id).subscribe({
          next: () => {
            this.snackBar.open('Item removido!', 'Fechar', { duration: 2000 });
          },
          error: () => {
            this.snackBar.open('Erro ao remover item', 'Fechar', { duration: 3000 });
          },
        });
      }
    });
  }

  encerrarComanda(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Encerrar Comanda',
        message: 'Deseja finalizar sua comanda? Esta ação não pode ser desfeita.',
        confirmText: 'Finalizar',
        cancelText: 'Continuar Consumindo',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.comandaService.encerrarComanda().subscribe({
          next: () => {
            this.router.navigate(['/encerrada']);
          },
          error: () => {
            this.snackBar.open('Erro ao encerrar comanda', 'Fechar', { duration: 3000 });
          },
        });
      }
    });
  }

  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  }

  calcularSubtotal(item: ItemComanda): number {
    return item.valorUnitario * item.quantidade;
  }

  aumentarQuantidade(item: ItemComanda): void {
    if (item.id) {
      this.comandaService.aumentarQuantidade(item.id).subscribe({
        next: () => {
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
            message: `Deseja remover "${item.nome}" da comanda?`,
            confirmText: 'Remover',
            cancelText: 'Cancelar',
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result && item.id) {
            this.comandaService.removerItem(item.id).subscribe({
              next: () => {
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
            this.snackBar.open('Quantidade atualizada!', 'OK', { duration: 1500 });
          },
          error: () => {
            this.snackBar.open('Erro ao atualizar quantidade', 'OK', { duration: 2000 });
          },
        });
      }
    }
  }

  // Métodos para o HeaderComponent
  onNavClick(route: string): void {
    this.router.navigate([`/${route}`]);
  }

  getTotalItens(): number {
    return this.totalItens;
  }
}
