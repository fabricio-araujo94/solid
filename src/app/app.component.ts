import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // O import já está aqui
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true, // Adicione 'standalone: true' para clareza
  imports: [
    CommonModule,
    RouterOutlet // <-- A CORREÇÃO É ADICIONAR ESTA LINHA
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'solid';
  authService = inject(AuthService);

  logout() {
    this.authService.logout().then(() => {
      console.log('Logout realizado com sucesso!');
    });
  }
}