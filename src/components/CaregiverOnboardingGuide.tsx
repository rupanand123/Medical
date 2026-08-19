import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  HelpCircle,
  Stethoscope,
  Clock,
  ArrowRight
} from "lucide-react";

export interface OnboardingStep {
  id: string;
  title: string;
  badge: string;
  icon: React.ReactNode;
  targetId: string;
  description: string;
  tip: string;
  actionText?: string;
}

interface CaregiverOnboardingGuideProps {
  currentStep: number;
  totalSteps: number;
  isOpen: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onRestart: () => void;
  onGoToStep: (stepIndex: number) => void;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "patient_hub",
    title: "Caregiver Code & Patient Hub",
    badge: "Step 1 of 4",
    icon: <HelpCircle className="w-5 h-5 text-emerald-600" />,
    targetId: "caregiver-connection-banner",
    description: "Share your permanent 6-character Caregiver Code with seniors to securely link accounts. Switch between monitored patients and review shared prescriptions & lab reports seamlessly.",
    tip: "Tip: The green pulsing dot confirms real-time sync with Arthur's app.",
    actionText: "Next: Medication Roster"
  },
  {
    id: "adherence_roster",
    title: "Adherence Roster & Stock Management",
    badge: "Step 2 of 4",
    icon: <Clock className="w-5 h-5 text-emerald-600" />,
    targetId: "caregiver-roster-card",
    description: "Track live dose statuses (Taken, Reminded, Missed). Pill inventory counters automatically calculate remaining dosages and trigger low-stock alerts when below 5 pills.",
    tip: "Tip: Click 'Request Refill' or '+30 Restock' to manage pharmacy inventory.",
    actionText: "Next: Force Escalate"
  },
  {
    id: "force_escalate",
    title: "Force Escalate (Safety Pipeline)",
    badge: "Step 3 of 4 • Critical Safety",
    icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
    targetId: "btn-escalate-trigger-demo",
    description: "Experience or manually trigger the missed-dose safety protocol. When a senior misses a dose, the system advances from Senior Reminder ➔ Caregiver SMS Alert ➔ Emergency Doctor Escalation.",
    tip: "Tip: The 'Trigger Step' button lets you simulate unacknowledged doses in real-time.",
    actionText: "Next: Clinical Intelligence"
  },
  {
    id: "disease_intelligence",
    title: "Disease Intelligence & Drug Safety",
    badge: "Step 4 of 4 • AI Verification",
    icon: <Sparkles className="w-5 h-5 text-emerald-600" />,
    targetId: "disease-intelligence-portal",
    description: "Powered by Gemini AI, query WHO clinical guidelines by disease name, pull standardized RxNorm codes, and audit active medications for cross-drug contraindications.",
    tip: "Tip: Try quick searches like 'Type 2 Diabetes' or check cross-drug safety for 'Ibuprofen'.",
    actionText: "Complete Tour"
  }
];

export default function CaregiverOnboardingGuide({
  currentStep,
  totalSteps,
  isOpen,
  onNext,
  onPrev,
  onClose,
  onRestart,
  onGoToStep
}: CaregiverOnboardingGuideProps) {
  const step = ONBOARDING_STEPS[currentStep] || ONBOARDING_STEPS[0];

  useEffect(() => {
    if (!isOpen) return;

    // Scroll to the targeted feature container smoothly
    const targetElement = document.getElementById(step.targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentStep, isOpen, step.targetId]);

  if (!isOpen) return null;

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-banner"
        initial={{ opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.98 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-emerald-500/30 relative overflow-hidden ring-4 ring-emerald-500/10 mb-6"
      >
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80 shadow-2xs">
              {step.icon}
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                  {step.badge}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Caregiver Feature Walkthrough
                </span>
              </div>

              <h4 className="text-base font-extrabold text-slate-900">
                {step.title}
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {step.description}
              </p>

              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 px-3 py-1 rounded-xl border border-emerald-100 mt-1">
                <span>💡</span>
                <span>{step.tip}</span>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 self-end md:self-center border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 w-full md:w-auto">
            {/* Step indicator dots */}
            <div className="flex items-center justify-center gap-1.5 px-2">
              {ONBOARDING_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => onGoToStep(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStep
                      ? "bg-emerald-600 w-6"
                      : idx < currentStep
                      ? "bg-emerald-300 hover:bg-emerald-400"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                  title={`Go to ${s.title}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 justify-end">
              {currentStep > 0 && (
                <button
                  onClick={onPrev}
                  className="px-3 py-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                onClick={onNext}
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>{isLastStep ? "Finish Guide" : step.actionText || "Next"}</span>
                {isLastStep ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Dismiss Guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
