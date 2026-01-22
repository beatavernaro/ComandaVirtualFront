import { Routes } from '@angular/router';
import { AdminAuthGuard } from './core/guards/admin-auth.guard';
import { SessionGuard } from './core/guards/session.guard';

export const routes: Routes = [
  // Rota padrão redireciona para start
  { path: '', redirectTo: '/start', pathMatch: 'full' },

  // Rotas públicas (cliente)
  {
    path: 'start',
    loadComponent: () =>
      import('./public/pages/start/start.component').then((m) => m.StartComponent),
  },
  {
    path: 'cardapio',
    canActivate: [SessionGuard],
    loadComponent: () =>
      import('./public/pages/cardapio/cardapio.component').then((m) => m.CardapioComponent),
  },
  {
    path: 'carrinho',
    canActivate: [SessionGuard],
    loadComponent: () =>
      import('./public/pages/carrinho/carrinho.component').then((m) => m.CarrinhoComponent),
  },
  {
    path: 'encerrada',
    loadComponent: () =>
      import('./public/pages/encerrada/encerrada.component').then((m) => m.EncerradaComponent),
  },

  // Rotas administrativas
  {
    path: 'admin',
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () =>
          import('./admin/pages/login/login.component').then((m) => m.AdminLoginComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/pages/dashboard/dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
        canActivate: [AdminAuthGuard],
      },
      {
        path: 'comandas',
        loadComponent: () =>
          import('./admin/pages/comandas/comandas.component').then((m) => m.AdminComandasComponent),
        canActivate: [AdminAuthGuard],
      },
      {
        path: 'produtos',
        loadComponent: () =>
          import('./admin/pages/produtos/produtos.component').then((m) => m.AdminProdutosComponent),
        canActivate: [AdminAuthGuard],
      },
    ],
  },

  // Rota para páginas não encontradas
  { path: '**', redirectTo: '/start' },
];
