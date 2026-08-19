import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlarmItem } from "../types";
import { alarmScheduler } from "../lib/alarmScheduler";
import { Bell, Check, Clock, Volume2, Sparkles, X, RotateCcw } from "lucide-react";
import { TranslationSchema } from "../lib/translations";

interface ActiveAlarmModalProps {
  onTakeMedication: (medicationId: string) => void;
  t: TranslationSchema;
}

export default function ActiveAlarmModal({ onTakeMedication, t }: ActiveAlarmModalProps) {
  const [ringingAlarm, setRingingAlarm] = useState<AlarmItem | null>(null);
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState<string>("");

  useEffect(() => {
    const unsubscribe = alarmScheduler.subscribeRinging((alarm) => {
      setRingingAlarm(alarm);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!ringingAlarm) return;

    const updateClock = () => {
      const now = new Date();
      setCurrentTimeFormatted(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [ringingAlarm]);

  if (!ringingAlarm) return null;

  const handleTake = () => {
    if (ringingAlarm.medicationId) {
      onTakeMedication(ringingAlarm.medicationId);
    }
    alarmScheduler.takeAlarmMedication(ringingAlarm.id);
  };

  const handleSnooze = () => {
    alarmScheduler.snoozeAlarm(ringingAlarm.id, 5);
  };

  const handleDismiss = () => {
    alarmScheduler.dismissAlarm(ringingAlarm.id);
  };

  return (
    <AnimatePresence>
      <div
        id="active-alarm-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-emerald-500 relative overflow-hidden flex flex-col items-center text-center"
        >
          {/* Animated Ambient Ringing Halo */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" />

          {/* Close button in top corner */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
            title="Dismiss alarm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Pulsing Alarm Bell Icon */}
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-100 animate-bounce">
              <Bell className="w-10 h-10 animate-[spin_1.5s_ease-in-out_infinite]" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full border-2 border-white shadow-xs">
              <Volume2 className="w-4 h-4 animate-pulse" />
            </div>
          </div>

          {/* Alarm Tag & Real-Time Clock */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Exact Time Alarm Ringing</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono font-bold mb-3">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Scheduled: {ringingAlarm.time}</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700">Current: {currentTimeFormatted}</span>
          </div>

          {/* Medication Title & Dosage */}
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1">
            {ringingAlarm.title}
          </h2>

          {ringingAlarm.dosage && (
            <p className="text-lg font-bold text-emerald-700 mb-3">
              Dosage: {ringingAlarm.dosage}
            </p>
          )}

          {/* Instructions Box */}
          {ringingAlarm.instructions && (
            <div className="w-full bg-[#F8FAF9] border border-emerald-100 rounded-2xl p-4 mb-6 text-left shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Instructions:
              </span>
              <p className="text-sm font-bold text-slate-800">
                👉 {ringingAlarm.instructions}
              </p>
            </div>
          )}

          {/* Big Action Buttons */}
          <div className="w-full space-y-3">
            {/* Take Now Button */}
            <button
              onClick={handleTake}
              id="btn-alarm-take-now"
              className="w-full py-4 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition text-white font-black text-lg sm:text-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3 cursor-pointer"
            >
              <Check className="w-6 h-6 stroke-[3.5px]" />
              <span>{t.yesITookIt}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Snooze 5 Minutes */}
              <button
                onClick={handleSnooze}
                id="btn-alarm-snooze"
                className="py-3 px-4 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Snooze (5 min)</span>
              </button>

              {/* Dismiss Button */}
              <button
                onClick={handleDismiss}
                id="btn-alarm-dismiss"
                className="py-3 px-4 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Dismiss</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
