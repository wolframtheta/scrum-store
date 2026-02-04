import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IonSpinner } from '@ionic/angular/standalone';
import { VoteStatus } from '../../../core/services/basket-schedule.service';

/** Week starts Monday (Dl..Ds, Dg) */
const WEEKDAY_LABELS = ['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];

interface DayCell {
  dateStr: string | null;
  dayOfMonth: number | null;
  isCurrentMonth: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  imports: [CommonModule, TranslateModule, IonSpinner],
  templateUrl: './calendar-grid.component.html',
  styleUrls: ['./calendar-grid.component.scss'],
})
export class CalendarGridComponent {
  readonly year = input.required<number>();
  readonly month = input.required<number>();
  readonly loading = input<boolean>(false);
  readonly savingDate = input<string | null>(null);
  /** dateStr of the selected day (for highlight) */
  readonly selectedDate = input<string | null>(null);
  /** Preferred weekday for preparation (0=Sun..6=Sat). Null = all days votable. */
  readonly preferredWeekday = input<number | null>(null);
  /** dateStr -> assignee name */
  readonly assignmentsByDate = input<Record<string, string>>({});
  /** dateStr -> vote status */
  readonly myVotesByDate = input<Record<string, VoteStatus>>({});

  readonly dayTap = output<string>();

  readonly weekdays = WEEKDAY_LABELS;

  readonly monthLabel = computed(() => {
    const d = new Date(this.year(), this.month() - 1, 1);
    return d.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
  });

  readonly grid = computed<DayCell[][]>(() => {
    const y = this.year();
    const m = this.month();
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);
    /** 0=Monday .. 6=Sunday (JS getDay: 0=Sun, 1=Mon..6=Sat) */
    const startWeekday = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: DayCell[] = [];
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ dateStr: null, dayOfMonth: null, isCurrentMonth: false, isToday: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const cellDate = new Date(y, m - 1, d);
      cellDate.setHours(0, 0, 0, 0);
      cells.push({
        dateStr,
        dayOfMonth: d,
        isCurrentMonth: true,
        isToday: cellDate.getTime() === today.getTime(),
      });
    }
    const remainder = cells.length % 7;
    const pad = remainder === 0 ? 0 : 7 - remainder;
    for (let i = 0; i < pad; i++) {
      cells.push({ dateStr: null, dayOfMonth: null, isCurrentMonth: false, isToday: false });
    }

    const rows: DayCell[][] = [];
    for (let r = 0; r < cells.length; r += 7) {
      rows.push(cells.slice(r, r + 7));
    }
    return rows;
  });

  getAssignment(dateStr: string): string | null {
    return this.assignmentsByDate()[dateStr] ?? null;
  }

  getMyVote(dateStr: string): VoteStatus | null {
    return this.myVotesByDate()[dateStr] ?? null;
  }

  /** Weekday (0=Sun..6=Sat) for dateStr YYYY-MM-DD */
  getWeekday(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
  }

  /** True if this day is votable (matches preferredWeekday when set). */
  isDayVotable(dateStr: string): boolean {
    const pw = this.preferredWeekday();
    if (pw === null) return true;
    return this.getWeekday(dateStr) === pw;
  }

  onDayClick(dateStr: string) {
    if (!this.isDayVotable(dateStr)) return;
    this.dayTap.emit(dateStr);
  }
}
