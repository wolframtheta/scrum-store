import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  ModalController
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { storefrontOutline, locationOutline, checkmarkCircle } from 'ionicons/icons';
import { ConsumerGroup } from '../../core/models/article.model';

@Component({
  selector: 'app-group-selector-modal',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ 'LOGIN.SELECT_GROUP' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="modal-description">
        <p>{{ 'LOGIN.SELECT_GROUP_MESSAGE' | translate }}</p>
      </div>

      <ion-list>
        <ion-item
          *ngFor="let group of groups"
          button
          (click)="selectGroup(group)"
          class="group-item">
          <ion-icon slot="start" name="storefront-outline" color="primary"></ion-icon>
          <ion-label>
            <h2>{{ group.name }}</h2>
            <p *ngIf="group.city">
              <ion-icon name="location-outline"></ion-icon>
              {{ group.city }}
            </p>
          </ion-label>
          <ion-icon
            *ngIf="group.role?.isDefault"
            slot="end"
            name="checkmark-circle"
            color="success">
          </ion-icon>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    .modal-description {
      margin-bottom: 1rem;
      text-align: center;

      p {
        color: var(--ion-color-medium);
        font-size: 0.9rem;
        line-height: 1.4;
      }
    }

    .group-item {
      --padding-start: 16px;
      --inner-padding-end: 16px;
      margin-bottom: 8px;
      border-radius: 8px;

      &::part(native) {
        border: 1px solid var(--ion-color-light);
      }

      ion-label {
        h2 {
          font-weight: 600;
          color: var(--ion-color-dark);
          margin-bottom: 4px;
        }

        p {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          color: var(--ion-color-medium);

          ion-icon {
            font-size: 0.9rem;
          }
        }
      }
    }
  `]
})
export class GroupSelectorModalComponent {
  @Input() groups: ConsumerGroup[] = [];

  constructor(private modalController: ModalController) {
    addIcons({ storefrontOutline, locationOutline, checkmarkCircle });
  }

  selectGroup(group: ConsumerGroup) {
    this.modalController.dismiss(group, 'selected');
  }
}

