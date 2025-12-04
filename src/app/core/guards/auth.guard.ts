import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Asegurar que el estado de autenticación esté cargado
  await authService.loadStoredAuth();

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirigir al login y guardar la URL a la que intentaba acceder
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

