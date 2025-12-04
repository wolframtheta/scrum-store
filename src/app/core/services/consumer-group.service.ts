import { Injectable, signal } from '@angular/core';
import { Observable, of, from, firstValueFrom } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { ConsumerGroup } from '../models/article.model';

@Injectable({
  providedIn: 'root'
})
export class ConsumerGroupService {
  public currentGroup = signal<ConsumerGroup | null>(null);
  public userGroups = signal<ConsumerGroup[]>([]);
  private isInitialized = signal<boolean>(false);

  constructor(
    private apiService: ApiService,
    private storageService: StorageService
  ) {
    this.initialize();
  }

  /**
   * Inicializar el servicio cargando el grupo guardado
   */
  private async initialize() {
    try {
      await this.loadCurrentGroup();
      this.isInitialized.set(true);
    } catch (error) {
      console.error('Error initializing ConsumerGroupService:', error);
      this.isInitialized.set(true);
    }
  }

  /**
   * Cargar el grupo actual desde storage o API
   */
  async loadCurrentGroup(): Promise<void> {
    try {
      // Intentar cargar el grupo guardado en localStorage
      const savedGroupId = await this.storageService.get<string>('current_group_id');

      if (savedGroupId) {
        // Intentar cargar el grupo específico
        try {
          const group = await firstValueFrom(this.getGroupById(savedGroupId));
          this.currentGroup.set(group);
          console.log('Grupo cargado desde storage:', group);
          // Cargar también la lista de grupos en segundo plano
          this.loadUserGroups().subscribe();
          return;
        } catch (error) {
          console.error('Error cargando grupo guardado, cargando lista:', error);
        }
      }

      // Si no hay grupo guardado o hubo error, cargar la lista
      await firstValueFrom(this.loadUserGroups());
    } catch (error) {
      console.error('Error en loadCurrentGroup:', error);
    }
  }

  /**
   * Cargar todos los grupos del usuario
   */
  loadUserGroups(): Observable<ConsumerGroup[]> {
    return this.apiService.get<ConsumerGroup[]>('/consumer-groups').pipe(
      tap(async (groups) => {
        this.userGroups.set(groups);
        console.log('Grupos del usuario:', groups);

        // Solo seleccionar un grupo automáticamente si no hay uno seleccionado
        if (groups.length > 0 && !this.currentGroup()) {
          // 1. Buscar el grupo marcado como por defecto (isDefault = true)
          const defaultGroup = groups.find(g => g.role?.isDefault === true);

          if (defaultGroup) {
            // Si hay un grupo por defecto, seleccionarlo
            await this.setCurrentGroup(defaultGroup);
            console.log('Grupo por defecto seleccionado:', defaultGroup);
          } else if (groups.length === 1) {
            // Si solo hay un grupo, seleccionarlo automáticamente
            await this.setCurrentGroup(groups[0]);
            console.log('Único grupo seleccionado:', groups[0]);
          }
          // Si hay múltiples grupos y ninguno es por defecto, no seleccionar ninguno
          // (el usuario deberá elegir manualmente)
        }
      })
    );
  }

  /**
   * Establecer el grupo actual y guardarlo en storage
   */
  async setCurrentGroup(group: ConsumerGroup): Promise<void> {
    this.currentGroup.set(group);
    await this.storageService.set('current_group_id', group.id);
    console.log('Grupo actual establecido:', group.id);
  }

  getGroupById(id: string): Observable<ConsumerGroup> {
    return this.apiService.get<ConsumerGroup>(`/consumer-groups/${id}`);
  }

  isGroupOpen(group: ConsumerGroup): boolean {
    if (!group.openingSchedule) return false;
    const now = new Date();
    const day = now.toLocaleDateString('ca-ES', { weekday: 'long' }).toLowerCase();
    const hours = group.openingSchedule[day];
    if (!hours || hours.closed) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = hours.open.split(':').map(Number);
    const [closeHour, closeMin] = hours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime <= closeTime;
  }
}

