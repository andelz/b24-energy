import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { CreateVaultStep } from './steps/create-vault/create-vault';
import { ShowSeedStep } from './steps/show-seed/show-seed';
import { StartStep } from './steps/start/start';
import { UnlockStep } from './steps/unlock/unlock';

marker('dox.app.login.button.create-new');
marker('dox.app.login.button.open-existing');
marker('dox.app.login.button.continue-last');
marker('dox.app.login.create.heading');
marker('dox.app.login.unlock.heading');

export const loginRoutes: Routes = [
  { path: '', component: StartStep },
  {
    path: 'create',
    component: CreateVaultStep,
    data: { stepTitle: 'dox.app.login.create.heading', backRoute: '/login' },
  },
  { path: 'seed', component: ShowSeedStep },
  {
    path: 'unlock',
    component: UnlockStep,
    data: { stepTitle: 'dox.app.login.unlock.heading', backRoute: '/login' },
  },
];
