import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LoginStateService } from '../../login-state.service';

@Component({
  selector: 'app-unlock',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './unlock.html',
  styleUrl: './unlock.scss',
})
export class UnlockStep {
  state = inject(LoginStateService);

  constructor() {
    this.state.beforeBack.set(() => {
      this.state.error.set(undefined);
      this.state.showRecovery.set(false);
    });
  }
}
