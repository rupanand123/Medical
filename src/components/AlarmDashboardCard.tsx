import React, { useState, useEffect } from "react";
import { AlarmItem, Medication } from "../types";
import { alarmScheduler } from "../lib/alarmScheduler";
import {
  Bell,
  Clock,
  Volume2,
  Settings,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { TranslationSchema } from "../lib/translations";

interface AlarmDashboardCardProps {
  role: "elderly" | "caregiver";
  medications: Medication[];
  onOpenManager: () => void;
  t: TranslationSchema;
}

export default function AlarmDashboardCard({
  role,
  medications,
  onOpenManager,
  t,
}: AlarmDashboardCardProps) {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [nowEpoch, setNowEpoch] = useState<number>(Date.now());
  const [testingSound, setTestingSound] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission>(
    alarmScheduler.getNotificationPermission()
  );

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

  // Sync active medications into alarms if not already present
  useEffect(() => {
    if (medications.length > 0) {
      alarmScheduler.syncMedicationsToAlarms(medications);
    }
  }, [medications]);

  const enabledAlarms = alarms.filter((a) => a.enabled);
  const nextAlarm = enabledAlarms.sort((a, b) => a.nextTriggerEpoch - b.nextTriggerEpoch)[0];

  const formatCountdown = (targetEpoch: number): string => {
    const diff = targetEpoch - nowEpoch;
    if (diff <= 0) return "Triggering right now!";
    const diffSecs = Math.floor(diff / 1000);
    const hrs = Math.floor(diffSecs / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    const secs = diffSecs % 60;

    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const handleTestSound = () => {
    if (testingSound) {
      alarmScheduler.stopTestAlarmSound();
      setTestingSound(false);
    } else {
      setTestingSound(true);
      alarmScheduler.testAlarmSound("gentle_chime", 0.9);
      setTimeout(() => setTestingSound(false), 2200);
    }
  };

  const handleEnablePermissions = async () => {
    const p = await alarmScheduler.requestNotificationPermission();
    setPerm(p);
  };

  return (
    <div
      id="alarm-dashboard-card"
      className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                ⏰ Exact-Time Alarms &amp; Notifications
              </h3>
              <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                Precision Scheduler
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {role === "elderly"
                ? "Alarms ring at the exact scheduled second with audio chimes and native device alerts."
                : "Configure exact reminder times, ringtones, and native notifications for the patient."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Test Sound Button */}
          <button
            type="button"
            onClick={handleTestSound}
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold border transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              testingSound
                ? "bg-rose-50 border-rose-300 text-rose-800 animate-pulse"
                : "bg-[#F8FAF9] hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
            title="Test alarm sound"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{testingSound ? "Playing Sound..." : "Test Sound"}</span>
          </button>

          {/* Manage Alarms Button */}
          <button
            type="button"
            onClick={onOpenManager}
            id="btn-open-alarm-manager"
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-black transition flex items-center gap-1.5 shadow-sm hover:shadow-emerald-600/20 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{role === "elderly" ? "Adjust Alarms" : "Manage Alarms"}</span>
          </button>
        </div>
      </div>

      {/* Main Focus: Next Ringing Alarm or Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Next Alarm Banner (8 cols) */}
        <div className="md:col-span-8 bg-[#F8FAF9] border border-emerald-100/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-2xs shrink-0">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Next Scheduled Ring:
              </div>
              {nextAlarm ? (
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900">
                    {nextAlarm.title}
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                    {nextAlarm.time}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-bold text-slate-500">
                  No active alarms. Click "Manage Alarms" to create one.
                </span>
              )}
            </div>
          </div>

          {nextAlarm && (
            <div className="text-right shrink-0">
              <span className="text-[10px] font-black uppercase text-slate-400 block">
                Countdown:
              </span>
              <span className="text-xs sm:text-sm font-mono font-black text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                ⏳ {formatCountdown(nextAlarm.nextTriggerEpoch)}
              </span>
            </div>
          )}
        </div>

        {/* Browser Permission Status (4 cols) */}
        <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            {perm === "granted" ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            )}
            <div>
              <div className="text-[10px] font-black uppercase text-slate-400">
                Device Alerts:
              </div>
              <span className="text-xs font-bold text-slate-800">
                {perm === "granted" ? "✅ Enabled" : "⚠️ Needs Permission"}
              </span>
            </div>
          </div>

          {perm !== "granted" && (
            <button
              type="button"
              onClick={handleEnablePermissions}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-[10px] font-extrabold cursor-pointer transition shadow-2xs"
            >
              Allow
            </button>
          )}
        </div>
      </div>

      {/* Mini Active Alarms Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
        {alarms.map((alarm) => (
          <div
            key={alarm.id}
            onClick={onOpenManager}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 cursor-pointer transition shrink-0 ${
              alarm.enabled
                ? "bg-white border-slate-200/80 text-slate-800 hover:border-emerald-400 shadow-2xs"
                : "bg-slate-100 border-slate-200 text-slate-400 opacity-60"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{alarm.title}</span>
            <span className="font-mono text-emerald-700 font-extrabold">({alarm.time})</span>
          </div>
        ))}

        <button
          type="button"
          onClick={onOpenManager}
          className="px-3 py-1.5 rounded-full border border-dashed border-slate-300 text-slate-500 hover:text-emerald-700 hover:border-emerald-400 text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Alarm</span>
        </button>
      </div>
    </div>
  );
}
