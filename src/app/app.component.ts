import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // O import já está aqui
import { CommonModule } from '@angular/common';

import { AuthService } from './services/auth.service';

import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent
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

