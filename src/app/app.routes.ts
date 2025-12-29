import { Routes } from '@angular/router';
import { CapturePage } from './pages/capture-page/capture-page';
import { HomePage } from './pages/home-page/home-page';
import { MeterPage } from './pages/meter-page/meter-page';

export const routes: Routes = [
  {
    title: 'home',
    path: 'home',
    component: HomePage,
  },
  {
    title: 'capture',
    path: 'capture',
    component: CapturePage,
  },
  {
    title: 'meter',
    path: 'meter',
    component: MeterPage,
  },
  { path: '**', redirectTo: '/home' },
];
