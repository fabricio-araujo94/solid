<<<<<<< HEAD
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
=======
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
>>>>>>> 8660b0e012860da6db4ab3341f8e3ba30a5cd4e2
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'solid';
<<<<<<< HEAD
  authService = inject(AuthService);

  logout() {
    this.authService.logout().then(() => {
      console.log('Logout realizado com sucesso!');
    });
  }
}
=======
}
>>>>>>> 8660b0e012860da6db4ab3341f8e3ba30a5cd4e2
