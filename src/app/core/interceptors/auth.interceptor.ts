import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AdminAuthService } from '../services/admin-auth.service';
import { LocalStorageService } from '../services/local-storage.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const adminAuthService = inject(AdminAuthService);
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);

  // Endpoints que requerem autenticação admin
  const adminEndpoints = [
    '/api/admin',
    '/api/auth'
  ];

  // Endpoints que requerem token de usuário (JWT da comanda)
  const userAuthEndpoints = [
    '/api/produtos',
    '/api/itens-comanda'
  ];

  // Endpoints completamente públicos (sem token)
  const publicEndpoints = [
    '/api/comandas/celular/',
    '/api/comandas/' // POST criar comanda é público
  ];

  const isAdminEndpoint = adminEndpoints.some(endpoint => 
    req.url.includes(endpoint)
  );
  
  const isUserAuthEndpoint = userAuthEndpoints.some(endpoint => 
    req.url.includes(endpoint)
  );

  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    req.url.includes(endpoint)
  );

  // Verificar se é GET de comanda por ID (público)
  const isGetComandaById = req.method === 'GET' && req.url.match(/\/api\/comandas\/[^\/]+$/) && 
    !req.url.includes('/itens');

  let authReq = req;

  if (isAdminEndpoint) {
    // Usar token admin
    const adminToken = adminAuthService.getToken();
    if (adminToken) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
    }
  } else if (isUserAuthEndpoint && !isPublicEndpoint) {
    // Usar token de usuário
    const userToken = localStorageService.getAccessToken();
    if (userToken) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${userToken}`,
        },
      });
    }
  } else if (req.method === 'PUT' && req.url.includes('/api/comandas/') && req.url.includes('/encerrar')) {
    // Encerrar comanda requer token de usuário
    const userToken = localStorageService.getAccessToken();
    if (userToken) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${userToken}`,
        },
      });
    }
  } else if (!isPublicEndpoint && !isGetComandaById) {
    // Para outros endpoints que não são explicitamente públicos, tentar usar token de usuário
    const userToken = localStorageService.getAccessToken();
    if (userToken) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${userToken}`,
        },
      });
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (isAdminEndpoint) {
          // Token admin expirado
          adminAuthService.logout();
          router.navigate(['/admin/login']);
        } else {
          // Token de usuário expirado
          localStorageService.clearUserData();
          router.navigate(['/start']);
        }
      } else if (error.status === 403) {
        // Tentativa de modificar comanda de outro cliente
        console.warn('Tentativa de modificar comanda de outro cliente');
        // Redirecionar para tela inicial para criar nova comanda
        localStorageService.clearUserData();
        router.navigate(['/start']);
      }
      return throwError(() => error);
    }),
  );
};
