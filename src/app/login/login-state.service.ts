import { inject, Injectable, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  LocalFileVault,
  VaultCorruptError,
  VaultFormatMismatchError,
  VaultVersionError,
} from 'encrypted-storage/local-file-vault';

marker('dox.app.login.error.passphrase-mismatch');
marker('b24.energy.login.error.wrong-vault');
marker('b24.energy.login.error.corrupt-vault');
marker('b24.energy.login.error.unsupported-version');

@Injectable()
export class LoginStateService {
  #vault = inject(LocalFileVault);
  #router = inject(Router);

  readonly vaultDisplayName = this.#vault.displayName;
  readonly hasSelectedVault = signal(false);
  readonly lastVaultPath = signal<string | null>(null);

  // Create form: passphrase + confirmation
  readonly createForm = new FormGroup(
    {
      pwd: new FormControl('', [Validators.required, Validators.minLength(8)]),
      pwd2: new FormControl('', Validators.required),
    },
    { validators: (group) => (group.get('pwd')?.value === group.get('pwd2')?.value ? null : { mismatch: true }) },
  );

  // Passphrase unlock
  readonly unlockForm = new FormGroup({
    pwd: new FormControl('', Validators.required),
  });

  // Mnemonic recovery
  readonly recoveryForm = new FormGroup({
    phrase: new FormControl('', Validators.required),
    pwd: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  readonly seedMnemonic = signal<string | null>(null);
  readonly seedConfirmed = signal(false);
  readonly showRecovery = signal(false);
  readonly error = signal<string | undefined>(undefined);
  readonly loading = signal(false);

  readonly beforeBack = signal<(() => void) | null>(null);

  constructor() {
    this.refreshLastPath();
  }

  async refreshLastPath() {
    this.lastVaultPath.set(await this.#vault.getLastVaultPath());
  }

  // ---------------------------------------------------------------------------
  // Start screen actions
  // ---------------------------------------------------------------------------

  async createNewVault() {
    this.error.set(undefined);
    this.loading.set(true);
    try {
      const file = await this.#vault.pickNewVaultLocation();
      if (!file) return;
      this.#router.navigate(['/login/create'], { queryParams: { file } });
    } catch (e: unknown) {
      this.error.set(extractMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  async openExistingVault() {
    this.error.set(undefined);
    this.loading.set(true);
    try {
      const file = await this.#vault.pickExistingVaultFile();
      if (!file) return;
      await this.#vault.openExistingVault(file);
      this.hasSelectedVault.set(true);
      this.#router.navigate(['/login/unlock']);
    } catch (e: unknown) {
      this.error.set(extractMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  async continueLastVault() {
    const path = this.lastVaultPath();
    if (!path) return;
    this.error.set(undefined);
    this.loading.set(true);
    try {
      await this.#vault.openExistingVault(path);
      this.hasSelectedVault.set(true);
      this.#router.navigate(['/login/unlock']);
    } catch (e: unknown) {
      this.error.set(extractMessage(e));
      this.lastVaultPath.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Create flow
  // ---------------------------------------------------------------------------

  async createWithPassphrase(filePath: string) {
    this.error.set(undefined);
    if (this.createForm.invalid) {
      this.error.set('dox.app.login.error.passphrase-mismatch');
      return;
    }
    this.loading.set(true);
    try {
      const passphrase = this.createForm.value.pwd!;
      const { mnemonic } = await this.#vault.createVault(filePath, passphrase);
      this.seedMnemonic.set(mnemonic);
      this.seedConfirmed.set(false);
      this.createForm.reset();
      this.#router.navigate(['/login/seed']);
    } catch (e: unknown) {
      this.error.set(extractMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  confirmSeed() {
    this.seedConfirmed.set(true);
    this.seedMnemonic.set(null);
    this.#router.navigateByUrl('/');
  }

  // ---------------------------------------------------------------------------
  // Unlock flow
  // ---------------------------------------------------------------------------

  async unlockWithPassphrase() {
    this.error.set(undefined);
    this.loading.set(true);
    try {
      const pwd = this.unlockForm.value.pwd;
      if (!pwd) return;
      await this.#vault.unlockWithPassphrase(pwd);
      this.unlockForm.reset();
      this.#router.navigateByUrl('/');
    } catch (e: unknown) {
      this.error.set(extractMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  async unlockWithMnemonic() {
    this.error.set(undefined);
    if (this.recoveryForm.invalid) return;
    this.loading.set(true);
    try {
      const phrase = this.recoveryForm.value.phrase!.trim();
      const pwd = this.recoveryForm.value.pwd!;
      await this.#vault.unlockWithMnemonic(phrase, pwd);
      this.recoveryForm.reset();
      this.showRecovery.set(false);
      this.#router.navigateByUrl('/');
    } catch (e: unknown) {
      this.error.set(extractMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  toggleRecovery() {
    this.showRecovery.update((v) => !v);
    this.error.set(undefined);
  }
}

function extractMessage(e: unknown): string {
  if (e instanceof VaultFormatMismatchError) return 'b24.energy.login.error.wrong-vault';
  if (e instanceof VaultCorruptError) return 'b24.energy.login.error.corrupt-vault';
  if (e instanceof VaultVersionError) return 'b24.energy.login.error.unsupported-version';
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'Unknown error';
}
