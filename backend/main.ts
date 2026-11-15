// tinyjs backend: file access for the encrypted vault.
//
// The page has no file system; it reaches the vault file only through the
// `vault.*` calls below. A path is usable only after the user chose it in a
// native dialog this session (or it is the remembered last vault), so a page
// script cannot read or write arbitrary files.
//
// Bytes cross the page/backend bridge as base64 because the wire is JSON. The
// vault holds a few hundred readings, so the extra third in size does not matter.

const LAST_PATH_KEY = 'lastVaultPath';
const VAULT_EXTENSIONS = ['vault'];

type Picked = { filePath: string } | { canceled: true };

/** Paths the user approved through a dialog this session. */
const approved = new Set<string>();

function key(path: string): string {
  // Windows paths (drive letter or UNC share) are case-insensitive and accept
  // either slash; POSIX paths are compared as they are.
  const windows = /^[a-zA-Z]:[\\/]|^\\\\/.test(path);
  return windows ? path.replaceAll('/', '\\').toLowerCase() : path;
}

function approve(path: string): void {
  approved.add(key(path));
}

function requireApproved(path: unknown): string {
  if (typeof path !== 'string' || !approved.has(key(path))) {
    throw new Error('Path not approved by user');
  }
  return path;
}

// ── base64 (txiki.js has native btoa/atob; same encoding as the page) ──────

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── api ─────────────────────────────────────────────────────────────────────

export const api: Record<string, TinyApiHandler> = {
  vaultPickNew: async ({ defaultFilename }: { defaultFilename: string }, app): Promise<Picked> => {
    const filePath = await app.dialog.saveFile({ types: VAULT_EXTENSIONS, name: defaultFilename });
    if (!filePath) return { canceled: true };
    approve(filePath);
    return { filePath };
  },

  vaultPickExisting: async (_params, app): Promise<Picked> => {
    const filePath = await app.dialog.openFile({ types: VAULT_EXTENSIONS });
    if (!filePath) return { canceled: true };
    approve(filePath);
    return { filePath };
  },

  vaultRead: async ({ path }: { path: string }) => {
    return toBase64(await tjs.readFile(requireApproved(path)));
  },

  vaultWrite: async ({ path, data }: { path: string; data: string }) => {
    const target = requireApproved(path);
    // Write beside the target, then rename over it: a crash mid-write leaves
    // the previous vault intact.
    const tmp = target + '.tmp';
    await tjs.writeFile(tmp, fromBase64(data));
    await tjs.rename(tmp, target);
    return true;
  },

  vaultExists: async ({ path }: { path: string }) => {
    if (typeof path !== 'string' || !approved.has(key(path))) return false;
    try {
      await tjs.stat(path);
      return true;
    } catch {
      return false;
    }
  },

  vaultGetLastPath: async (_params, app) => {
    const path = await app.store.get(LAST_PATH_KEY);
    return typeof path === 'string' ? path : null;
  },

  vaultSetLastPath: async ({ path }: { path: string }, app) => {
    // Only a path that is already approved may be remembered.
    await app.store.set(LAST_PATH_KEY, requireApproved(path));
    return true;
  },

  vaultClearLastPath: async (_params, app) => {
    await app.store.delete(LAST_PATH_KEY);
    return true;
  },
};

export async function init(app: TinyApp) {
  // The remembered vault was chosen by the user in an earlier session.
  const last = await app.store.get(LAST_PATH_KEY);
  if (typeof last === 'string') approve(last);
}
