import { Routes } from '@angular/router';
import { AppComponent } from './app.component';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Rotas públicas
  { path: 'login', component: AppComponent },

  // Rotas privadas
  {
    path: 'home',
    component: AppComponent,
    canActivate: [authGuard] 
  },
  {
    path: 'create-pattern-model',
    component: AppComponent,
    canActivate: [authGuard] 
  },
  {
    path: 'list-models',
    component: AppComponent,
    canActivate: [authGuard] 
  },
  {
    path: 'compare-models',
    component: AppComponent,
    canActivate: [authGuard] 
  },

  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];