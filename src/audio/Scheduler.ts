import { GeneratedSong, NoteEvent } from '../generator/types.js';

export type NoteScheduleCallback = (event: NoteEvent, scheduledTime: number) => void;

/**
 * Lookahead Web Audio Clock & Loop Scheduler
 * 
 * Uses the industry standard Chris Wilson lookahead technique:
 * - A JavaScript setInterval runs every 25ms
 * - Evaluates what notes will occur in the next 100ms
 * - Schedules notes into the Web Audio hardware clock queue (ctx.currentTime)
 * - Guarantees sample-accurate jitter-free playback regardless of UI frame drops
 * - Loops seamlessly when the 4 or 8 bars complete
 */
export class LookaheadScheduler {
  private ctx: AudioContext;
  private song: GeneratedSong | null = null;
  private onScheduleNote: NoteScheduleCallback;

  private timerId: number | null = null;
  private lookaheadMs: number = 25.0;     // Frequency of checking (ms)
  private scheduleAheadSec: number = 0.1; // Window to schedule ahead (seconds)

  private isRunning: boolean = false;
  private playbackStartTime: number = 0;
  private loopDuration: number = 0;
  private eventIndex: number = 0;
  private loopCount: number = 0;

  constructor(ctx: AudioContext, onScheduleNote: NoteScheduleCallback) {
    this.ctx = ctx;
    this.onScheduleNote = onScheduleNote;
  }

  public loadSong(song: GeneratedSong) {
    this.song = song;
    this.loopDuration = song.totalDurationSeconds;
    this.eventIndex = 0;
    this.loopCount = 0;
  }

  public start() {
    if (this.isRunning || !this.song) return;
    this.isRunning = true;
    this.playbackStartTime = this.ctx.currentTime;
    this.eventIndex = 0;
    this.loopCount = 0;

    // Run scheduler tick immediately then on interval
    this.schedulerTick();
    this.timerId = window.setInterval(() => this.schedulerTick(), this.lookaheadMs);
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.eventIndex = 0;
    this.loopCount = 0;
  }

  private schedulerTick() {
    if (!this.isRunning || !this.song) return;

    const currentTime = this.ctx.currentTime;
    const scheduleUntilTime = currentTime + this.scheduleAheadSec;

    // Process all events that fall within the current lookahead window
    while (true) {
      // Calculate current loop start time in AudioContext hardware clock
      const currentLoopStartTime = this.playbackStartTime + (this.loopCount * this.loopDuration);

      if (this.eventIndex < this.song.events.length) {
        const event = this.song.events[this.eventIndex];
        const scheduledTime = currentLoopStartTime + event.time;

        if (scheduledTime < scheduleUntilTime) {
          // Schedule event if it hasn't already passed
          if (scheduledTime >= currentTime - 0.05) {
            this.onScheduleNote(event, Math.max(currentTime, scheduledTime));
          }
          this.eventIndex++;
        } else {
          // Event is in the future beyond our lookahead window; wait for next tick
          break;
        }
      } else {
        // We reached the end of the song's events for this loop iteration
        const nextLoopStartTime = this.playbackStartTime + ((this.loopCount + 1) * this.loopDuration);

        // Check if next loop starts within our schedule window
        if (nextLoopStartTime < scheduleUntilTime) {
          this.loopCount++;
          this.eventIndex = 0; // Seamless loop!
        } else {
          break;
        }
      }
    }
  }

  public getPlaybackProgress(): number {
    if (!this.isRunning || this.loopDuration === 0) return 0;
    const elapsed = this.ctx.currentTime - this.playbackStartTime;
    return (elapsed % this.loopDuration) / this.loopDuration;
  }
}
