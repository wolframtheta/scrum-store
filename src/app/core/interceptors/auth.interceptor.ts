import { HttpInterceptorFn, HttpErrorResponse, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, from, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Variable para evitar múltiples refreshes simultáneos
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // Rutas que no necesitan token (rutas públicas de autenticación)
  const publicRoutes = ['/auth/login', '/auth/register'];
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));
  const isRefreshRoute = req.url.includes('/auth/refresh');

  // Si es una ruta pública, continuar sin token
  if (isPublicRoute) {
    return next(req);
  }

  // Obtener el token y agregarlo al header
  return from(authService.getAccessToken()).pipe(
    switchMap(token => {
      let clonedReq = req;

      // Si hay token y no es la ruta de refresh, añadirlo al header
      if (token && !isRefreshRoute) {
        clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      // Si no hay token y no es una ruta pública, podría ser un problema
      // pero lo dejamos pasar para que el backend responda con 401
      return next(clonedReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // Si es 401 y no es la ruta de refresh ni login, intentar renovar el token
          if (error.status === 401 && !isRefreshRoute && !isPublicRoute) {
            return handle401Error(req, next, authService);
          }

          return throwError(() => error);
        })
      );
    })
  );
};

function handle401Error(
  req: any,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        const newToken = response.accessToken;
        refreshTokenSubject.next(newToken);

        // Reintentar la petición original con el nuevo token
        return retryRequest(req, next, newToken);
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);

        // Si falla el refresh, hacer logout (ya redirige al login)
        authService.logout();

        return throwError(() => refreshError);
      })
    );
  } else {
    // Si ya se está refrescando, esperar a que termine y usar el nuevo token
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => retryRequest(req, next, token!))
    );
  }
}

function retryRequest(req: any, next: HttpHandlerFn, token: string): Observable<HttpEvent<unknown>> {
  const retryReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  return next(retryReq);
}

