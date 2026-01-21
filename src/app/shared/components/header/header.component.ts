import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="header-container">
      <mat-toolbar class="custom-toolbar">
        <div class="toolbar-content">
          <div class="nav-buttons">
            <button
              mat-stroked-button
              class="nav-btn"
              [class.active]="currentRoute === 'cardapio'"
              (click)="onNavClick('cardapio')"
            >
              <mat-icon>restaurant_menu</mat-icon>
              Cardápio
            </button>

            <button
              mat-stroked-button
              class="nav-btn"
              [class.active]="currentRoute === 'carrinho'"
              (click)="onNavClick('carrinho')"
            >
              Comanda
              @if (totalItens > 0) {
                <span class="badge">{{ totalItens }}</span>
              }
            </button>
          </div>

          @if (showSearchField) {
            <mat-form-field appearance="outline" class="search-field">
              <input
                matInput
                [formControl]="searchControl"
                placeholder="Buscar produtos..."
                (input)="onSearchChange($event)"
              />
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
          }
        </div>
      </mat-toolbar>
    </div>
  `,
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() currentRoute: string = '';
  @Input() totalItens: number = 0;
  @Input() showSearchField: boolean = true;
  @Output() navClick = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();

  searchControl = new FormControl('');

  onNavClick(route: string): void {
    this.navClick.emit(route);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }
}
