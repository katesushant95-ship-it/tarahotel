// Sound and notification manager for real-time restaurant orders

class SoundNotificationManager {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private isUnlocked: boolean = false;
  private originalTitle: string = '';
  private titleInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('order_sound_enabled');
      this.soundEnabled = saved !== null ? saved === 'true' : true;
      this.originalTitle = document.title;

      // Auto-unlock audio on first user gesture
      const unlockAudio = () => {
        this.unlockAudioContext();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('click', unlockAudio);
      window.addEventListener('keydown', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public unlockAudioContext() {
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else if (ctx) {
        this.isUnlocked = true;
      }
    } catch (e) {
      console.warn("AudioContext unlock error:", e);
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('order_sound_enabled', enabled ? 'true' : 'false');
    }
    if (enabled) {
      this.unlockAudioContext();
    }
  }

  public toggleSound(): boolean {
    const nextState = !this.soundEnabled;
    this.setSoundEnabled(nextState);
    if (nextState) {
      this.playChime();
    }
    return nextState;
  }

  /**
   * Synthesizes an authentic, resonant high-definition hotel reception / kitchen bell chime
   * Multi-tone brass harmonics with exponential decay
   */
  public playChime() {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Function to synthesize a bell strike with fundamental + partials
      const ringBell = (startTime: number, baseFreq: number, peakGain: number, duration: number) => {
        const partials = [
          { mult: 1.0, gainMult: 1.0 },      // Fundamental
          { mult: 2.02, gainMult: 0.45 },    // Overtone 1
          { mult: 3.01, gainMult: 0.25 },    // Overtone 2
          { mult: 4.15, gainMult: 0.15 },    // Metallic transient
        ];

        partials.forEach(({ mult, gainMult }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = mult === 1.0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(baseFreq * mult, startTime);

          // Attack & rapid decay for bell strike
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(peakGain * gainMult, startTime + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + duration);
        });
      };

      // 3-note melodic ascending chime: High Attention, Warm Tone (F5 -> A5 -> C6)
      ringBell(now, 698.46, 0.35, 0.5);          // F5
      ringBell(now + 0.16, 880.00, 0.42, 0.6);   // A5
      ringBell(now + 0.34, 1046.50, 0.50, 0.9);  // C6 (Sustained bell ring)

    } catch (err) {
      console.warn("Could not play order notification chime:", err);
    }
  }

  /**
   * Flashes the browser tab title to alert the user even if they are in another tab
   */
  public startTabTitleAlert(tableNumber: string) {
    if (typeof window === 'undefined') return;
    this.stopTabTitleAlert();

    this.originalTitle = document.title;
    let toggle = false;
    this.titleInterval = setInterval(() => {
      document.title = toggle 
        ? `🔔 [नवीन ऑर्डर!] टेबल ${tableNumber}` 
        : `⚠️ NEW ORDER Table ${tableNumber} - ${this.originalTitle}`;
      toggle = !toggle;
    }, 1000);
  }

  public stopTabTitleAlert() {
    if (this.titleInterval) {
      clearInterval(this.titleInterval);
      this.titleInterval = null;
      if (this.originalTitle) {
        document.title = this.originalTitle;
      }
    }
  }

  /**
   * Requests desktop browser notification permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Triggers system desktop notification if enabled
   */
  public showDesktopNotification(title: string, body: string) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn("Desktop notification failed:", e);
      }
    }
  }
}

export const soundManager = new SoundNotificationManager();
export const playNotificationSound = () => soundManager.playChime();
