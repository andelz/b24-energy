import { Component, inject } from '@angular/core';
import { LucideAngularModule, FolderOpenIcon, FolderPlusIcon, RotateCcwIcon } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { LoginStateService } from '../../login-state.service';

@Component({
  selector: 'app-login-start',
  imports: [LucideAngularModule, TranslatePipe],
  templateUrl: './start.html',
  styleUrl: './start.scss',
})
export class StartStep {
  state = inject(LoginStateService);

  readonly openIcon = FolderOpenIcon;
  readonly plusIcon = FolderPlusIcon;
  readonly resumeIcon = RotateCcwIcon;
}
