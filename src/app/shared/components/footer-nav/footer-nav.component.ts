import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-footer-nav',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
  ],
  template: `
    <div class="footer-nav-container">
      <div class="footer-nav-content">
        <button
          mat-raised-button
          class="nav-btn"
          [class.active]="currentRoute === 'cardapio'"
          (click)="onNavClick('cardapio')"
        >
          <mat-icon>restaurant_menu</mat-icon>
          <span class="btn-label">Cardápio</span>
        </button>

        <button
          mat-raised-button
          class="nav-btn"
          [class.active]="currentRoute === 'carrinho'"
          (click)="onNavClick('carrinho')"
        >
          <mat-icon>shopping_cart</mat-icon>
          <span class="btn-label-wrapper">
            <span class="btn-label">Comanda</span>
            @if (totalItens > 0) {
              <span class="badge">{{ totalItens }}</span>
            }
          </span>
        </button>
      </div>
    </div>
  `,
  styleUrl: './footer-nav.component.scss',
})
export class FooterNavComponent {
  @Input() currentRoute: string = '';
  @Input() totalItens: number = 0;
  @Output() navClick = new EventEmitter<string>();

  onNavClick(route: string): void {
    this.navClick.emit(route);
  }
}
