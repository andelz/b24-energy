import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LoginStateService } from '../../login-state.service';

@Component({
  selector: 'app-show-seed',
  imports: [TranslatePipe],
  templateUrl: './show-seed.html',
  styleUrl: './show-seed.scss',
})
export class ShowSeedStep {
  state = inject(LoginStateService);
}
