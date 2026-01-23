import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <mat-sidenav-container class="admin-container">
      <mat-sidenav opened="true" mode="side" class="admin-sidenav" disableClose="true">
        <div class="sidenav-header">
          <img src="/logo.png" alt="Logo" class="logo-image" />
          <h3>Angatu Admin</h3>
        </div>

        <mat-nav-list>
          <mat-list-item
            *ngFor="let item of menuItems"
            (click)="navigateTo(item.route)"
            class="menu-item"
            [class.active]="isActive(item.route)"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </mat-list-item>

          <mat-divider></mat-divider>

          <mat-list-item (click)="logout()" class="menu-item logout-item">
            <mat-icon matListItemIcon>exit_to_app</mat-icon>
            <span matListItemTitle>Sair</span>
          </mat-list-item>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content class="admin-content">
        <router-outlet></router-outlet>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  menuItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/admin/dashboard' },
    { icon: 'restaurant_menu', label: 'Comandas', route: '/admin/comandas' },
    { icon: 'inventory', label: 'Produtos', route: '/admin/produtos' },
  ];

  constructor(
    private adminAuthService: AdminAuthService,
    private router: Router,
  ) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  logout(): void {
    this.adminAuthService.logout();
    this.router.navigate(['/admin/login']);
  }
}
