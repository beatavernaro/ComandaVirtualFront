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
import { SessionService } from '../../../core/services/session.service';

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
  sessionData: any = null;

  constructor(
    private fb: FormBuilder,
    private comandaService: ComandaService,
    private sessionService: SessionService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      nomeCliente: ['', [Validators.required, Validators.minLength(2)]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{10,11}$')]],
    });
  }

  ngOnInit(): void {
    this.checkExistingSession();
  }

  private checkExistingSession(): void {
    this.hasActiveSession = this.sessionService.hasActiveSession();

    if (this.hasActiveSession) {
      this.sessionData = this.sessionService.getCurrentSession();

      // Pré-preencher o formulário com dados da sessão
      if (this.sessionData) {
        this.form.patchValue({
          nomeCliente: this.sessionData.nomeCliente,
          celular: this.sessionData.celular,
        });
      }
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.loading = true;
      const { nomeCliente, celular } = this.form.value;

      // Se já há sessão ativa, continuar com ela
      if (this.hasActiveSession) {
        this.continueWithExistingSession();
        return;
      }

      // Criar nova comanda e sessão
      this.createNewSession(nomeCliente, celular);
    } else {
      this.markFormGroupTouched();
    }
  }

  private createNewSession(nomeCliente: string, celular: string): void {
    this.comandaService.criarComanda(nomeCliente, celular).subscribe({
      next: (comanda) => {
        this.snackBar.open('Comanda iniciada com sucesso!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/cardapio']);
      },
      error: (error) => {
        console.error('Erro ao criar sessão:', error);
        this.snackBar.open('Erro ao iniciar comanda. Tente novamente.', 'Fechar', {
          duration: 5000,
        });
        this.loading = false;
      },
    });
  }

  private continueWithExistingSession(): void {
    // Atualizar dados da sessão se necessário
    const { nomeCliente, celular } = this.form.value;

    if (this.sessionData.nomeCliente !== nomeCliente || this.sessionData.celular !== celular) {
      this.sessionService.updateSession({
        nomeCliente,
        celular,
      });
    }

    this.snackBar.open('Continuando com sua comanda...', 'Fechar', { duration: 3000 });
    this.router.navigate(['/cardapio']);
    this.loading = false;
  }

  onRecoverSession(): void {
    if (this.form.get('celular')?.valid) {
      this.loading = true;
      const celular = this.form.get('celular')?.value;

      this.recoverSessionData(celular);
    } else {
      this.snackBar.open('Por favor, informe um celular válido para recuperar a sessão', 'Fechar', {
        duration: 5000,
      });
    }
  }

  private async recoverSessionData(celular: string): Promise<void> {
    try {
      const comanda = await this.comandaService.recuperarComanda(celular);

      if (comanda) {
        this.snackBar.open('Sessão recuperada com sucesso!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/cardapio']);
      } else {
        this.snackBar.open('Nenhuma comanda ativa encontrada para este celular', 'Fechar', {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Erro ao recuperar sessão:', error);
      this.snackBar.open('Erro ao recuperar sessão. Tente novamente.', 'Fechar', {
        duration: 5000,
      });
    } finally {
      this.loading = false;
    }
  }

  onClearSession(): void {
    this.sessionService.clearSession();
    this.hasActiveSession = false;
    this.sessionData = null;
    this.form.reset();
    this.snackBar.open('Sessão limpa. Você pode iniciar uma nova comanda.', 'Fechar', {
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
