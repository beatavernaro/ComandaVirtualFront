import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface SessionData {
  sessionId: string;
  nomeCliente: string;
  celular: string;
  comandaId?: string;
  isActive: boolean;
  dataInicio: Date;
  dataUltimaAtividade: Date;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly SESSION_STORAGE_KEY = 'comanda_virtual_session';
  private readonly SESSION_BACKUP_KEY = 'comanda_virtual_session_backup';

  private sessionSubject = new BehaviorSubject<SessionData | null>(null);
  public session$ = this.sessionSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadSessionFromStorage();
  }

  /**
   * Inicia uma nova sessão com os dados do usuário
   */
  createSession(nomeCliente: string, celular: string): SessionData {
    const sessionData: SessionData = {
      sessionId: this.generateSessionId(),
      nomeCliente: nomeCliente.trim(),
      celular: celular.trim(),
      isActive: true,
      dataInicio: new Date(),
      dataUltimaAtividade: new Date(),
    };

    this.saveSession(sessionData);
    this.sessionSubject.next(sessionData);

    // Sincronizar com backend se disponível
    this.syncSessionWithBackend(sessionData);

    return sessionData;
  }

  /**
   * Atualiza a sessão atual
   */
  updateSession(updates: Partial<SessionData>): void {
    const currentSession = this.sessionSubject.value;
    if (currentSession) {
      const updatedSession: SessionData = {
        ...currentSession,
        ...updates,
        dataUltimaAtividade: new Date(),
      };

      this.saveSession(updatedSession);
      this.sessionSubject.next(updatedSession);

      // Sincronizar com backend
      this.syncSessionWithBackend(updatedSession);
    }
  }

  /**
   * Vincula uma comanda à sessão atual
   */
  setComandaId(comandaId: string): void {
    this.updateSession({ comandaId });
  }

  /**
   * Verifica se existe uma sessão ativa
   */
  hasActiveSession(): boolean {
    const session = this.sessionSubject.value;
    return session !== null && session.isActive;
  }

  /**
   * Obtém a sessão atual
   */
  getCurrentSession(): SessionData | null {
    return this.sessionSubject.value;
  }

  /**
   * Encerra a sessão atual
   */
  endSession(): void {
    const currentSession = this.sessionSubject.value;
    if (currentSession) {
      const endedSession: SessionData = {
        ...currentSession,
        isActive: false,
        dataUltimaAtividade: new Date(),
      };

      this.saveSession(endedSession);
      this.sessionSubject.next(null);

      // Notificar backend sobre o encerramento
      this.syncSessionWithBackend(endedSession);
    }
  }

  /**
   * Limpa todos os dados da sessão
   */
  clearSession(): void {
    localStorage.removeItem(this.SESSION_STORAGE_KEY);
    localStorage.removeItem(this.SESSION_BACKUP_KEY);
    this.sessionSubject.next(null);
  }

  /**
   * Recupera dados do backend baseado em celular
   */
  async recoverSession(celular: string): Promise<SessionData | null> {
    try {
      // Tentar recuperar do backend (implementar quando API estiver disponível)
      // const response = await this.apiService.get<SessionData>(`sessions/recover/${celular}`).toPromise();
      // if (response) {
      //   this.saveSession(response);
      //   this.sessionSubject.next(response);
      //   return response;
      // }

      // Por enquanto, verificar se existe backup local
      const backup = localStorage.getItem(this.SESSION_BACKUP_KEY);
      if (backup) {
        const sessionData = JSON.parse(backup);
        if (sessionData.celular === celular) {
          sessionData.dataInicio = new Date(sessionData.dataInicio);
          sessionData.dataUltimaAtividade = new Date(sessionData.dataUltimaAtividade);
          this.saveSession(sessionData);
          this.sessionSubject.next(sessionData);
          return sessionData;
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao recuperar sessão:', error);
      return null;
    }
  }

  /**
   * Atualiza timestamp da última atividade
   */
  updateLastActivity(): void {
    this.updateSession({ dataUltimaAtividade: new Date() });
  }

  private loadSessionFromStorage(): void {
    try {
      const storedSession = localStorage.getItem(this.SESSION_STORAGE_KEY);
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);

        // Converter datas de volta para objetos Date
        sessionData.dataInicio = new Date(sessionData.dataInicio);
        sessionData.dataUltimaAtividade = new Date(sessionData.dataUltimaAtividade);

        // Verificar se a sessão ainda é válida (não passou de 24h)
        const now = new Date();
        const hoursSinceLastActivity =
          (now.getTime() - sessionData.dataUltimaAtividade.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastActivity < 24 && sessionData.isActive) {
          this.sessionSubject.next(sessionData);
          // Atualizar última atividade
          this.updateLastActivity();
        } else {
          // Sessão expirada, limpar
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sessão do storage:', error);
      this.clearSession();
    }
  }

  private saveSession(sessionData: SessionData): void {
    try {
      localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessionData));

      // Criar backup da sessão
      localStorage.setItem(this.SESSION_BACKUP_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Erro ao salvar sessão no storage:', error);
    }
  }

  private syncSessionWithBackend(sessionData: SessionData): void {
    // Implementar sincronização com backend quando API estiver disponível
    try {
      // this.apiService.post('sessions', sessionData).subscribe({
      //   next: (response) => {
      //     console.log('Sessão sincronizada com sucesso:', response);
      //   },
      //   error: (error) => {
      //     console.error('Erro ao sincronizar sessão:', error);
      //   }
      // });

      console.log('Sessão salva localmente (backend não implementado):', sessionData);
    } catch (error) {
      console.error('Erro ao sincronizar com backend:', error);
    }
  }

  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `sess_${timestamp}_${random}`;
  }
}
