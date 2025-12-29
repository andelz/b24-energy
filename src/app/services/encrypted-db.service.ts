import { effect, inject, Injectable, signal } from '@angular/core';
import { CryptoService } from './crypto.service';
import { IDBPDatabase, openDB } from 'idb';

@Injectable({
  providedIn: 'root',
})
export class EncryptedDB<T> {
  #crypto = inject(CryptoService);

  #initialState?: T;
  #handle = signal<FileSystemFileHandle | null>(null);
  #handleEffect = effect(async () => {
    const handle = this.#handle();
    const idb = this.#fileHandleIDB;
    if (idb) await idb.put('files', handle, this.#fileHandleDB.recent);
  });

  #pf?: string;
  database = signal<T | null>(null);
  databaseDirty = signal<boolean>(false);

  #fileHandleDB = {
    db: 'fileHandles',
    recent: 'recent',
  };
  #fileHandleIDB?: IDBPDatabase<unknown>;

  constructor() {
    // this.#initHandleStore();
  }

  async createDatabase(initialData: T) {
    const h = await this.#createDatabaseFile();
    if (h) {
      this.#handle.set(h);
      this.database.set(initialData);
      await this.saveDatabase();
    }
  }

  async openDatabase() {
    const res = await this.#openDatabaseFile();
    if (res) {
      this.#handle.set(res.handle);

      const db = res.content ? (res.content as T) : null;
      if (!this.#isValid(db)) throw Error(`That's not the right database file for this app.`);
      this.#initialState = db || undefined;
      this.database.set(res.content ? (res.content as T) : null);
      this.databaseDirty.set(false);
    }
  }

  async saveDatabase() {
    const passphrase = this.#getPassphrase();
    if (!passphrase) return;
    await this.#saveDatabaseFile(this.database(), passphrase, this.#handle() || undefined);
    this.#initialState = this.database() || undefined;
    this.databaseDirty.set(false);
  }

  checkDirtyState() {
    this.databaseDirty.set(this.#isDirty());
  }

  async #createDatabaseFile(suggestedName = 'db.json'): Promise<FileSystemFileHandle | null> {
    if (!this.#isSupported()) return null;
    const handle = await window.showSaveFilePicker!({
      suggestedName,
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    });
    return handle;
  }

  async #openDatabaseFile(
    fileHandle?: FileSystemFileHandle
  ): Promise<{ handle: FileSystemFileHandle; content: any } | null> {
    if (!fileHandle) {
      const [handle] = await window.showOpenFilePicker!({
        types: [
          { description: 'Encrypted JSON', accept: { 'application/json': ['.json', '.enc.json'] } },
        ],
        excludeAcceptAllOption: false,
        multiple: false,
      });
      fileHandle = handle;
    }

    const file = await fileHandle.getFile();
    const raw = await file.text();

    const envelope = JSON.parse(raw) as {
      v: number;
      algo: 'AES-GCM';
      kdf: 'PBKDF2-SHA256';
      iterations: number;
      salt: string;
      iv: string;
      data: string;
    };
    const passphrase = this.#getPassphrase();
    const content = await this.#crypto.decryptToText(envelope, passphrase || '');
    return { handle: fileHandle, content: content ? JSON.parse(content) : '' };
  }

  async #saveDatabaseFile(
    content: unknown,
    passphrase: string,
    handle?: FileSystemFileHandle
  ): Promise<void> {
    // If no handle, let user pick target path
    const targetHandle =
      handle ??
      (await window.showSaveFilePicker!({
        suggestedName: 'secret.enc.json',
        types: [{ description: 'Encrypted JSON', accept: { 'application/json': ['.json'] } }],
      }));

    // Ensure we have readwrite permission
    const ok = await this.#verifyPermission(targetHandle, true);
    if (!ok) throw new Error('Permission denied');
    // 1) Build envelope
    const envelope = await this.#crypto.encryptText(JSON.stringify(content), passphrase);
    // 2) Write JSON to file atomically
    const writable = await targetHandle.createWritable({ keepExistingData: false });
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
    await writable.write(blob);
    await writable.close();
  }

  #getPassphrase(): string | undefined {
    if (!this.#pf) this.#pf = prompt('Enter passphrase') || undefined;
    return this.#pf;
  }

  #isDirty(): boolean {
    return JSON.stringify(this.database()) !== JSON.stringify(this.#initialState);
  }

  #isValid(d: any) {
    return d && Object.hasOwn(d, 'solarLogs');
    // && Object.hasOwn(d, 'meterReadings');
  }

  #isSupported(): boolean {
    const inTopLevel = (() => {
      try {
        return window.self === window.top;
      } catch {
        return false;
      }
    })();
    return (
      inTopLevel &&
      ('showOpenFilePicker' in window ||
        'showSaveFilePicker' in window ||
        'showDirectoryPicker' in window)
    );
  }

  async #verifyPermission(handle: FileSystemHandle, withWrite = false): Promise<boolean> {
    const opts: { mode?: 'read' | 'readwrite' } = withWrite
      ? { mode: 'readwrite' }
      : { mode: 'read' };

    // Query current state
    const state = await handle.queryPermission(opts);
    if (state === 'granted') return true;

    // Must be triggered from a user gesture; call this inside a click handler.
    const req = await handle.requestPermission(opts);
    return req === 'granted';
  }

  async #initHandleStore() {
    this.#fileHandleIDB = await openDB(this.#fileHandleDB.db, 1, {
      upgrade(db) {
        db.createObjectStore('files');
      },
    });
    this.#handle = await this.#fileHandleIDB.get('files', this.#fileHandleDB.recent);
  }
}
