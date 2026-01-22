import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { SessionService } from '../services/session.service';

@Injectable({
  providedIn: 'root',
})
export class SessionGuard implements CanActivate {
  constructor(
    private sessionService: SessionService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    const hasActiveSession = this.sessionService.hasActiveSession();

    if (!hasActiveSession) {
      // Redirecionar para a página de início se não há sessão ativa
      this.router.navigate(['/start']);
      return false;
    }

    // Atualizar última atividade
    this.sessionService.updateLastActivity();

    return true;
  }
}
