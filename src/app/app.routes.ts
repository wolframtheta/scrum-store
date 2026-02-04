import { Routes } from '@angular/router';
import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then((m) => m.LoginPage),
    canActivate: [guestGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
    canActivate: [guestGuard]
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'showcase',
        loadComponent: () => import('./tabs/showcase/showcase.page').then((m) => m.ShowcasePage)
      },
      {
        path: 'cart',
        loadComponent: () => import('./tabs/cart/cart.page').then((m) => m.CartPage)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./tabs/orders/order-detail.page').then((m) => m.OrderDetailPage)
      },
      {
        path: 'orders',
        loadComponent: () => import('./tabs/orders/orders.page').then((m) => m.OrdersPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./tabs/profile/profile.page').then((m) => m.ProfilePage)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./tabs/calendar/calendar.page').then((m) => m.CalendarPage)
      },
      {
        path: '',
        redirectTo: 'showcase',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'home',
    redirectTo: '/tabs/showcase',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: '/tabs/showcase',
    pathMatch: 'full',
  },
];
