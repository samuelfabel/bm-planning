const STORAGE_KEY = 'bm-planning-auth';

/** Read persisted night mode before React mounts (avoids flash). */
export function readNightModeFromStorage(): boolean {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const raw = JSON.parse(stored) as Record<string, unknown>;
    if (raw.profile && typeof raw.profile === 'object') {
      return Boolean((raw.profile as Record<string, unknown>).nightMode);
    }
    return false;
  } catch {
    return false;
  }
}

export function applyNightMode(enabled: boolean) {
  document.documentElement.classList.toggle('dark', enabled);
}
