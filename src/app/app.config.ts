import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withHashLocation, withViewTransitions } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import {
  LOCAL_FILE_VAULT_CONFIG,
  LocalFileVaultConfig,
  VAULT_IO,
} from 'encrypted-storage/local-file-vault';
import { routes } from './app.routes';
import { tinyVaultIo } from './services/vault-io.adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation(), withViewTransitions()),
    provideHttpClient(),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: './i18n/',
        suffix: '.json',
      }),
      fallbackLang: 'en',
      lang: 'en',
    }),
    { provide: VAULT_IO, useValue: tinyVaultIo },
    {
      provide: LOCAL_FILE_VAULT_CONFIG,
      useValue: {
        formatMagic: 'B24E0001',
        defaultFilename: 'b24-energy.vault',
        fileLabel: 'B24 Energy Vault',
      } satisfies LocalFileVaultConfig,
    },
  ],
};
