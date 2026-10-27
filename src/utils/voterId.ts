/**
 * Manages persistent voter identity in browser localStorage.
 */
const VOTER_ID_KEY = 'livepulse_voter_id';
const DISPLAY_NAME_KEY = 'livepulse_display_name';
const HOST_KEYS_PREFIX = 'livepulse_host_key_';

export function getOrCreateVoterId(): string {
  try {
    let id = localStorage.getItem(VOTER_ID_KEY);
    if (!id) {
      id = 'voter_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(VOTER_ID_KEY, id);
    }
    return id;
  } catch (e) {
    return 'voter_fallback_' + Date.now();
  }
}

export function getSavedDisplayName(): string {
  try {
    return localStorage.getItem(DISPLAY_NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function saveDisplayName(name: string): void {
  try {
    localStorage.setItem(DISPLAY_NAME_KEY, name.trim());
  } catch {
    // Ignore storage errors
  }
}

export function saveHostKey(sessionCode: string, hostKey: string): void {
  try {
    localStorage.setItem(`${HOST_KEYS_PREFIX}${sessionCode.toUpperCase()}`, hostKey);
  } catch {
    // Ignore storage errors
  }
}

export function getHostKey(sessionCode: string): string | null {
  try {
    return localStorage.getItem(`${HOST_KEYS_PREFIX}${sessionCode.toUpperCase()}`);
  } catch {
    return null;
  }
}
