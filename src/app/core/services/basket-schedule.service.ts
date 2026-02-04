import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { ConsumerGroupService } from './consumer-group.service';

export type VoteStatus = 'yes' | 'no' | 'if_needed';

export interface BasketScheduleCalendar {
  config: { preferredWeekday: number | null; preferredTime: string | null };
  votes: Array<{ date: string; userEmail: string; userName?: string; status: VoteStatus }>;
  assignments: Array<{ date: string; assignedUserEmail: string; assignedUserName?: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class BasketScheduleService {
  private calendar = signal<BasketScheduleCalendar | null>(null);
  private loading = signal(false);

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private consumerGroupService: ConsumerGroupService
  ) {}

  getCalendarData(): BasketScheduleCalendar | null {
    return this.calendar();
  }

  isLoading(): boolean {
    return this.loading();
  }

  async loadCalendar(year: number, month: number): Promise<void> {
    const groupId = this.consumerGroupService.currentGroup()?.id;
    if (!groupId) {
      this.calendar.set(null);
      return;
    }
    this.loading.set(true);
    try {
      const data = await firstValueFrom(
        this.api.get<BasketScheduleCalendar>(
          `/consumer-groups/${groupId}/basket-schedule/calendar`,
          { year: String(year), month: String(month) }
        )
      );
      this.calendar.set(data);
    } catch (err) {
      console.error('Error loading basket calendar', err);
      this.calendar.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async setVote(date: string, status: VoteStatus): Promise<void> {
    const groupId = this.consumerGroupService.currentGroup()?.id;
    if (!groupId) return;
    await firstValueFrom(
      this.api.put(`/consumer-groups/${groupId}/basket-schedule/votes`, {
        date,
        status
      })
    );
  }

  async clearVote(date: string): Promise<void> {
    const groupId = this.consumerGroupService.currentGroup()?.id;
    if (!groupId) return;
    const q = `?date=${encodeURIComponent(date)}`;
    await firstValueFrom(
      this.api.delete(`/consumer-groups/${groupId}/basket-schedule/votes${q}`)
    );
  }

  getAssignmentByDate(dateStr: string): { name: string; email: string } | null {
    const cal = this.calendar();
    if (!cal) return null;
    const a = cal.assignments.find((x) => x.date === dateStr);
    if (!a) return null;
    return { name: a.assignedUserName ?? a.assignedUserEmail, email: a.assignedUserEmail };
  }

  getMyVote(dateStr: string): VoteStatus | null {
    const cal = this.calendar();
    if (!cal) return null;
    const email = this.authService.currentUser()?.email;
    if (!email) return null;
    const v = cal.votes.find(
      (x) => x.date === dateStr && x.userEmail.toLowerCase() === email.toLowerCase()
    );
    return v?.status ?? null;
  }
}
