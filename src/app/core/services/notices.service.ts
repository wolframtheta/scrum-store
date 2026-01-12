import { Injectable, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { ConsumerGroupService } from './consumer-group.service';
import { Notice, NoticeResponse } from '../models/notice.model';

@Injectable({
  providedIn: 'root'
})
export class NoticesService {
  private notices = signal<Notice[]>([]);

  constructor(
    private apiService: ApiService,
    private consumerGroupService: ConsumerGroupService
  ) {}

  getNotices(): Notice[] {
    return this.notices();
  }

  async loadNotices(page: number = 1, limit: number = 50): Promise<void> {
    const currentGroup = this.consumerGroupService.currentGroup();
    if (!currentGroup?.id) {
      this.notices.set([]);
      return;
    }

    try {
      const response = await firstValueFrom(
        this.apiService.get<NoticeResponse>(`/notices/group/${currentGroup.id}`, {
          page,
          limit
        })
      );
      this.notices.set(response.notices);
    } catch (error) {
      console.error('Error loading notices:', error);
      this.notices.set([]);
    }
  }
}

