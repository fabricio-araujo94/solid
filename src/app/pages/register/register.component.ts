import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthLayoutComponent } from '../../layouts/auth-layout/auth-layout.component';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AuthLayoutComponent, RouterModule], 
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  firebaseError: string | null = null;

  // formulário
  registerForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: passwordsMatchValidator }); 

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched(); 
      return;
    }

    const { email, password } = this.registerForm.value;

    this.authService.register(email, password)
      .then(() => {
        this.router.navigate(['/home']);
      })
      .catch((error) => {
        switch (error.code) {
          case 'auth/email-already-in-use':
            this.firebaseError = 'Este e-mail já está em uso.';
            break;
          case 'auth/weak-password':
            this.firebaseError = 'A senha deve ter no mínimo 6 caracteres.';
            break;
          default:
            this.firebaseError = 'Ocorreu um erro inesperado. Tente novamente.';
        }
        console.error('Erro no registro:', error);
      });
  }
}