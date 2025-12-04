import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { LoginRequest, AuthResponse, User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public isAuthenticated = signal<boolean>(false);
  public currentUser = signal<User | null>(null);

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  async loadStoredAuth(): Promise<void> {
    const token = await this.storageService.getAccessToken();
    const user = await this.storageService.getUser();

    if (token && user) {
      this.isAuthenticated.set(true);
      this.currentUser.set(user);
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/login', credentials).pipe(
      tap(async (response) => {
        await this.storageService.setAccessToken(response.accessToken);
        await this.storageService.setRefreshToken(response.refreshToken);
        await this.storageService.setUser(response.user);

        this.isAuthenticated.set(true);
        this.currentUser.set(response.user);
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    return from(this.storageService.getRefreshToken()).pipe(
      switchMap(refreshToken => {
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        return this.apiService.post<AuthResponse>('/auth/refresh', { refreshToken: refreshToken });
      }),
      tap(async (response) => {
        await this.storageService.setAccessToken(response.accessToken);
        await this.storageService.setRefreshToken(response.refreshToken);
        // Mantener el estado de autenticación activo después del refresh
        if (response.user) {
          await this.storageService.setUser(response.user);
          this.currentUser.set(response.user);
        }
        this.isAuthenticated.set(true);
      })
    );
  }

  async logout(): Promise<void> {
    await this.storageService.clear();
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  async getAccessToken(): Promise<string | null> {
    return await this.storageService.getAccessToken();
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }
}

