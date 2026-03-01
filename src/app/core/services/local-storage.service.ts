import { Injectable } from '@angular/core';

export interface UserData {
  nomeCliente: string;
  celular: string;
  comandaId?: number | string;
  lastActivity?: string;
  accessToken?: string;
  tokenExpiration?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly USER_DATA_KEY = 'comanda_virtual_user_data';

  constructor() {}

  /**
   * Salva dados do usuário no sessionStorage
   */
  saveUserData(userData: UserData): void {
    const dataToSave: UserData = {
      ...userData,
      lastActivity: new Date().toISOString()
    };
    
    try {
      sessionStorage.setItem(this.USER_DATA_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error);
    }
  }

  /**
   * Recupera dados do usuário do sessionStorage
   */
  getUserData(): UserData | null {
    try {
      const data = sessionStorage.getItem(this.USER_DATA_KEY);
      if (!data) return null;
      
      const userData = JSON.parse(data);
      
      // Verificar se os dados não expiraram (24 horas)
      if (userData.lastActivity) {
        const lastActivity = new Date(userData.lastActivity);
        const now = new Date();
        const diffHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
        
        if (diffHours > 24) {
          // Dados expirados - limpar
          this.clearUserData();
          return null;
        }
      }
      
      return userData;
    } catch (error) {
      console.error('Erro ao recuperar dados do usuário:', error);
      return null;
    }
  }

  /**
   * Verifica se há dados válidos salvos
   */
  hasValidUserData(): boolean {
    const userData = this.getUserData();
    return userData !== null && !!userData.nomeCliente && !!userData.celular;
  }

  /**
   * Atualiza o ID da comanda nos dados salvos
   */
  updateComandaId(comandaId: number | string): void {
    const userData = this.getUserData();
    if (userData) {
      userData.comandaId = comandaId;
      this.saveUserData(userData);
    }
  }

  /**
   * Limpa todos os dados salvos
   */
  clearUserData(): void {
    try {
      sessionStorage.removeItem(this.USER_DATA_KEY);
    } catch (error) {
      console.error('Erro ao limpar dados do usuário:', error);
    }
  }

  /**
   * Atualiza timestamp da última atividade
   */
  updateLastActivity(): void {
    const userData = this.getUserData();
    if (userData) {
      this.saveUserData(userData);
    }
  }

  /**
   * Salvar token de acesso
   */
  saveAccessToken(token: string): void {
    const userData = this.getUserData();
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 24); // Token expira em 24h
    
    const updatedData: UserData = {
      ...(userData || {}), // Se userData for null, usar objeto vazio
      accessToken: token,
      tokenExpiration: expirationTime.toISOString()
    } as UserData;
    
    try {
      sessionStorage.setItem(this.USER_DATA_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Erro ao salvar token:', error);
    }
  }

  /**
   * Obter token de acesso válido
   */
  getAccessToken(): string | null {
    const userData = this.getUserData();
    if (!userData || !userData.accessToken || !userData.tokenExpiration) {
      return null;
    }

    // Verificar se o token expirou
    const now = new Date();
    const expiration = new Date(userData.tokenExpiration);
    
    if (now >= expiration) {
      // Token expirado, limpar dados
      this.clearUserData();
      return null;
    }

    return userData.accessToken;
  }

  /**
   * Verificar se o token é válido
   */
  hasValidToken(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Limpar token expirado
   */
  clearExpiredToken(): void {
    const userData = this.getUserData();
    if (userData) {
      const { accessToken, tokenExpiration, ...dataWithoutToken } = userData;
      this.saveUserData(dataWithoutToken as UserData);
    }
  }
}