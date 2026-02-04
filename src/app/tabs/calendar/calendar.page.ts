import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { calendarOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { ConsumerGroupService } from '../../core/services/consumer-group.service';
import { BasketScheduleService, VoteStatus } from '../../core/services/basket-schedule.service';
import { AuthService } from '../../core/services/auth.service';
import { CalendarGridComponent } from './calendar-grid/calendar-grid.component';
import { CalendarDayDetailComponent, DayVote } from './calendar-day-detail/calendar-day-detail.component';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner,
    CalendarGridComponent,
    CalendarDayDetailComponent
  ]
})
export class CalendarPage implements OnInit {
  calendarYear = signal(new Date().getFullYear());
  calendarMonth = signal(new Date().getMonth() + 1);
  savingVote = signal<string | null>(null);
  selectedDate = signal<string | null>(null);

  readonly assignmentsByDate = computed<Record<string, string>>(() => {
    const cal = this.basketScheduleService.getCalendarData();
    if (!cal) return {};
    const out: Record<string, string> = {};
    for (const a of cal.assignments) {
      out[a.date] = a.assignedUserName ?? a.assignedUserEmail;
    }
    return out;
  });

  readonly myVotesByDate = computed<Record<string, VoteStatus>>(() => {
    const cal = this.basketScheduleService.getCalendarData();
    const email = this.authService.currentUser()?.email?.toLowerCase();
    if (!cal || !email) return {};
    const out: Record<string, VoteStatus> = {};
    for (const v of cal.votes) {
      if (v.userEmail.toLowerCase() !== email) continue;
      out[v.date] = v.status;
    }
    return out;
  });

  /** Preferred weekday for preparation (0=Sunday..6=Saturday). Null = all days allowed. */
  readonly preferredWeekday = computed<number | null>(() => {
    return this.basketScheduleService.getCalendarData()?.config?.preferredWeekday ?? null;
  });

  constructor(
    private authService: AuthService,
    private consumerGroupService: ConsumerGroupService,
    public basketScheduleService: BasketScheduleService,
    private toastController: ToastController,
    private translate: TranslateService
  ) {
    addIcons({ calendarOutline, chevronBackOutline, chevronForwardOutline });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    const now = new Date();
    this.calendarYear.set(now.getFullYear());
    this.calendarMonth.set(now.getMonth() + 1);
    this.loadCalendar();
  }

  calendarMonthLabel(): string {
    const d = new Date(this.calendarYear(), this.calendarMonth() - 1, 1);
    return d.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
  }

  prevMonth() {
    let y = this.calendarYear();
    let m = this.calendarMonth() - 1;
    if (m < 1) {
      m = 12;
      y--;
    }
    this.calendarYear.set(y);
    this.calendarMonth.set(m);
    this.loadCalendar();
  }

  nextMonth() {
    let y = this.calendarYear();
    let m = this.calendarMonth() + 1;
    if (m > 12) {
      m = 1;
      y++;
    }
    this.calendarYear.set(y);
    this.calendarMonth.set(m);
    this.loadCalendar();
  }

  async loadCalendar() {
    await this.basketScheduleService.loadCalendar(
      this.calendarYear(),
      this.calendarMonth()
    );
  }

  getVotesForDay(dateStr: string): DayVote[] {
    const cal = this.basketScheduleService.getCalendarData();
    if (!cal) return [];
    return cal.votes
      .filter((v) => v.date === dateStr)
      .map((v) => ({ userName: v.userName ?? v.userEmail, status: v.status }));
  }

  getDateLabel(dateStr: string): string {
    if (typeof dateStr !== 'string') return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('ca-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  onDayTap(dateStr: string) {
    this.selectedDate.set(dateStr);
  }

  onDayDetailClose() {
    this.selectedDate.set(null);
  }

  async onDayDetailVoteChange(dateStr: string, status: VoteStatus | null) {
    this.savingVote.set(dateStr);
    try {
      if (status) {
        await this.basketScheduleService.setVote(dateStr, status);
      } else {
        await this.basketScheduleService.clearVote(dateStr);
      }
      await this.loadCalendar();
    } catch (e) {
      this.showToast(this.translate.instant('PROFILE.CALENDAR_VOTE_ERROR'), 'danger');
    } finally {
      this.savingVote.set(null);
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color
    });
    await toast.present();
  }
}
