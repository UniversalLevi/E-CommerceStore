let audioContext: AudioContext | null = null;
let unlocked = false;

function getAudioContext(): AudioContext {
  if (typeof window === 'undefined') return null as any;
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/** Unlock audio on first user gesture (required by browser autoplay policy) */
function unlockAudio(): void {
  if (typeof window === 'undefined' || unlocked) return;
  const resume = () => {
    const ctx = getAudioContext();
    if (ctx) {
      ctx.resume().then(() => {
        unlocked = true;
      }).catch(() => {});
    }
    document.removeEventListener('click', resume);
    document.removeEventListener('keydown', resume);
    document.removeEventListener('touchstart', resume);
  };
  document.addEventListener('click', resume, { once: true, passive: true });
  document.addEventListener('keydown', resume, { once: true, passive: true });
  document.addEventListener('touchstart', resume, { once: true, passive: true });
}
if (typeof window !== 'undefined') {
  unlockAudio();
}

/**
 * Play a short chime sound using Web Audio API
 * No external file needed - generates a pleasant two-tone chime
 */
export function playOrderSound(): void {
  try {
    if (typeof window === 'undefined') return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playChime(ctx)).catch(() => {});
      return;
    }
    playChime(ctx);
  } catch {
    // Audio not available - fail silently
  }
}

function playChime(ctx: AudioContext): void {
  try {

    const now = ctx.currentTime;
    const dest = ctx.destination;

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(dest);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.18);
    gain2.gain.setValueAtTime(0.25, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(dest);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.55);
  } catch {
    // fail silently
  }
}

let soundEnabled = true;

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('notif_sound_enabled');
  if (stored !== null) soundEnabled = stored === 'true';
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('notif_sound_enabled', String(enabled));
  }
}
