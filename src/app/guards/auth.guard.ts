import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const authGuard: CanActivateFn = (route, state): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1), // pega o primeiro valor emitido e finaliza o observable
    map(user => {
      if (user) {
        return true; 
      } else {
        router.navigate(['/login']);
        return false; 
      }
    })
  );
};