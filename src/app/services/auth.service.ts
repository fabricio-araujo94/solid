import { Injectable, inject } from '@angular/core';
import { Auth, User, authState } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth: Auth = inject(Auth);

  public readonly user$: Observable<User | null> = authState(this.auth);

  constructor() {
    this.user$.subscribe(user => {
      if (user) {
        console.log('Usuário está logado:', user);
      } else {
        console.log('Nenhum usuário logado.');
      }
    });
  }

  getUser(): Observable<User | null> {
    return this.user$;
  }

  logout(): Promise<void> {
    return this.auth.signOut();
  }
}