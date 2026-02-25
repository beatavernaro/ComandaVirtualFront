import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ComandaService } from '../../../core/services/comanda.service';
import { LocalStorageService, UserData } from '../../../core/services/local-storage.service';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss',
})
export class StartComponent implements OnInit {
  form: FormGroup;
  loading = false;
  hasActiveSession = false;
  userData: UserData | null = null;

  constructor(
    private fb: FormBuilder,
    private comandaService: ComandaService,
    private localStorageService: LocalStorageService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      nomeCliente: ['', [Validators.required, Validators.minLength(2)]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{10,11}$')]],
    });
  }

  ngOnInit(): void {
    this.checkSavedUserData();
  }

  private checkSavedUserData(): void {
    this.hasActiveSession = this.localStorageService.hasValidUserData();

    if (this.hasActiveSession) {
      this.userData = this.localStorageService.getUserData();

      // Pré-preencher o formulário com dados salvos
      if (this.userData) {
        this.form.patchValue({
          nomeCliente: this.userData.nomeCliente,
          celular: this.userData.celular,
        });
      }
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.loading = true;
      const { nomeCliente, celular } = this.form.value;

      // Se já há dados salvos, continuar com comanda existente
      if (this.hasActiveSession && this.userData?.comandaId) {
        this.continueWithExistingComanda();
        return;
      }

      // Verificar se existe comanda aberta para este celular
      this.checkExistingComanda(nomeCliente, celular);
    } else {
      this.markFormGroupTouched();
    }
  }

  private continueWithExistingComanda(): void {
    this.localStorageService.updateLastActivity();
    this.snackBar.open('Continuando com sua comanda...', 'Fechar', { duration: 3000 });
    this.router.navigate(['/cardapio']);
    this.loading = false;
  }

  private checkExistingComanda(nomeCliente: string, celular: string): void {
    this.comandaService.buscarComandaPorCelular(celular).subscribe({
      next: (comanda) => {
        if (comanda) {
          // Comanda encontrada - salvar dados e continuar
          this.localStorageService.saveUserData({
            nomeCliente,
            celular,
            comandaId: comanda.id
          });
          this.snackBar.open('Comanda encontrada! Continuando...', 'Fechar', { duration: 3000 });
          this.router.navigate(['/cardapio']);
        } else {
          // Nenhuma comanda encontrada - criar nova
          this.createNewComanda(nomeCliente, celular);
        }
      },
      error: (error) => {
        console.error('Erro ao verificar comanda existente:', error);
        // Em caso de erro, tentar criar nova comanda
        this.createNewComanda(nomeCliente, celular);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private createNewComanda(nomeCliente: string, celular: string): void {
    this.comandaService.criarNovaComanda(nomeCliente, celular).subscribe({
      next: (comanda) => {
        // Dados do usuário já são salvos no ComandaService (incluindo o token)
        // Apenas atualizar os dados locais com o ID da comanda
        this.localStorageService.saveUserData({
          nomeCliente,
          celular,
          comandaId: comanda.id
        });
        this.snackBar.open('Comanda criada com sucesso!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/cardapio']);
      },
      error: (error) => {
        console.error('Erro ao criar comanda:', error);
        this.snackBar.open('Erro ao criar comanda. Tente novamente.', 'Fechar', {
          duration: 5000,
        });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onRecoverComanda(): void {
    if (this.form.get('celular')?.valid) {
      this.loading = true;
      const celular = this.form.get('celular')?.value;
      const nomeCliente = this.form.get('nomeCliente')?.value || '';

      this.checkExistingComanda(nomeCliente, celular);
    } else {
      this.snackBar.open('Por favor, informe um celular válido para recuperar a comanda', 'Fechar', {
        duration: 5000,
      });
    }
  }

  onClearSession(): void {
    this.localStorageService.clearUserData();
    this.hasActiveSession = false;
    this.userData = null;
    this.form.reset();
    this.snackBar.open('Dados limpos. Você pode iniciar uma nova comanda.', 'Fechar', {
      duration: 3000,
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsTouched();
    });
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(field)} é obrigatório`;
    }
    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(field)} deve ter pelo menos 2 caracteres`;
    }
    if (control?.hasError('pattern')) {
      return 'Celular deve conter apenas números (10 ou 11 dígitos)';
    }
    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      nomeCliente: 'Nome',
      celular: 'Celular',
    };
    return labels[field] || field;
  }
}
