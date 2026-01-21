import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule, MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Produto } from '../../../shared/models/produto.model';
import { ItemComanda } from '../../../shared/models/item-comanda.model';
import { ProdutoService } from '../../../core/services/produto.service';
import { ComandaService } from '../../../core/services/comanda.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-add-item-manual',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="bottom-sheet-content">
      <h3>Adicionar Item Manual</h3>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome do produto</mat-label>
          <input matInput formControlName="nome" placeholder="Ex: Água sem gás" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Valor (R$)</mat-label>
          <input matInput formControlName="preco" type="number" step="0.01" placeholder="0.00" />
        </mat-form-field>

        <div class="actions">
          <button type="button" mat-button (click)="onCancel()">Cancelar</button>
          <button type="submit" mat-raised-button color="primary" [disabled]="form.invalid">
            Adicionar
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .bottom-sheet-content {
        padding: 24px;
      }
      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
      }
    `,
  ],
})
export class AddItemManualComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private bottomSheet: MatBottomSheet,
    private comandaService: ComandaService,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      preco: ['', [Validators.required, Validators.min(0.01)]],
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const { nome, preco } = this.form.value;
      this.comandaService
        .adicionarItem({
          nome,
          valorUnitario: parseFloat(preco),
          quantidade: 1,
          origem: 'MANUAL',
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Item adicionado!', 'Fechar', { duration: 2000 });
            this.bottomSheet.dismiss();
          },
          error: () => {
            this.snackBar.open('Erro ao adicionar item', 'Fechar', { duration: 3000 });
          },
        });
    }
  }

  onCancel(): void {
    this.bottomSheet.dismiss();
  }
}

@Component({
  selector: 'app-cardapio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatBottomSheetModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatDividerModule,
    HeaderComponent,
  ],
  templateUrl: './cardapio.component.html',
  styleUrl: './cardapio.component.scss',
})
export class CardapioComponent implements OnInit {
  produtos$!: Observable<Produto[]>;
  produtosFiltrados$!: Observable<Produto[]>;
  itensComanda$!: Observable<ItemComanda[]>;
  totalItens = 0;
  searchControl = new FormControl('');

  constructor(
    private produtoService: ProdutoService,
    private comandaService: ComandaService,
    private bottomSheet: MatBottomSheet,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.produtos$ = this.produtoService
      .obterProdutosAtivos()
      .pipe(map((produtos) => produtos.sort((a, b) => a.nome.localeCompare(b.nome))));

    // Combina produtos com filtro de busca
    this.produtosFiltrados$ = combineLatest([
      this.produtos$,
      this.searchControl.valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([produtos, busca]) => {
        if (!busca?.trim()) {
          return produtos;
        }
        return produtos.filter((produto) =>
          produto.nome.toLowerCase().includes(busca.toLowerCase()),
        );
      }),
    );

    this.itensComanda$ = this.comandaService.itensComanda$;

    this.itensComanda$.subscribe((itens) => {
      this.totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);
    });
  }

  adicionarProduto(produto: Produto): void {
    console.log('Tentando adicionar produto:', produto);

    this.comandaService
      .adicionarItem({
        nome: produto.nome,
        valorUnitario: produto.preco,
        quantidade: 1,
        origem: 'CATALOGO',
      })
      .subscribe({
        next: (item) => {
          console.log('Produto adicionado com sucesso:', item);
          this.snackBar
            .open(`✓ ${produto.nome} adicionado à comanda!`, 'Ver Comanda', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['success-snackbar'],
            })
            .onAction()
            .subscribe(() => {
              this.irParaCarrinho();
            });
        },
        error: (error) => {
          console.error('Erro ao adicionar produto:', error);
          this.snackBar.open('❌ Erro ao adicionar produto', 'Tentar Novamente', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  abrirItemManual(): void {
    this.bottomSheet.open(AddItemManualComponent);
  }

  onNavClick(route: string): void {
    this.router.navigate([`/${route}`]);
  }

  onSearchChange(searchTerm: string): void {
    this.searchControl.setValue(searchTerm);
  }

  irParaCarrinho(): void {
    this.router.navigate(['/carrinho']);
  }

  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  }
}
