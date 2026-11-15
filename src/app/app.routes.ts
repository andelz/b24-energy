import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { LocalFileVault } from 'encrypted-storage/local-file-vault';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { LoginShellComponent } from './login/login-shell';
import { loginRoutes } from './login/login.routes';
import { LoginStateService } from './login/login-state.service';
import { EnergyShell } from './shell/energy-shell';
import { HomePage } from './pages/home-page/home-page';
import { CapturePage } from './pages/capture-page/capture-page';
import { MeterPage } from './pages/meter-page/meter-page';
import { ReportPage } from './pages/report-page/report-page';

marker('b24.energy.nav.home');
marker('b24.energy.nav.capture');
marker('b24.energy.nav.meter');
marker('b24.energy.nav.report');

const authGuard: CanActivateFn = (_route, state) => {
  const vault = inject(LocalFileVault);
  const router = inject(Router);
  if (vault.isReady()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

const loginPageGuard: CanActivateFn = () => {
  const vault = inject(LocalFileVault);
  const router = inject(Router);
  if (vault.isReady()) return router.createUrlTree(['/']);
  return true;
};

export const routes: Routes = [
  {
    path: 'login',
    component: LoginShellComponent,
    canActivate: [loginPageGuard],
    providers: [LoginStateService],
    children: loginRoutes,
  },
  {
    path: '',
    component: EnergyShell,
    canActivate: [authGuard],
    children: [
      { path: '', component: HomePage },
      { path: 'capture', component: CapturePage },
      { path: 'meter', component: MeterPage },
      { path: 'report', component: ReportPage },
    ],
  },
  { path: '**', redirectTo: '' },
];
