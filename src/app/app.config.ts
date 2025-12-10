import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

// Imports do Firebase
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { environment } from '../environments/environment';
import { API_URL } from './tokens/api.token';
import { backend_api } from '../environments/backend-api';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: API_URL, useValue: backend_api.apiUrl },
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment)),
    provideAuth(() => getAuth()),
  ],
};