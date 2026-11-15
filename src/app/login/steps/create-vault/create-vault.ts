import { Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, FileIcon } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { LoginStateService } from '../../login-state.service';

@Component({
  selector: 'app-create-vault',
  imports: [ReactiveFormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './create-vault.html',
  styleUrl: './create-vault.scss',
})
export class CreateVaultStep {
  state = inject(LoginStateService);
  #route = inject(ActivatedRoute);

  readonly fileIcon = FileIcon;
  readonly filePath = computed(() => this.#route.snapshot.queryParamMap.get('file') ?? '');

  submit() {
    const file = this.filePath();
    if (file) this.state.createWithPassphrase(file);
  }
}
