import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonTabs, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  storefrontOutline, 
  cartOutline, 
  receiptOutline, 
  personOutline 
} from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../core/services/cart.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonBadge
  ]
})
export class TabsPage implements OnInit {
  cartItemsCount = this.cartService.itemsCount;

  constructor(private cartService: CartService) {
    // Registrar iconos
    addIcons({
      storefrontOutline,
      cartOutline,
      receiptOutline,
      personOutline
    });
  }

  ngOnInit() {
  }

}

