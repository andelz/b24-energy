import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  // Tune as needed — higher iterations = slower but stronger
  private defaultIterations = 200_000;

  // --- Helpers ---
  private utf8Encode(str: string): Uint8Array<ArrayBuffer> {
    return new TextEncoder().encode(str);
  }
  private utf8Decode(data: ArrayBuffer): string {
    return new TextDecoder().decode(data);
  }
  private toBase64(arr: ArrayBuffer | Uint8Array): string {
    const bytes = arr instanceof Uint8Array ? arr : new Uint8Array(arr);
    let bin = '';
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  }
  private fromBase64(b64: string): Uint8Array<ArrayBuffer> {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  private async importKeyFromPassphrase(
    passphrase: string,
    salt: Uint8Array<ArrayBuffer>,
    iterations: number
  ): Promise<CryptoKey> {
    // 1) Import raw passphrase as a key for PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      this.utf8Encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    // 2) Derive AES-GCM key
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // --- Encrypt ---
  async encryptText(plaintext: string, passphrase: string, iterations = this.defaultIterations) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM 12-byte IV recommended
    const key = await this.importKeyFromPassphrase(passphrase, salt, iterations);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      this.utf8Encode(plaintext)
    );

    // Envelope to store alongside file
    const envelope = {
      v: 1, // version for future migrations
      algo: 'AES-GCM',
      kdf: 'PBKDF2-SHA256',
      iterations,
      salt: this.toBase64(salt),
      iv: this.toBase64(iv),
      data: this.toBase64(ciphertext),
    };

    return envelope;
  }

  // --- Decrypt ---
  async decryptToText(
    envelope: {
      v: number;
      algo: 'AES-GCM';
      kdf: 'PBKDF2-SHA256';
      iterations: number;
      salt: string;
      iv: string;
      data: string;
    },
    passphrase: string
  ): Promise<string> {
    const salt = this.fromBase64(envelope.salt);
    const iv = this.fromBase64(envelope.iv);
    const key = await this.importKeyFromPassphrase(passphrase, salt, envelope.iterations);
    const ct = this.fromBase64(envelope.data);

    const plaintextBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return this.utf8Decode(plaintextBuf);
  }
}
