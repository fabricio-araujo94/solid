import { Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { PartAddComponent } from './pages/part-add/part-add.component';
import { PartsListComponent } from './pages/parts-list/parts-list.component';
import { ComparisonComponent } from './pages/comparison/comparison.component';
import { PartDetailComponent } from './pages/part-detail/part-detail.component'; 

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // public routes
  { 
    path: 'signup', 
    component: RegisterComponent,
  },

  { 
    path: 'login', 
    component: LoginComponent, 
},

  // private routes
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard] 
  },
  {
    path: 'create-pattern-model',
    component: PartAddComponent,
    canActivate: [authGuard] 
  },
  {
    path: 'list-models',
    component: PartsListComponent,
    canActivate: [authGuard] 
  },
  {
    path: 'parts/:id',
    component: PartDetailComponent,
    canActivate: [authGuard] 
  },
  {
    path: 'compare-models',
    component: ComparisonComponent,
    canActivate: [authGuard] 
  },

  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];
