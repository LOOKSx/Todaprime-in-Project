import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    this.requestNotificationPermission();
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // Play pleasant reminder alert chord
  public playReminderAlert(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + index * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.7);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Play task completed success sparkle
  public playTaskComplete(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const notes = [587.33, 880.00]; // D5, A5

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0, now + index * 0.08);
        gain.gain.linearRampToValueAtTime(0.15, now + index * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.4);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Play Pomodoro finished chime
  public playPomodoroDone(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.15);

        gain.gain.setValueAtTime(0, now + index * 0.15);
        gain.gain.linearRampToValueAtTime(0.25, now + index * 0.15 + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.15 + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.15);
        osc.stop(now + index * 0.15 + 0.9);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  public requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  public showDesktopNotification(title: string, body: string): void {
    this.playReminderAlert();
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.warn('Notification error:', e);
      }
    }
  }
}
