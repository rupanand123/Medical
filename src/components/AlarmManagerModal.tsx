import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlarmItem, AlarmSoundType, Medication } from "../types";
import { alarmScheduler } from "../lib/alarmScheduler";
import {
  Bell,
  Clock,
  Volume2,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Play,
  Square,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { TranslationSchema } from "../lib/translations";

interface AlarmManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
  olderAdultId?: string;
  t: TranslationSchema;
}

export default function AlarmManagerModal({
  isOpen,
  onClose,
  medications,
  olderAdultId,
  t,
}: AlarmManagerModalProps) {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    alarmScheduler.getNotificationPermission()
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [medicationId, setMedicationId] = useState("");
  const [scheduleType, setScheduleType] = useState<"daily" | "exact_datetime" | "specific_days">("daily");
  const [timeHour, setTimeHour] = useState("08");
  const [timeMinute, setTimeMinute] = useState("30");
  const [timeSecond, setTimeSecond] = useState("00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");
  const [use24Hour, setUse24Hour] = useState(false);
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [sound, setSound] = useState<AlarmSoundType>("gentle_chime");
  const [volume, setVolume] = useState<number>(0.9);
  const [vibrate, setVibrate] = useState<boolean>(true);
  const [instructions, setInstructions] = useState("");
  const [dosage, setDosage] = useState("");

  const [testingSound, setTestingSound] = useState<boolean>(false);
  const [nowEpoch, setNowEpoch] = useState<number>(Date.now());

  useEffect(() => {
    const unsubscribe = alarmScheduler.subscribeAlarms((list) => {
      setAlarms(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowEpoch(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setNotificationPermission(alarmScheduler.getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const perm = await alarmScheduler.requestNotificationPermission();
    setNotificationPermission(perm);
  };

  const handleMedicationSelect = (medId: string) => {
    setMedicationId(medId);
    if (!medId) return;

    const med = medications.find((m) => m.id === medId);
    if (med) {
      setTitle(med.name);
      setDosage(med.dosage);
      setInstructions(med.instructions);

      if (med.scheduleTime) {
        const parts = med.scheduleTime.split(":");
        let h = parseInt(parts[0]) || 8;
        const m = parts[1] || "00";
        if (use24Hour) {
          setTimeHour(String(h).padStart(2, "0"));
        } else {
          setTimePeriod(h >= 12 ? "PM" : "AM");
          const h12 = h % 12 || 12;
          setTimeHour(String(h12).padStart(2, "0"));
        }
        setTimeMinute(m);
      }
    }
  };

  // Convert hour/min/sec to internal 24-hour HH:MM:SS format
  const get24HourTime = (): string => {
    let h = parseInt(timeHour) || 0;
    if (!use24Hour) {
      if (timePeriod === "PM" && h < 12) h += 12;
      if (timePeriod === "AM" && h === 12) h = 0;
    }
    const hh = String(h).padStart(2, "0");
    const mm = String(parseInt(timeMinute) || 0).padStart(2, "0");
    const ss = String(parseInt(timeSecond) || 0).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const getComputedNextTriggerPreview = () => {
    const formattedTime = get24HourTime();
    const epoch = alarmScheduler.calculateNextTrigger(
      {
        scheduleType,
        time: formattedTime,
        targetDate: scheduleType === "exact_datetime" ? targetDate : undefined,
        daysOfWeek: scheduleType === "specific_days" ? selectedDays : undefined,
      },
      new Date()
    );

    const d = new Date(epoch);
    const diffMs = epoch - nowEpoch;
    if (diffMs <= 0) return "Triggering right now!";

    const diffSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSecs / 3600);
    const minutes = Math.floor((diffSecs % 3600) / 60);
    const seconds = diffSecs % 60;

    let countdownStr = "";
    if (hours > 0) countdownStr += `${hours}h `;
    if (minutes > 0 || hours > 0) countdownStr += `${minutes}m `;
    countdownStr += `${seconds}s`;

    return `Rings in ${countdownStr} • ${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
  };

  const handleStartEdit = (alarm: AlarmItem) => {
    setIsEditing(true);
    setEditingAlarmId(alarm.id);
    setTitle(alarm.title);
    setMedicationId(alarm.medicationId || "");
    setScheduleType(alarm.scheduleType);
    setTargetDate(alarm.targetDate || new Date().toISOString().split("T")[0]);
    setSelectedDays(alarm.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
    setSound(alarm.sound);
    setVolume(alarm.volume);
    setVibrate(alarm.vibrate);
    setInstructions(alarm.instructions || "");
    setDosage(alarm.dosage || "");

    // Parse time
    const [hStr, mStr, sStr] = alarm.time.split(":");
    let h = parseInt(hStr) || 8;
    const m = mStr || "00";
    const s = sStr || "00";
    if (use24Hour) {
      setTimeHour(String(h).padStart(2, "0"));
    } else {
      setTimePeriod(h >= 12 ? "PM" : "AM");
      const h12 = h % 12 || 12;
      setTimeHour(String(h12).padStart(2, "0"));
    }
    setTimeMinute(m);
    setTimeSecond(s);
  };

  const handleResetForm = () => {
    setIsEditing(false);
    setEditingAlarmId(null);
    setTitle("");
    setMedicationId("");
    setScheduleType("daily");
    setTimeHour("08");
    setTimeMinute("30");
    setTimeSecond("00");
    setTimePeriod("AM");
    setDosage("");
    setInstructions("");
  };

  const handleSaveAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formattedTime = get24HourTime();
    const payload: Partial<AlarmItem> = {
      id: editingAlarmId || undefined,
      title: title.trim(),
      medicationId: medicationId || undefined,
      olderAdultId,
      scheduleType,
      time: formattedTime,
      targetDate: scheduleType === "exact_datetime" ? targetDate : undefined,
      daysOfWeek: scheduleType === "specific_days" ? selectedDays : undefined,
      sound,
      volume,
      vibrate,
      instructions: instructions.trim(),
      dosage: dosage.trim(),
      enabled: true,
    };

    alarmScheduler.addOrUpdateAlarm(payload);
    handleResetForm();
  };

  const handleToggleSoundTest = () => {
    if (testingSound) {
      alarmScheduler.stopTestAlarmSound();
      setTestingSound(false);
    } else {
      setTestingSound(true);
      alarmScheduler.testAlarmSound(sound, volume);
      setTimeout(() => {
        setTestingSound(false);
      }, 2500);
    }
  };

  const formatCountdown = (targetEpoch: number): string => {
    const diff = targetEpoch - nowEpoch;
    if (diff <= 0) return "Triggering now";
    const diffSecs = Math.floor(diff / 1000);
    const hrs = Math.floor(diffSecs / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    const secs = diffSecs % 60;

    if (hrs > 0) return `in ${hrs}h ${mins}m`;
    if (mins > 0) return `in ${mins}m ${secs}s`;
    return `in ${secs}s`;
  };

  return (
    <div
      id="alarm-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-emerald-100 my-8 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950 text-white p-6 flex items-center justify-between gap-4 border-b border-emerald-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                  Precision Timing Engine
                </span>
                <span className="text-xs text-slate-400 font-mono">Zero-Delay Scheduler</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
                ⏰ Exact Alarm & Reminder Settings
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#F8FAF9]">
          {/* Notification Permission Status Banner */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {notificationPermission === "granted" ? (
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Native Notification & Background Audio Status:
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  {notificationPermission === "granted"
                    ? "✅ Native device notifications enabled. Alarms ring reliably in foreground and background."
                    : "⚠️ Permission recommended so alarms ring even when the browser tab is minimized or locked."}
                </p>
              </div>
            </div>

            {notificationPermission !== "granted" && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Native Alerts</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Schedule Form (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-emerald-100 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>{isEditing ? "Edit Alarm" : "Schedule New Exact Alarm"}</span>
                  {isEditing && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      Editing
                    </span>
                  )}
                </h3>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-bold cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveAlarm} className="space-y-4">
                {/* Link to Medication (Optional) */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                    Link with Active Medication (Optional):
                  </label>
                  <select
                    value={medicationId}
                    onChange={(e) => handleMedicationSelect(e.target.value)}
                    className="w-full bg-[#F8FAF9] border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Standalone Alarm / Custom Reminder --</option>
                    {medications.map((m) => (
                      <option key={m.id} value={m.id}>
                        💊 {m.name} ({m.dosage}) - Scheduled: {m.scheduleTime}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Alarm Title */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                    Alarm Title / Reminder Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metformin 500mg or Doctor Checkup"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#F8FAF9] border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Schedule Type Selection */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                    Recurrence Schedule:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleType("daily")}
                      className={`py-2 px-2.5 rounded-2xl text-[11px] font-bold border transition cursor-pointer text-center ${
                        scheduleType === "daily"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                          : "bg-[#F8FAF9] border-slate-200 text-slate-600"
                      }`}
                    >
                      Every Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType("exact_datetime")}
                      className={`py-2 px-2.5 rounded-2xl text-[11px] font-bold border transition cursor-pointer text-center ${
                        scheduleType === "exact_datetime"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                          : "bg-[#F8FAF9] border-slate-200 text-slate-600"
                      }`}
                    >
                      Exact Date &amp; Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType("specific_days")}
                      className={`py-2 px-2.5 rounded-2xl text-[11px] font-bold border transition cursor-pointer text-center ${
                        scheduleType === "specific_days"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                          : "bg-[#F8FAF9] border-slate-200 text-slate-600"
                      }`}
                    >
                      Specific Days
                    </button>
                  </div>
                </div>

                {/* Date Picker if exact_datetime */}
                {scheduleType === "exact_datetime" && (
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                      Target Date:
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full bg-[#F8FAF9] border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* Days of Week selector if specific_days */}
                {scheduleType === "specific_days" && (
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                      Select Active Days:
                    </label>
                    <div className="flex items-center gap-1.5 justify-between">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => {
                        const isSelected = selectedDays.includes(idx);
                        return (
                          <button
                            key={dayName}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedDays(selectedDays.filter((d) => d !== idx));
                              } else {
                                setSelectedDays([...selectedDays, idx].sort());
                              }
                            }}
                            className={`flex-1 py-1.5 rounded-xl text-[10px] font-extrabold border transition cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-[#F8FAF9] border-slate-200 text-slate-600"
                            }`}
                          >
                            {dayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Exact Time Picker with Second-Level Precision */}
                <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-emerald-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                      Exact Time (Hours : Minutes : Seconds):
                    </label>
                    <button
                      type="button"
                      onClick={() => setUse24Hour(!use24Hour)}
                      className="text-[10px] font-extrabold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                    >
                      Switch to {use24Hour ? "12-Hour (AM/PM)" : "24-Hour"} format
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Hour */}
                    <div className="flex-1">
                      <select
                        value={timeHour}
                        onChange={(e) => setTimeHour(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-sm font-mono font-black text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                      >
                        {Array.from({ length: use24Hour ? 24 : 12 }, (_, i) => {
                          const val = use24Hour ? i : i + 1;
                          const str = String(val).padStart(2, "0");
                          return (
                            <option key={str} value={str}>
                              {str}
                            </option>
                          );
                        })}
                      </select>
                      <span className="text-[9px] text-slate-400 font-bold block text-center mt-1 uppercase">Hour</span>
                    </div>

                    <span className="text-slate-400 font-black text-lg pb-4">:</span>

                    {/* Minute */}
                    <div className="flex-1">
                      <select
                        value={timeMinute}
                        onChange={(e) => setTimeMinute(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-sm font-mono font-black text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                      >
                        {Array.from({ length: 60 }, (_, i) => {
                          const str = String(i).padStart(2, "0");
                          return (
                            <option key={str} value={str}>
                              {str}
                            </option>
                          );
                        })}
                      </select>
                      <span className="text-[9px] text-slate-400 font-bold block text-center mt-1 uppercase">Min</span>
                    </div>

                    <span className="text-slate-400 font-black text-lg pb-4">:</span>

                    {/* Second */}
                    <div className="flex-1">
                      <select
                        value={timeSecond}
                        onChange={(e) => setTimeSecond(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-sm font-mono font-black text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                      >
                        {Array.from({ length: 60 }, (_, i) => {
                          const str = String(i).padStart(2, "0");
                          return (
                            <option key={str} value={str}>
                              {str}
                            </option>
                          );
                        })}
                      </select>
                      <span className="text-[9px] text-slate-400 font-bold block text-center mt-1 uppercase">Sec (00)</span>
                    </div>

                    {/* AM / PM Toggle if 12h */}
                    {!use24Hour && (
                      <div className="w-20">
                        <select
                          value={timePeriod}
                          onChange={(e) => setTimePeriod(e.target.value as "AM" | "PM")}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-center text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                        <span className="text-[9px] text-slate-400 font-bold block text-center mt-1 uppercase">AM/PM</span>
                      </div>
                    )}
                  </div>

                  {/* Calculated Precision Preview */}
                  <div className="pt-2 border-t border-slate-200/80 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{getComputedNextTriggerPreview()}</span>
                  </div>
                </div>

                {/* Alarm Ringtone & Sound Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                      Alarm Sound:
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={sound}
                        onChange={(e) => setSound(e.target.value as AlarmSoundType)}
                        className="flex-1 bg-[#F8FAF9] border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="gentle_chime">🔔 Gentle Morning Chime</option>
                        <option value="medical_beep">🚨 Crisp Medical Alert</option>
                        <option value="zen_bell">🧘 Harmonic Zen Bell</option>
                        <option value="vital_pulse">⚡ Vital Pulse Siren</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleToggleSoundTest}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          testingSound
                            ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                            : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                        }`}
                        title="Test Alarm Ringtone"
                      >
                        {testingSound ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-black uppercase text-slate-600 tracking-wider">
                        Volume:
                      </label>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                    Senior Dose Instructions:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Take with 1 glass of water after breakfast."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full bg-[#F8FAF9] border border-slate-200 rounded-2xl px-4 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    id="btn-save-exact-alarm"
                    className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/25"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isEditing ? "Update Alarm" : "Set Exact Alarm"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Active Alarms List (5 cols) */}
            <div className="lg:col-span-5 space-y-3 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Configured Alarms ({alarms.length})
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {alarms.filter((a) => a.enabled).length} Active
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px] pr-1">
                {alarms.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-dashed border-slate-200 text-xs p-6">
                    No alarms scheduled yet. Use the form to configure your first exact-time alarm.
                  </div>
                ) : (
                  alarms.map((alarm) => {
                    const isRinging = alarmScheduler.getActiveRingingAlarm()?.id === alarm.id;
                    return (
                      <div
                        key={alarm.id}
                        id={`alarm-card-${alarm.id}`}
                        className={`p-3.5 rounded-2xl border transition shadow-2xs flex flex-col gap-2 ${
                          isRinging
                            ? "bg-rose-50 border-rose-300 ring-2 ring-rose-400"
                            : alarm.enabled
                            ? "bg-white border-slate-200/80 hover:border-emerald-300"
                            : "bg-slate-50 border-slate-200 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 font-bold ${
                                alarm.enabled
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                                {alarm.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-mono font-black text-emerald-700">
                                  {alarm.time}
                                </span>
                                {alarm.dosage && (
                                  <span className="text-[10px] text-slate-500 font-bold">
                                    • {alarm.dosage}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => alarmScheduler.toggleAlarm(alarm.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition cursor-pointer border ${
                              alarm.enabled
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {alarm.enabled ? "ON" : "OFF"}
                          </button>
                        </div>

                        {/* Countdown & Schedule info */}
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 border-t border-slate-100 pt-2">
                          <span>
                            {alarm.enabled ? (
                              <span className="text-emerald-700 font-bold">
                                ⏳ Rings {formatCountdown(alarm.nextTriggerEpoch)}
                              </span>
                            ) : (
                              "Disabled"
                            )}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => alarmScheduler.testAlarmSound(alarm.sound, alarm.volume)}
                              className="p-1 text-slate-400 hover:text-emerald-700 rounded-md hover:bg-emerald-50 transition cursor-pointer"
                              title="Test Sound"
                            >
                              <Play className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(alarm)}
                              className="p-1 text-slate-400 hover:text-indigo-700 rounded-md hover:bg-indigo-50 transition cursor-pointer"
                              title="Edit Alarm"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => alarmScheduler.deleteAlarm(alarm.id)}
                              className="p-1 text-slate-400 hover:text-rose-700 rounded-md hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Alarm"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>High-precision local timing with Web Audio API &amp; Service Worker alerts.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
