import { AlarmItem, AlarmSoundType, Medication } from "../types";

const STORAGE_KEY = "caregiver_precision_alarms_v2";

type AlarmListener = (alarms: AlarmItem[]) => void;
type RingingListener = (ringingAlarm: AlarmItem | null) => void;

class AlarmSchedulerService {
  private alarms: AlarmItem[] = [];
  private activeRingingAlarm: AlarmItem | null = null;
  private precisionTimerId: any = null;
  private heartbeatIntervalId: any = null;
  private audioCtx: AudioContext | null = null;
  private audioLoopIntervalId: any = null;
  private wakeLockSentinel: any = null;
  private testAudioTimeoutId: any = null;

  private alarmListeners: Set<AlarmListener> = new Set();
  private ringingListeners: Set<RingingListener> = new Set();

  constructor() {
    this.loadAlarms();
    this.initServiceWorker();
    this.setupVisibilityListeners();
    this.startHeartbeat();
    this.scheduleNextAlarm();

    // Auto-unlock AudioContext on first user interaction to comply with browser autoplay policy
    const unlockAudio = () => {
      this.getOrCreateAudioContext();
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
  }

  private getOrCreateAudioContext(): AudioContext | null {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;
      if (!this.audioCtx || this.audioCtx.state === "closed") {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch (err) {
      console.warn("AudioContext initialization warning:", err);
      return null;
    }
  }

  private initServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data?.type === "NOTIFICATION_ACTION_CLICKED") {
              const { action, alarm } = event.data;
              if (action === "take" && alarm?.id) {
                this.takeAlarmMedication(alarm.id);
              } else if (action === "snooze_5" && alarm?.id) {
                this.snoozeAlarm(alarm.id, 5);
              }
            }
          });
        })
        .catch((err) => {
          console.warn("ServiceWorker registration notice:", err);
        });
    }
  }

  private setupVisibilityListeners() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.recalculateAndReschedule();
      }
    });

    window.addEventListener("focus", () => {
      this.recalculateAndReschedule();
    });

    window.addEventListener("online", () => {
      this.recalculateAndReschedule();
    });
  }

  // Heartbeat runs every second to check for exact epoch arrival and prevent OS timer throttle drift
  private startHeartbeat() {
    if (this.heartbeatIntervalId) clearInterval(this.heartbeatIntervalId);
    this.heartbeatIntervalId = setInterval(() => {
      const now = Date.now();
      const enabledAlarms = this.alarms.filter((a) => a.enabled);

      for (const alarm of enabledAlarms) {
        // If alarm's target time has arrived (within 1.5s tolerance or passed in background)
        if (alarm.nextTriggerEpoch && alarm.nextTriggerEpoch <= now) {
          // Trigger the alarm immediately!
          this.triggerAlarm(alarm);
          break;
        }
      }
    }, 1000);
  }

  /**
   * Calculates the exact millisecond epoch for the next trigger.
   * Ensures alarms ring at the EXACT second specified, adhering to the local timezone.
   */
  public calculateNextTrigger(
    alarm: Pick<AlarmItem, "scheduleType" | "time" | "targetDate" | "daysOfWeek">,
    fromDate: Date = new Date()
  ): number {
    const timeParts = alarm.time.split(":").map(Number);
    const hours = timeParts[0] || 0;
    const minutes = timeParts[1] || 0;
    const seconds = timeParts[2] || 0;

    if (alarm.scheduleType === "exact_datetime" && alarm.targetDate) {
      const [y, m, d] = alarm.targetDate.split("-").map(Number);
      const target = new Date(y, m - 1, d, hours, minutes, seconds, 0);
      return target.getTime();
    }

    if (alarm.scheduleType === "specific_days" && Array.isArray(alarm.daysOfWeek) && alarm.daysOfWeek.length > 0) {
      for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
        const candidate = new Date(fromDate.getTime());
        candidate.setDate(candidate.getDate() + dayOffset);
        candidate.setHours(hours, minutes, seconds, 0);

        if (alarm.daysOfWeek.includes(candidate.getDay())) {
          if (candidate.getTime() > fromDate.getTime()) {
            return candidate.getTime();
          }
        }
      }
    }

    // Default: Daily recurring alarm at exact time
    const candidateToday = new Date(fromDate.getTime());
    candidateToday.setHours(hours, minutes, seconds, 0);

    // If the exact time today is already past (or less than 1 second away in the past), schedule for tomorrow
    if (candidateToday.getTime() <= fromDate.getTime() + 1000) {
      const candidateTomorrow = new Date(fromDate.getTime());
      candidateTomorrow.setDate(candidateTomorrow.getDate() + 1);
      candidateTomorrow.setHours(hours, minutes, seconds, 0);
      return candidateTomorrow.getTime();
    }

    return candidateToday.getTime();
  }

  private loadAlarms() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: AlarmItem[] = JSON.parse(raw);
        const now = Date.now();
        this.alarms = parsed.map((alarm) => {
          if (alarm.enabled && (!alarm.nextTriggerEpoch || alarm.nextTriggerEpoch < now - 60000)) {
            alarm.nextTriggerEpoch = this.calculateNextTrigger(alarm, new Date());
          }
          return alarm;
        });
      }
    } catch (err) {
      console.error("Failed to load alarms from storage:", err);
      this.alarms = [];
    }
  }

  private saveAlarms() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.alarms));
    } catch (err) {
      console.error("Failed to persist alarms to storage:", err);
    }
    this.notifyAlarmListeners();
  }

  public getAlarms(): AlarmItem[] {
    return [...this.alarms].sort((a, b) => a.nextTriggerEpoch - b.nextTriggerEpoch);
  }

  public getActiveRingingAlarm(): AlarmItem | null {
    return this.activeRingingAlarm;
  }

  public addOrUpdateAlarm(alarmData: Partial<AlarmItem>): AlarmItem {
    const now = Date.now();
    const id = alarmData.id || `alarm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const time = alarmData.time || "08:00:00";
    const scheduleType = alarmData.scheduleType || "daily";

    const nextTriggerEpoch =
      alarmData.nextTriggerEpoch ||
      this.calculateNextTrigger(
        {
          scheduleType,
          time,
          targetDate: alarmData.targetDate,
          daysOfWeek: alarmData.daysOfWeek,
        },
        new Date()
      );

    const fullAlarm: AlarmItem = {
      id,
      title: alarmData.title || "Medication Reminder",
      medicationId: alarmData.medicationId,
      olderAdultId: alarmData.olderAdultId,
      scheduleType,
      time,
      targetDate: alarmData.targetDate,
      daysOfWeek: alarmData.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      sound: alarmData.sound || "gentle_chime",
      volume: typeof alarmData.volume === "number" ? alarmData.volume : 0.9,
      vibrate: alarmData.vibrate !== false,
      enabled: alarmData.enabled !== false,
      label: alarmData.label || "",
      dosage: alarmData.dosage || "",
      instructions: alarmData.instructions || "",
      snoozeCount: alarmData.snoozeCount || 0,
      lastTriggered: alarmData.lastTriggered,
      nextTriggerEpoch,
      createdAt: alarmData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = this.alarms.findIndex((a) => a.id === id);
    if (existingIdx !== -1) {
      this.alarms[existingIdx] = fullAlarm;
    } else {
      this.alarms.push(fullAlarm);
    }

    this.saveAlarms();
    this.scheduleNextAlarm();
    return fullAlarm;
  }

  public deleteAlarm(id: string) {
    this.alarms = this.alarms.filter((a) => a.id !== id);
    if (this.activeRingingAlarm?.id === id) {
      this.dismissAlarm(id);
    }
    this.saveAlarms();
    this.scheduleNextAlarm();
  }

  public toggleAlarm(id: string, forceEnabled?: boolean): AlarmItem | null {
    const alarm = this.alarms.find((a) => a.id === id);
    if (!alarm) return null;

    alarm.enabled = typeof forceEnabled === "boolean" ? forceEnabled : !alarm.enabled;
    alarm.updatedAt = new Date().toISOString();

    if (alarm.enabled) {
      alarm.nextTriggerEpoch = this.calculateNextTrigger(alarm, new Date());
    }

    this.saveAlarms();
    this.scheduleNextAlarm();
    return alarm;
  }

  /**
   * Syncs active medications into the alarm system automatically,
   * preventing any duplicate alarms for the same medication and time slot.
   */
  public syncMedicationsToAlarms(medications: Medication[], olderAdultId?: string) {
    let modified = false;

    for (const med of medications) {
      if (!med.scheduleTime) continue;

      // Check if an alarm already exists for this medication
      const existing = this.alarms.find(
        (a) =>
          a.medicationId === med.id ||
          (a.title === med.name && a.time.startsWith(med.scheduleTime) && a.olderAdultId === (med.olderAdultId || olderAdultId))
      );

      const formattedTime = med.scheduleTime.includes(":")
        ? med.scheduleTime.split(":").length === 2
          ? `${med.scheduleTime}:00`
          : med.scheduleTime
        : `${med.scheduleTime}:00`;

      if (!existing) {
        const newAlarm: Partial<AlarmItem> = {
          id: `alarm-med-${med.id}`,
          title: med.name,
          medicationId: med.id,
          olderAdultId: med.olderAdultId || olderAdultId,
          scheduleType: "daily",
          time: formattedTime,
          dosage: med.dosage,
          instructions: med.instructions,
          sound: "gentle_chime",
          volume: 0.9,
          vibrate: true,
          enabled: med.status !== "taken",
          label: `Medication Dose: ${med.name}`,
          snoozeCount: 0,
        };
        const nextEpoch = this.calculateNextTrigger(
          {
            scheduleType: "daily",
            time: formattedTime,
          },
          new Date()
        );
        newAlarm.nextTriggerEpoch = nextEpoch;
        this.addOrUpdateAlarm(newAlarm);
        modified = true;
      } else {
        // If medication was marked as taken, we keep the alarm enabled for tomorrow's dose
        let shouldUpdate = false;
        if (existing.dosage !== med.dosage || existing.instructions !== med.instructions) {
          existing.dosage = med.dosage;
          existing.instructions = med.instructions;
          shouldUpdate = true;
        }
        if (!existing.time.startsWith(med.scheduleTime)) {
          existing.time = formattedTime;
          existing.nextTriggerEpoch = this.calculateNextTrigger(existing, new Date());
          shouldUpdate = true;
        }
        if (shouldUpdate) {
          modified = true;
        }
      }
    }

    if (modified) {
      this.saveAlarms();
      this.scheduleNextAlarm();
    }
  }

  public recalculateAndReschedule() {
    const now = Date.now();
    for (const alarm of this.alarms) {
      if (alarm.enabled) {
        // If past due by more than 1 minute, advance to next cycle
        if (alarm.nextTriggerEpoch < now - 60000) {
          alarm.nextTriggerEpoch = this.calculateNextTrigger(alarm, new Date());
        }
      }
    }
    this.saveAlarms();
    this.scheduleNextAlarm();
  }

  /**
   * Schedules precision setTimeout to the very next active alarm millisecond.
   */
  private scheduleNextAlarm() {
    if (this.precisionTimerId) {
      clearTimeout(this.precisionTimerId);
      this.precisionTimerId = null;
    }

    const enabledAlarms = this.alarms.filter((a) => a.enabled && a.nextTriggerEpoch > 0);
    if (enabledAlarms.length === 0) return;

    // Sort to find the earliest upcoming alarm
    enabledAlarms.sort((a, b) => a.nextTriggerEpoch - b.nextTriggerEpoch);
    const nextAlarm = enabledAlarms[0];

    const now = Date.now();
    const delayMs = Math.max(0, nextAlarm.nextTriggerEpoch - now);

    // If already due or due within 50ms, trigger right now!
    if (delayMs <= 50) {
      this.triggerAlarm(nextAlarm);
      return;
    }

    // Set precise timeout for the exact calculated millisecond delta
    this.precisionTimerId = setTimeout(() => {
      this.triggerAlarm(nextAlarm);
    }, delayMs);
  }

  /**
   * Ring the alarm at the exact scheduled second!
   */
  private triggerAlarm(alarm: AlarmItem) {
    const now = Date.now();
    alarm.lastTriggered = new Date().toISOString();

    // Advance next occurrence
    if (alarm.scheduleType === "exact_datetime") {
      alarm.enabled = false; // One-time alarm completes
    } else {
      alarm.nextTriggerEpoch = this.calculateNextTrigger(alarm, new Date(now + 1000));
    }
    this.saveAlarms();

    this.activeRingingAlarm = alarm;
    this.notifyRingingListeners();

    // 1. Play Audio Alarm Loop
    this.startAlarmAudio(alarm.sound, alarm.volume);

    // 2. Request WakeLock (keep screen awake while ringing)
    this.requestWakeLock();

    // 3. Trigger Device Vibration
    if (alarm.vibrate && "vibrate" in navigator) {
      try {
        navigator.vibrate([500, 250, 500, 250, 800, 400, 800]);
      } catch (e) {
        // Ignored
      }
    }

    // 4. Trigger Native Web / System Notification
    this.showSystemNotification(alarm);

    // Reschedule for other upcoming alarms
    this.scheduleNextAlarm();
  }

  private async requestWakeLock() {
    try {
      if ("wakeLock" in navigator && (navigator as any).wakeLock?.request) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
      }
    } catch (e) {
      // Wake lock not granted or supported
    }
  }

  private releaseWakeLock() {
    try {
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      }
    } catch (e) {
      // Ignored
    }
  }

  private showSystemNotification(alarm: AlarmItem) {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const title = `⏰ ALARM: ${alarm.title}`;
    const body = `${alarm.dosage ? `Dose: ${alarm.dosage} • ` : ""}${alarm.instructions || "Time for your scheduled dose."}`;

    // Try service worker notification first for reliable background delivery
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "TRIGGER_NOTIFICATION",
        payload: {
          title,
          options: {
            body,
            tag: alarm.id,
            requireInteraction: true,
            vibrate: [500, 200, 500, 200, 500, 200, 800],
            data: alarm,
            actions: [
              { action: "take", title: "💊 Take Now" },
              { action: "snooze_5", title: "⏱️ Snooze 5m" },
            ],
          },
        },
      });
      return;
    }

    // Fallback to direct window Notification
    try {
      const n = new Notification(title, {
        body,
        tag: alarm.id,
        requireInteraction: true,
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (err) {
      console.warn("Direct Notification warning:", err);
    }
  }

  /**
   * Web Audio API Synthesizer: Synthesizes pleasant, rich, non-jarring but highly audible alarm sounds.
   */
  public playSynthesizedTone(soundType: AlarmSoundType = "gentle_chime", volume: number = 0.9) {
    const ctx = this.getOrCreateAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.05, Math.min(1.0, volume)), now);
    masterGain.connect(ctx.destination);

    if (soundType === "gentle_chime") {
      // 4-tone harmonic chime (C5, E5, G5, C6) with natural decay
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + index * 0.18);

        gain.gain.setValueAtTime(0, now + index * 0.18);
        gain.gain.linearRampToValueAtTime(0.45, now + index * 0.18 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.18 + 1.6);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + index * 0.18);
        osc.stop(now + index * 0.18 + 1.7);
      });
    } else if (soundType === "medical_beep") {
      // Dual-tone crisp medical pulse (880Hz / 1760Hz)
      const pulses = [0, 0.22, 0.44];
      pulses.forEach((startTime) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1046.5, now + startTime);
        osc.frequency.setValueAtTime(1318.5, now + startTime + 0.08);

        gain.gain.setValueAtTime(0, now + startTime);
        gain.gain.linearRampToValueAtTime(0.5, now + startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + startTime + 0.16);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + startTime);
        osc.stop(now + startTime + 0.18);
      });
    } else if (soundType === "zen_bell") {
      // Deep resonant singing bowl with gentle harmonics
      const baseFreq = 432;
      const harmonics = [1, 2.01, 3.02];
      harmonics.forEach((mult, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq * mult, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4 / (i + 1), now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 2.2);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 2.3);
      });
    } else if (soundType === "vital_pulse") {
      // 3-pulse crescendo alert
      [587.33, 739.99, 880.0].forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + index * 0.2);

        // Low-pass filter for smooth warmth
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1200, now + index * 0.2);

        gain.gain.setValueAtTime(0, now + index * 0.2);
        gain.gain.linearRampToValueAtTime(0.35, now + index * 0.2 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.2 + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(now + index * 0.2);
        osc.stop(now + index * 0.2 + 0.38);
      });
    } else {
      // Default chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 1.3);
    }
  }

  private startAlarmAudio(sound: AlarmSoundType, volume: number) {
    this.stopAlarmAudio();
    this.playSynthesizedTone(sound, volume);

    // Loop the alarm tone every 2.4 seconds until acknowledged
    this.audioLoopIntervalId = setInterval(() => {
      if (this.activeRingingAlarm) {
        this.playSynthesizedTone(sound, volume);
      } else {
        this.stopAlarmAudio();
      }
    }, 2400);
  }

  private stopAlarmAudio() {
    if (this.audioLoopIntervalId) {
      clearInterval(this.audioLoopIntervalId);
      this.audioLoopIntervalId = null;
    }
    this.releaseWakeLock();
  }

  public testAlarmSound(sound: AlarmSoundType = "gentle_chime", volume: number = 0.9) {
    this.stopTestAlarmSound();
    this.playSynthesizedTone(sound, volume);
  }

  public stopTestAlarmSound() {
    if (this.testAudioTimeoutId) {
      clearTimeout(this.testAudioTimeoutId);
      this.testAudioTimeoutId = null;
    }
  }

  /**
   * User acknowledges alarm and records medication as taken.
   */
  public takeAlarmMedication(id: string) {
    this.stopAlarmAudio();
    const alarm = this.alarms.find((a) => a.id === id);
    if (alarm) {
      alarm.snoozeCount = 0;
      alarm.lastTriggered = new Date().toISOString();
      if (alarm.scheduleType === "exact_datetime") {
        alarm.enabled = false;
      } else {
        alarm.nextTriggerEpoch = this.calculateNextTrigger(alarm, new Date());
      }
      this.saveAlarms();
    }
    this.activeRingingAlarm = null;
    this.notifyRingingListeners();
    this.scheduleNextAlarm();
  }

  /**
   * Snooze the alarm for specified minutes (default 5 minutes).
   */
  public snoozeAlarm(id: string, minutes: number = 5) {
    this.stopAlarmAudio();
    const alarm = this.alarms.find((a) => a.id === id);
    if (alarm) {
      alarm.snoozeCount = (alarm.snoozeCount || 0) + 1;
      alarm.nextTriggerEpoch = Date.now() + minutes * 60 * 1000;
      this.saveAlarms();
    }
    this.activeRingingAlarm = null;
    this.notifyRingingListeners();
    this.scheduleNextAlarm();
  }

  /**
   * Dismiss the ringing alarm without taking medication.
   */
  public dismissAlarm(id: string) {
    this.stopAlarmAudio();
    this.activeRingingAlarm = null;
    this.notifyRingingListeners();
    this.scheduleNextAlarm();
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      return "denied";
    }
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch (err) {
      console.warn("Notification permission request error:", err);
      return Notification.permission;
    }
  }

  public getNotificationPermission(): NotificationPermission {
    if (!("Notification" in window)) return "denied";
    return Notification.permission;
  }

  // Subscriber methods
  public subscribeAlarms(listener: AlarmListener): () => void {
    this.alarmListeners.add(listener);
    listener(this.getAlarms());
    return () => this.alarmListeners.delete(listener);
  }

  public subscribeRinging(listener: RingingListener): () => void {
    this.ringingListeners.add(listener);
    listener(this.activeRingingAlarm);
    return () => this.ringingListeners.delete(listener);
  }

  private notifyAlarmListeners() {
    const list = this.getAlarms();
    this.alarmListeners.forEach((fn) => fn(list));
  }

  private notifyRingingListeners() {
    const ringing = this.activeRingingAlarm;
    this.ringingListeners.forEach((fn) => fn(ringing));
  }
}

export const alarmScheduler = new AlarmSchedulerService();
