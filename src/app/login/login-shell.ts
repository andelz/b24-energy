import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { LucideAngularModule, VaultIcon, ArrowLeftIcon } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { LoginStateService } from './login-state.service';

@Component({
  selector: 'app-login-shell',
  imports: [RouterOutlet, LucideAngularModule, TranslatePipe],
  templateUrl: './login-shell.html',
  styleUrl: './login-shell.scss',
})
export class LoginShellComponent {
  readonly vaultIcon = VaultIcon;
  readonly arrowLeftIcon = ArrowLeftIcon;

  #router = inject(Router);
  #route = inject(ActivatedRoute);
  #state = inject(LoginStateService);

  stepTitle = signal<string | undefined>(undefined);
  #backRoute = signal<string | undefined>(undefined);

  onChildActivate() {
    let child = this.#route.firstChild;
    while (child?.firstChild) child = child.firstChild;
    const data = child?.snapshot.data;
    this.stepTitle.set(data?.['stepTitle']);
    this.#backRoute.set(data?.['backRoute']);
    this.#state.beforeBack.set(null);
  }

  goBack() {
    const cleanup = this.#state.beforeBack();
    if (cleanup) cleanup();
    this.#state.beforeBack.set(null);
    const route = this.#backRoute();
    if (route) this.#router.navigate([route]);
  }
}
