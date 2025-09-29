import { Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';

import { authGuard } from './guards/auth.guard';


export const routes: Routes = [
  // Rotas públicas
  { 
    path: 'signup', 
    component: RegisterComponent,
  },

  { 
    path: 'login', 
    component: LoginComponent, 
},

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