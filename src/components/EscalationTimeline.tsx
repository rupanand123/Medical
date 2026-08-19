import React from "react";
import { Medication } from "../types";
import { CheckCircle2, AlertTriangle, AlertCircle, PhoneCall, ShieldAlert, ArrowRight, UserCheck } from "lucide-react";

interface EscalationTimelineProps {
  medications: Medication[];
}

export default function EscalationTimeline({ medications }: EscalationTimelineProps) {
  return (
    <div id="escalation-timeline" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            <span>Missed-Dose Safety Escalation Path</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Automated safety protocol when a scheduled medication dose is unconfirmed:
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 shadow-2xs self-start sm:self-auto">
          <span>Reminder</span>
          <span>➔</span>
          <span>Caregiver</span>
          <span>➔</span>
          <span>Doctor</span>
        </div>
      </div>

      <div className="space-y-4">
        {medications.map((med) => {
          const step = med.escalationStep; // 0, 1, 2, or 3
          const isTaken = med.status === "taken";
          
          return (
            <div
              key={med.id}
              id={`timeline-card-${med.id}`}
              className={`p-5 rounded-3xl border transition-all shadow-2xs ${
                isTaken
                  ? "bg-[#F8FAF9] border-emerald-100"
                  : step === 3
                  ? "bg-rose-50/60 border-rose-200 animate-pulse"
                  : step === 2
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-white border-slate-200/80"
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 border-b border-slate-100 pb-2.5">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    {med.name} <span className="text-xs text-slate-500 font-normal">({med.dosage})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Scheduled at <span className="text-emerald-700 font-mono font-bold">{med.scheduleTime}</span> for <strong className="text-slate-700">{med.disease}</strong>
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status:</span>
                  <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                    isTaken
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                      : step === 3
                      ? "bg-rose-100 text-rose-900 border border-rose-200"
                      : step === 2
                      ? "bg-amber-100 text-amber-900 border border-amber-200"
                      : step === 1
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}>
                    {isTaken ? "Taken ✅" : step === 3 ? "Escalated 🚨" : step === 2 ? "Missed ⚠️" : step === 1 ? "Reminded ⏰" : "Scheduled ⏳"}
                  </span>
                </div>
              </div>

              {/* Progress Pathway Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                {/* Step 1 */}
                <div id={`step-1-${med.id}`} className={`flex flex-col p-3 rounded-2xl border text-xs relative overflow-hidden transition ${
                  isTaken
                    ? "bg-white border-emerald-100 text-emerald-950 opacity-70"
                    : step >= 1
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-medium shadow-2xs"
                    : "bg-white border-slate-200 text-slate-400"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isTaken ? "bg-emerald-100 text-emerald-800" : step >= 1 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}>1</span>
                    <span className="font-extrabold text-slate-800">Elderly Reminder</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                    {step >= 1 ? "⏰ SMS/Call dispatched to Arthur at scheduled time." : "Will dispatch at scheduled time."}
                  </p>
                </div>

                {/* Step 2 */}
                <div id={`step-2-${med.id}`} className={`flex flex-col p-3 rounded-2xl border text-xs relative overflow-hidden transition ${
                  isTaken
                    ? "bg-white border-emerald-100 text-emerald-950 opacity-70"
                    : step >= 2
                    ? "bg-amber-50 border-amber-300 text-amber-950 font-medium shadow-2xs"
                    : "bg-white border-slate-200 text-slate-400"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isTaken ? "bg-emerald-100 text-emerald-800" : step >= 2 ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}>2</span>
                    <span className="font-extrabold text-slate-800">Caregiver Alert</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                    {step >= 2 ? "⚠️ +15m: SMS sent to Jane due to no senior confirmation." : "Dispatches after 15m delay."}
                  </p>
                </div>

                {/* Step 3 */}
                <div id={`step-3-${med.id}`} className={`flex flex-col p-3 rounded-2xl border text-xs relative overflow-hidden transition ${
                  isTaken
                    ? "bg-white border-emerald-100 text-emerald-950 opacity-70"
                    : step >= 3
                    ? "bg-rose-50 border-rose-300 text-rose-950 font-medium shadow-2xs"
                    : "bg-white border-slate-200 text-slate-400"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isTaken ? "bg-emerald-100 text-emerald-800" : step >= 3 ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}>3</span>
                    <span className="font-extrabold text-slate-800">Health Worker</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                    {step >= 3 ? "🚨 +30m: Critical alert sent to Dr. Smith for intervention." : "Dispatches after 30m delay."}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
