import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule, ZapIcon, LogOutIcon } from 'lucide-angular';
import { LocalFileVault } from 'encrypted-storage/local-file-vault';
import { ThemeToggle } from 'omm-ui';

@Component({
  selector: 'energy-shell',
  imports: [RouterModule, LucideAngularModule, TranslatePipe, ThemeToggle],
  templateUrl: './energy-shell.html',
  styleUrl: './energy-shell.scss',
})
export class EnergyShell {
  #vault = inject(LocalFileVault);
  #router = inject(Router);

  readonly zapIcon = ZapIcon;
  readonly logoutIcon = LogOutIcon;

  async logout() {
    await this.#vault.logout();
    this.#router.navigate(['/login']);
  }
}
