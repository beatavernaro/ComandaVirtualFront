import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Comanda } from '../../../shared/models/comanda.model';
import { ComandaService } from '../../../core/services/comanda.service';
import { AdminAuthService } from '../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatBadgeModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  comandas$!: Observable<Comanda[]>;
  comandasAbertas$!: Observable<Comanda[]>;
  comandasEncerradas$!: Observable<Comanda[]>;
  totalAbertas$!: Observable<number>;
  totalEncerradas$!: Observable<number>;
  sidenavOpened = true;

  menuItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/admin/dashboard' },
    { icon: 'restaurant_menu', label: 'Comandas', route: '/admin/comandas' },
    { icon: 'inventory', label: 'Produtos', route: '/admin/produtos' },
  ];

  constructor(
    private comandaService: ComandaService,
    private adminAuthService: AdminAuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.comandas$ = this.comandaService.obterComandas();

    this.comandasAbertas$ = this.comandas$.pipe(
      map((comandas) => comandas.filter((c) => c.status === 'ABERTA')),
    );

    this.comandasEncerradas$ = this.comandas$.pipe(
      map((comandas) => comandas.filter((c) => c.status === 'ENCERRADA')),
    );

    this.totalAbertas$ = this.comandasAbertas$.pipe(map((comandas) => comandas.length));

    this.totalEncerradas$ = this.comandasEncerradas$.pipe(map((comandas) => comandas.length));
  }

  logout(): void {
    this.adminAuthService.logout();
    this.router.navigate(['/admin/login']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
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

  calcularTotalReceita(): Observable<number> {
    return this.comandasEncerradas$.pipe(
      map((comandas) => comandas.reduce((total, comanda) => total + comanda.total, 0)),
    );
  }
}
