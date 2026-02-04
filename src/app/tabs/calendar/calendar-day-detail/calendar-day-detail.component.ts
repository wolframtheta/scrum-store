import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonList, IonItem, IonLabel, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { VoteStatus } from '../../../core/services/basket-schedule.service';

export interface DayVote {
  userName: string;
  status: VoteStatus;
}

@Component({
  selector: 'app-calendar-day-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
  ],
  templateUrl: './calendar-day-detail.component.html',
  styleUrls: ['./calendar-day-detail.component.scss'],
})
export class CalendarDayDetailComponent {
  readonly dateStr = input.required<string>();
  readonly dateLabel = input.required<string>();
  readonly votes = input<DayVote[]>([]);
  readonly myVote = input<VoteStatus | null>(null);
  readonly saving = input<boolean>(false);
  /** When true, render as inline panel (no ion-header/ion-content). */
  readonly inline = input<boolean>(false);

  readonly close = output<void>();
  readonly voteChange = output<VoteStatus | null>();

  constructor() {
    addIcons({ closeOutline });
  }

  voteLabel(status: VoteStatus): string {
    if (status === 'yes') return 'PROFILE.CALENDAR_VOTE_YES';
    if (status === 'no') return 'PROFILE.CALENDAR_VOTE_NO';
    return 'PROFILE.CALENDAR_VOTE_IF_NEEDED';
  }

  onClose() {
    this.close.emit();
  }

  onSetVote(status: VoteStatus) {
    this.voteChange.emit(status);
  }

  onClearVote() {
    this.voteChange.emit(null);
  }
}
