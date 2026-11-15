import { Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { EnergyService } from '../../services/energy.service';

@Component({
  selector: 'energy-home-page',
  imports: [TranslatePipe],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  #energy = inject(EnergyService);

  readonly solarCount = computed(() => this.#energy.solarLogs().length);
  readonly meterCount = computed(() => this.#energy.meterReadings().length);
}
