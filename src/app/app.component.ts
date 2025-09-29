import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
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