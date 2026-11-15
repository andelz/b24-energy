import type { VaultIO } from 'encrypted-storage/local-file-vault';

/**
 * `VaultIO` backed by the tinyjs backend (`backend/main.ts`). The page has no
 * file system of its own; every call goes over `tiny.api`, and file bytes
 * travel as base64 because the bridge carries JSON only.
 */

function api(): Tiny['api'] {
  if (typeof tiny === 'undefined') {
    throw new Error('tinyjs bridge unavailable. Run B24 Energy with `tinyjs dev`, not in a plain browser.');
  }
  return tiny.api;
}

/** Errors from the backend arrive as plain strings; turn them back into Errors. */
async function call<T>(method: string, params?: unknown): Promise<T> {
  try {
    return (await api().call(method, params)) as T;
  } catch (reason) {
    throw reason instanceof Error ? reason : new Error(String(reason));
  }
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(text: string): ArrayBuffer {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export const tinyVaultIo: VaultIO = {
  pickNewVaultLocation: ({ defaultFilename }) => call('vaultPickNew', { defaultFilename }),
  pickExistingVault: () => call('vaultPickExisting'),
  read: async (path) => fromBase64(await call<string>('vaultRead', { path })),
  write: async (path, bytes) => {
    await call('vaultWrite', { path, data: toBase64(bytes) });
  },
  exists: (path) => call('vaultExists', { path }),
  getLastPath: () => call('vaultGetLastPath'),
  setLastPath: async (path) => {
    await call('vaultSetLastPath', { path });
  },
  clearLastPath: async () => {
    await call('vaultClearLastPath');
  },
};
