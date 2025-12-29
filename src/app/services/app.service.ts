import { computed, inject, Injectable } from '@angular/core';
import { AppDB, MeterReadingEntry, SolarLogEntry } from '../model/app.model';
import { EncryptedDB } from './encrypted-db.service';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  #encDB = inject(EncryptedDB<AppDB>);

  #database = this.#encDB.database;
  databaseDirty = this.#encDB.databaseDirty;
  databaseAvailable = computed(() => !!this.#database());
  solarLogs = computed<SolarLogEntry[]>(() => this.#database()?.solarLogs || []);
  meterReadings = computed<MeterReadingEntry[]>(() => this.#database()?.meterReadings || []);

  async openDatabase() {
    this.#encDB.openDatabase();
  }

  async createDatabase() {
    this.#encDB.createDatabase({
      solarLogs: [],
      meterReadings: [],
    });
  }

  async saveDatabase() {
    this.#encDB.saveDatabase();
  }

  updateSolarLogs(entries: SolarLogEntry[]) {
    this.#database.update((db) => ({
      solarLogs: entries,
      meterReadings: this.#database()?.meterReadings || [],
    }));
    this.#encDB.checkDirtyState();
  }

  updateMeterReadings(entries: MeterReadingEntry[]) {
    this.#database.update((db) => ({
      meterReadings: entries,
      solarLogs: this.#database()?.solarLogs || [],
    }));
    this.#encDB.checkDirtyState();
  }
}
