import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ComandaService } from '../../../core/services/comanda.service';

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
  ],
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss',
})
export class StartComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private comandaService: ComandaService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      nomeCliente: ['', [Validators.required, Validators.minLength(2)]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{10,11}$')]],
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.loading = true;
      const { nomeCliente, celular } = this.form.value;

      this.comandaService.criarComanda(nomeCliente, celular).subscribe({
        next: (comanda) => {
          this.snackBar.open('Comanda iniciada com sucesso!', 'Fechar', { duration: 3000 });
          this.router.navigate(['/cardapio']);
        },
        error: (error) => {
          this.snackBar.open('Erro ao iniciar comanda. Tente novamente.', 'Fechar', {
            duration: 5000,
          });
          this.loading = false;
        },
      });
    } else {
      this.markFormGroupTouched();
    }
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
