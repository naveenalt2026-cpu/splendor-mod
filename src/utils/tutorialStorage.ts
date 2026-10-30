const TUTORIAL_STORAGE_KEY = 'splendor_interactive_tutorial_seen_v1';

export function hasSeenInteractiveTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markInteractiveTutorialSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export function resetInteractiveTutorialSeen(): void {
  try {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
