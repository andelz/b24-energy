import { inject, Injectable } from '@angular/core';
import { CryptoService } from './crypto.service';

@Injectable({
  providedIn: 'root',
})
export class FilesystemService {
  // #crypto = inject(CryptoService);

  // #pf?: string;

  // #isSupported(): boolean {
  //   const inTopLevel = (() => {
  //     try {
  //       return window.self === window.top;
  //     } catch {
  //       return false;
  //     }
  //   })();
  //   return (
  //     inTopLevel &&
  //     ('showOpenFilePicker' in window ||
  //       'showSaveFilePicker' in window ||
  //       'showDirectoryPicker' in window)
  //   );
  // }

  // // --- FILES ---

  // // Pick a file, decrypt its content using a passphrase
  // async openEncryptedText(
  //   fileHandle?: FileSystemFileHandle
  // ): Promise<{ handle: FileSystemFileHandle; content: any } | null> {
  //   if (!fileHandle) {
  //     const [handle] = await window.showOpenFilePicker!({
  //       types: [
  //         { description: 'Encrypted JSON', accept: { 'application/json': ['.json', '.enc.json'] } },
  //       ],
  //       excludeAcceptAllOption: false,
  //       multiple: false,
  //     });
  //     fileHandle = handle;
  //   }

  //   const file = await fileHandle.getFile();
  //   const raw = await file.text();

  //   const envelope = JSON.parse(raw) as {
  //     v: number;
  //     algo: 'AES-GCM';
  //     kdf: 'PBKDF2-SHA256';
  //     iterations: number;
  //     salt: string;
  //     iv: string;
  //     data: string;
  //   };
  //   const passphrase = prompt('Enter passphrase');
  //   const content = await this.#crypto.decryptToText(envelope, passphrase || '');
  //   this.#pf = passphrase || undefined;
  //   return { handle: fileHandle, content: content ? JSON.parse(content) : '' };
  // }

  // async saveDatabaseFile(
  //   content: unknown,
  //   passphrase: string = this.#pf,
  //   handle?: FileSystemFileHandle
  // ): Promise<void> {
  //   // If no handle, let user pick target path
  //   const targetHandle =
  //     handle ??
  //     (await window.showSaveFilePicker!({
  //       suggestedName: 'secret.enc.json',
  //       types: [{ description: 'Encrypted JSON', accept: { 'application/json': ['.json'] } }],
  //     }));

  //   // Ensure we have readwrite permission
  //   const ok = await this.verifyPermission(targetHandle, true);
  //   if (!ok) throw new Error('Permission denied');

  //   // const writable = await handle.createWritable({ keepExistingData: true });
  //   // await writable.write(JSON.stringify(content, null, 2));
  //   // await writable.close();

  //   // 1) Build envelope
  //   const envelope = await this.#crypto.encryptText(JSON.stringify(content), passphrase);

  //   // 2) Write JSON to file atomically
  //   const writable = await targetHandle.createWritable({ keepExistingData: false });
  //   const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
  //   await writable.write(blob);
  //   await writable.close();
  // }

  // // async createTextFile(suggestedName = 'example.txt'): Promise<FileSystemFileHandle | null> {
  // //   if (!this.#isSupported()) return null;
  // //   const handle = await window.showSaveFilePicker!({
  // //     suggestedName,
  // //     types: [{ description: 'Text', accept: { 'text/plain': ['.txt'] } }],
  // //   });
  // //   return handle;
  // // }

  // async createDatabaseFile(suggestedName = 'db.json'): Promise<FileSystemFileHandle | null> {
  //   if (!this.#isSupported()) return null;
  //   const handle = await window.showSaveFilePicker!({
  //     suggestedName,
  //     types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
  //   });
  //   return handle;
  // }

  // async verifyPermission(handle: FileSystemHandle, withWrite = false): Promise<boolean> {
  //   const opts: { mode?: 'read' | 'readwrite' } = withWrite
  //     ? { mode: 'readwrite' }
  //     : { mode: 'read' };

  //   // Query current state
  //   const state = await handle.queryPermission(opts);
  //   if (state === 'granted') return true;

  //   // Must be triggered from a user gesture; call this inside a click handler.
  //   const req = await handle.requestPermission(opts);
  //   return req === 'granted';
  // }
}
