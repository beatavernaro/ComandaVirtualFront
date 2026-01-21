import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-produtos',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div style="padding: 24px;">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>inventory</mat-icon>
            Gerenciamento de Produtos
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Página de gerenciamento de produtos em desenvolvimento...</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class AdminProdutosComponent {}
