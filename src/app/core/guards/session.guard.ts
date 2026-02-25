import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class SessionGuard implements CanActivate {
  constructor(
    private localStorageService: LocalStorageService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    const hasValidUserData = this.localStorageService.hasValidUserData();

    if (!hasValidUserData) {
      // Redirecionar para a página de início se não há dados válidos
      this.router.navigate(['/start']);
      return false;
    }

    // Atualizar última atividade
    this.localStorageService.updateLastActivity();

    return true;
  }
}
