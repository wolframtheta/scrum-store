import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user'
  };

  async setAccessToken(token: string): Promise<void> {
    await Preferences.set({ key: this.KEYS.ACCESS_TOKEN, value: token });
  }

  async getAccessToken(): Promise<string | null> {
    const result = await Preferences.get({ key: this.KEYS.ACCESS_TOKEN });
    return result.value;
  }

  async setRefreshToken(token: string): Promise<void> {
    await Preferences.set({ key: this.KEYS.REFRESH_TOKEN, value: token });
  }

  async getRefreshToken(): Promise<string | null> {
    const result = await Preferences.get({ key: this.KEYS.REFRESH_TOKEN });
    return result.value;
  }

  async setUser(user: any): Promise<void> {
    await Preferences.set({ key: this.KEYS.USER, value: JSON.stringify(user) });
  }

  async getUser(): Promise<any | null> {
    const result = await Preferences.get({ key: this.KEYS.USER });
    return result.value ? JSON.parse(result.value) : null;
  }

  async clear(): Promise<void> {
    await Preferences.remove({ key: this.KEYS.ACCESS_TOKEN });
    await Preferences.remove({ key: this.KEYS.REFRESH_TOKEN });
    await Preferences.remove({ key: this.KEYS.USER });
  }

  async set<T>(key: string, value: T): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await Preferences.set({ key, value: stringValue });
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await Preferences.get({ key });
    if (!result.value) {
      return null;
    }
    try {
      return JSON.parse(result.value) as T;
    } catch {
      return result.value as any;
    }
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }
}

