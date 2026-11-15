import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LocalFileVault } from 'encrypted-storage/local-file-vault';
import { ConfirmService } from 'omm-ui';
import { EnergyData, MeterReadingEntry, SolarLogEntry } from '../model/app.model';

const ENERGY_FILE = 'energy.enc';

/**
 * Holds the solar log and meter reading data persisted inside the vault.
 * Mutations auto-save through {@link LocalFileVault.writeEncrypted}; there is
 * no separate save step.
 */
@Injectable({ providedIn: 'root' })
export class EnergyService {
  #vault = inject(LocalFileVault);
  #confirm = inject(ConfirmService);
  #translate = inject(TranslateService);

  #data = signal<EnergyData | null>(null);
  data = this.#data.asReadonly();

  /** Solar log entries sorted newest-first. */
  solarLogs = computed<SolarLogEntry[]>(() => {
    const entries = this.#data()?.solarLogs ?? [];
    return [...entries].sort((a, b) =>
      `${b.year}-${String(b.month).padStart(2, '0')}`.localeCompare(
        `${a.year}-${String(a.month).padStart(2, '0')}`,
      ),
    );
  });

  /** Meter readings sorted newest-first. */
  meterReadings = computed<MeterReadingEntry[]>(() => {
    const entries = this.#data()?.meterReadings ?? [];
    return [...entries].sort((a, b) => b.date.localeCompare(a.date));
  });

  constructor() {
    this.#vault.registerSetup(() => this.#ensureDocument());
    this.#vault.registerInit(async () => {
      await this.#ensureDocument();
      this.#data.set(await this.#vault.readEncrypted<EnergyData>(ENERGY_FILE));
    });
    this.#vault.registerCleanup(async () => {
      this.#data.set(null);
    });
  }

  async saveSolarLog(entry: SolarLogEntry) {
    const data = this.#requireData();
    const idx = data.solarLogs.findIndex(
      (e) => e.year === entry.year && e.month === entry.month,
    );
    if (idx === -1) data.solarLogs.push(entry);
    else data.solarLogs[idx] = entry;
    await this.#persist(data);
  }

  async deleteSolarLog(year: number, month: number) {
    if (!(await this.#confirm.confirm(this.#translate.instant('b24.energy.confirm.solar.delete')))) {
      return;
    }
    const data = this.#requireData();
    data.solarLogs = data.solarLogs.filter((e) => !(e.year === year && e.month === month));
    await this.#persist(data);
  }

  async saveMeterReading(entry: MeterReadingEntry) {
    const data = this.#requireData();
    const idx = data.meterReadings.findIndex((e) => e.date === entry.date);
    if (idx === -1) data.meterReadings.push(entry);
    else data.meterReadings[idx] = entry;
    await this.#persist(data);
  }

  async deleteMeterReading(date: string) {
    if (!(await this.#confirm.confirm(this.#translate.instant('b24.energy.confirm.meter.delete')))) {
      return;
    }
    const data = this.#requireData();
    data.meterReadings = data.meterReadings.filter((e) => e.date !== date);
    await this.#persist(data);
  }

  async #ensureDocument() {
    if (!(await this.#vault.fileExists(ENERGY_FILE))) {
      await this.#vault.writeEncrypted<EnergyData>(ENERGY_FILE, {
        version: 1,
        solarLogs: [],
        meterReadings: [],
      });
    }
  }

  #requireData(): EnergyData {
    const data = this.#data();
    if (!data) throw new Error('Vault is locked');
    return data;
  }

  async #persist(data: EnergyData) {
    this.#data.set(structuredClone(data));
    await this.#vault.writeEncrypted<EnergyData>(ENERGY_FILE, data);
  }
}
