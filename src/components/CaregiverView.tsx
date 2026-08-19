import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Medication, ChatMessage, OlderAdultProfile, MedicalFile, MedicineConfirmation } from "../types";
import {
  Plus,
  Trash2,
  ShieldAlert,
  CheckCircle,
  Clock,
  Send,
  Copy,
  Check,
  RefreshCw,
  Share2,
  UserCheck,
  FileText,
  Upload,
  ExternalLink,
  Users,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { TranslationSchema, Language } from "../lib/translations";
import ChatWidget from "./ChatWidget";
import CaregiverOnboardingGuide, { ONBOARDING_STEPS } from "./CaregiverOnboardingGuide";
import AlarmDashboardCard from "./AlarmDashboardCard";

interface CaregiverViewProps {
  medications: Medication[];
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, isVoice?: boolean, fileUrl?: string, fileName?: string) => Promise<void>;
  simulatedTime: string;
  onAddMedication: (med: Partial<Medication>) => void;
  onDeleteMedication: (id: string) => void;
  onForceEscalate: (id: string) => void;
  onRequestRefill?: (id: string) => void;
  onRestockMedication?: (id: string, count?: number) => void;
  caregiverCode?: string;
  olderAdults?: OlderAdultProfile[];
  activeOlderAdultId?: string;
  medicalFiles?: MedicalFile[];
  confirmations?: MedicineConfirmation[];
  onResetCode?: () => void;
  onSwitchPatient?: (id: string) => void;
  onUploadMedicalFile?: (file: { fileName: string; fileType: string; fileUrl: string; notes?: string }) => void;
  onOpenAlarmManager?: () => void;
  t: TranslationSchema;
  language: Language;
}

export default function CaregiverView({
  medications,
  chatMessages,
  onSendMessage,
  simulatedTime,
  onAddMedication,
  onDeleteMedication,
  onForceEscalate,
  onRequestRefill,
  onRestockMedication,
  caregiverCode = "CG-A8K3X9",
  olderAdults = [],
  activeOlderAdultId = "oa-1",
  medicalFiles = [],
  confirmations = [],
  onResetCode,
  onSwitchPatient,
  onUploadMedicalFile,
  onOpenAlarmManager,
  t,
  language
}: CaregiverViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"medications" | "medical_files" | "chat">("medications");
  const [copied, setCopied] = useState(false);
  const [shareNotice, setShareNotice] = useState(false);

  // Onboarding Guided Tour states (active for first-time visitors or on demand)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return localStorage.getItem("caregiver_onboarding_completed") !== "true";
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(0);

  const handleNextOnboardingStep = () => {
    if (onboardingStep < ONBOARDING_STEPS.length - 1) {
      setOnboardingStep((prev) => prev + 1);
    } else {
      setIsOnboardingOpen(false);
      localStorage.setItem("caregiver_onboarding_completed", "true");
    }
  };

  const handlePrevOnboardingStep = () => {
    if (onboardingStep > 0) {
      setOnboardingStep((prev) => prev - 1);
    }
  };

  const handleCloseOnboarding = () => {
    setIsOnboardingOpen(false);
    localStorage.setItem("caregiver_onboarding_completed", "true");
  };

  const handleRestartOnboarding = () => {
    setOnboardingStep(0);
    setIsOnboardingOpen(true);
  };

  const handleGoToOnboardingStep = (stepIndex: number) => {
    setOnboardingStep(stepIndex);
  };

  // Form states
  const [formName, setFormName] = useState("");
  const [formDose, setFormDose] = useState("");
  const [formFreq, setFormFreq] = useState("Once daily");
  const [formTime, setFormTime] = useState("08:00");
  const [formDisease, setFormDisease] = useState("");
  const [formInst, setFormInst] = useState("");
  const [formPills, setFormPills] = useState("30");

  // File Upload Form states
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("prescription");
  const [fileUrl, setFileUrl] = useState("");
  const [fileNotes, setFileNotes] = useState("");

  const handleCopyCode = () => {
    navigator.clipboard.writeText(caregiverCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCode = () => {
    setShareNotice(true);
    setTimeout(() => setShareNotice(false), 3000);
  };

  const handleSubmitMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDose || !formTime || !formDisease) return;

    const initialPillNum = parseInt(formPills) || 30;
    onAddMedication({
      name: formName,
      dosage: formDose,
      frequency: formFreq,
      scheduleTime: formTime,
      disease: formDisease,
      instructions: formInst || "Take as directed.",
      pillsRemaining: initialPillNum,
      totalPills: initialPillNum,
      refillRequested: false,
      rxnormCode: "N/A",
      drugbankId: "N/A"
    });

    setFormName("");
    setFormDose("");
    setFormFreq("Once daily");
    setFormTime("08:00");
    setFormDisease("");
    setFormInst("");
    setFormPills("30");
  };

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !fileUrl) return;

    if (onUploadMedicalFile) {
      onUploadMedicalFile({
        fileName,
        fileType,
        fileUrl,
        notes: fileNotes
      });
    }

    setFileName("");
    setFileUrl("");
    setFileNotes("");
  };

  const activeAdult = olderAdults.find(o => o.id === activeOlderAdultId) || olderAdults[0] || {
    id: "oa-1",
    name: "Arthur Pendelton",
    avatar: "👴",
    age: 78,
    status: "online",
    lastActivity: "Active now",
    conditions: "Type 2 Diabetes, Hypertension"
  };

  // Stats calculate
  const totalMeds = medications.length;
  const takenMeds = medications.filter(m => m.status === "taken").length;
  const missedMeds = medications.filter(m => m.status === "missed").length;
  const escalatedMeds = medications.filter(m => m.status === "escalated").length;

  return (
    <motion.div
      id="caregiver-view"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Onboarding Feature Walkthrough Guide */}
      <CaregiverOnboardingGuide
        currentStep={onboardingStep}
        totalSteps={ONBOARDING_STEPS.length}
        isOpen={isOnboardingOpen}
        onNext={handleNextOnboardingStep}
        onPrev={handlePrevOnboardingStep}
        onClose={handleCloseOnboarding}
        onRestart={handleRestartOnboarding}
        onGoToStep={handleGoToOnboardingStep}
      />

      {/* Caregiver Permanent Connection Code Banner */}
      <motion.div
        id="caregiver-connection-banner"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.05, ease: "easeOut" }}
        className="bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950 text-white p-6 rounded-3xl shadow-md border border-emerald-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
      >
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-3 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
              <UserCheck className="w-3 h-3 text-emerald-400" />
              Caregiver Connection System
            </span>
            <span className="text-xs text-slate-400 font-medium">Permanent Sync Code</span>
            
            <button
              onClick={isOnboardingOpen ? handleCloseOnboarding : handleRestartOnboarding}
              id="btn-toggle-onboarding-guide"
              className="inline-flex items-center gap-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 hover:text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full border border-emerald-400/40 transition cursor-pointer shadow-2xs"
              title="Toggle Caregiver Dashboard Guided Tour"
            >
              <Sparkles className="w-3 h-3 text-emerald-300" />
              <span>{isOnboardingOpen ? "Hide Guide" : "💡 Onboarding Guide"}</span>
            </button>
          </div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            {t.connectionCodeTitle}
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
            Share this code with older adults to securely link them to your caregiver monitoring dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 bg-white/5 p-2 rounded-2xl border border-white/10 z-10">
          <div className="px-3.5 py-1.5 bg-slate-950/90 rounded-xl border border-emerald-500/40 text-center">
            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Your Code</span>
            <span id="caregiver-code-display" className="text-lg font-mono font-black text-emerald-300 tracking-wider">
              {caregiverCode}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            id="btn-copy-caregiver-code"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
            {copied ? t.codeCopied : t.copyCode}
          </button>

          <button
            onClick={handleShareCode}
            id="btn-share-caregiver-code"
            className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
            title="Share connection code"
          >
            <Share2 className="w-4 h-4 text-slate-300" />
            Share
          </button>

          {onResetCode && (
            <button
              onClick={onResetCode}
              id="btn-reset-caregiver-code"
              className="p-2 text-slate-400 hover:text-white rounded-xl transition cursor-pointer hover:bg-slate-800"
              title={t.resetCode}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {shareNotice && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-200 flex items-center justify-between shadow-2xs"
        >
          <span>
            📋 <strong>Connection Code Copied to Share:</strong> Send <strong>{caregiverCode}</strong> to your older adult to connect them directly to your app.
          </span>
          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md font-bold">Ready</span>
        </motion.div>
      )}

      {/* Switch Patient / Connected Older Adults Bar */}
      {olderAdults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08, ease: "easeOut" }}
          className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-indigo-600" />
            <span className="text-xs font-bold text-gray-800">{t.connectedSeniors}:</span>
            <div className="flex items-center gap-1.5">
              {olderAdults.map((adult) => {
                const isActive = adult.id === activeOlderAdultId;
                return (
                  <button
                    key={adult.id}
                    onClick={() => onSwitchPatient && onSwitchPatient(adult.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>{adult.avatar || "👴"}</span>
                    <span>{adult.name}</span>
                    {adult.connectedCaregiverId && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span className="font-semibold text-gray-700">{t.activePatient}:</span>
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {activeAdult.name} ({activeAdult.conditions || "Monitored"})
            </span>
          </div>
        </motion.div>
      )}

      {/* Patient Precision Alarm Schedule & Notifications Dashboard Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.12, ease: "easeOut" }}
      >
        <AlarmDashboardCard
          role="caregiver"
          medications={medications}
          onOpenManager={onOpenAlarmManager || (() => {})}
          t={t}
        />
      </motion.div>

      {/* Sub-navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
        className="flex items-center justify-between bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("medications")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === "medications"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-slate-100"
            }`}
          >
            📋 {t.medicationsTab}
          </button>
          <button
            onClick={() => setActiveSubTab("medical_files")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
              activeSubTab === "medical_files"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-slate-100"
            }`}
          >
            📁 {t.medicalReportsAndFiles}
            {medicalFiles.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-indigo-500 text-white rounded-full text-[10px] font-mono">
                {medicalFiles.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("chat")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
              activeSubTab === "chat"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-slate-100"
            }`}
          >
            💬 {t.chatTab}
            {chatMessages.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[10px] font-mono">
                {chatMessages.length}
              </span>
            )}
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeSubTab === "chat" ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <ChatWidget
              chatMessages={chatMessages}
              currentRole="caregiver"
              onSendMessage={onSendMessage}
              simulatedTime={simulatedTime}
              t={t}
              language={language}
            />
          </motion.div>
        ) : activeSubTab === "medical_files" ? (
          <motion.div
            key="medical_files"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
          >
            {/* Medical Reports & Prescriptions List */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.04 }}
              className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    {t.medicalReportsAndFiles} for {activeAdult.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Shared prescriptions, lab results, and health records linked to this older adult.
                  </p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold">
                  {medicalFiles.length} Files
                </span>
              </div>

              <div className="space-y-3">
                {medicalFiles.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 italic bg-slate-50 rounded-xl border border-dashed border-gray-200">
                    No medical reports or prescriptions shared yet. Upload a file below to share with {activeAdult.name}.
                  </div>
                ) : (
                  medicalFiles.map((file) => (
                    <div key={file.id} className="p-4 rounded-xl border border-gray-200 hover:border-indigo-200 bg-slate-50/50 flex items-center justify-between gap-4 transition">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl font-bold">
                          📄
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900">{file.fileName}</h4>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                              {file.fileType}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{file.notes}</p>
                          <span className="text-[10px] text-gray-400 font-mono">Uploaded: {file.uploadedAt} by {file.sender}</span>
                        </div>
                      </div>

                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-indigo-200 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View File
                      </a>
                    </div>
                  ))
                )}
              </div>

              {/* Confirmations List */}
              {confirmations.length > 0 && (
                <div className="pt-4 border-t border-gray-150 space-y-3">
                  <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    {t.medicationConfirmations} History ({activeAdult.name})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {confirmations.map((conf) => (
                      <div key={conf.id} className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <strong className="text-emerald-950">{conf.medicationName}</strong> ({conf.dosage})
                            <span className="text-[10px] text-emerald-700 block">Confirmed taken on {conf.date}</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                          {conf.takenTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Upload File Form */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                  <Upload className="w-4.5 h-4.5 text-indigo-500" />
                  {t.uploadReport}
                </h3>
                <p className="text-xs text-gray-500 mb-4">Upload prescription or doctor report for {activeAdult.name}</p>

                <form onSubmit={handleFileUpload} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">File Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Dr. Smith Prescription - Feb 2026.pdf"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Document Category</label>
                    <select
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="prescription">Prescription</option>
                      <option value="lab_report">Lab / Blood Report</option>
                      <option value="discharge_summary">Discharge Summary</option>
                      <option value="doctor_note">Doctor Note</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">File URL / Document Link *</label>
                    <input
                      type="text"
                      required
                      placeholder="https://example.com/medical-report.pdf"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Notes / Instructions</label>
                    <textarea
                      placeholder="E.g., Renewed Metformin prescription from Dr. Smith."
                      value={fileNotes}
                      onChange={(e) => setFileNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!fileName || !fileUrl}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload & Share File
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="medications"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Metrics Row */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 lg:grid-cols-5 gap-4"
            >
            {[
              { label: t.activeSchedules, val: totalMeds, color: "text-slate-900", bg: "bg-slate-50" },
              { label: t.takenToday, val: `${takenMeds}/${totalMeds}`, color: "text-emerald-700", bg: "bg-emerald-50/50" },
              { label: t.missedAlerts, val: missedMeds, color: "text-amber-700", bg: "bg-amber-50/40" },
              { label: t.escalatedToDoctor, val: escalatedMeds, color: "text-rose-750 font-bold", bg: "bg-rose-50/40" },
              {
                label: "Refill Alerts (<5)",
                val: medications.filter(m => (typeof m.pillsRemaining === "number" && m.pillsRemaining < 5) || m.refillRequested).length,
                color: medications.some(m => (typeof m.pillsRemaining === "number" && m.pillsRemaining < 5) || m.refillRequested) ? "text-amber-700 font-extrabold" : "text-slate-600",
                bg: medications.some(m => (typeof m.pillsRemaining === "number" && m.pillsRemaining < 5) || m.refillRequested) ? "bg-amber-50 border-amber-200" : "bg-slate-50"
              }
            ].map((stat, i) => (
              <div key={i} className={`p-4 rounded-xl border border-gray-100/80 shadow-xs ${stat.bg}`}>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">{stat.label}</span>
                <span className={`text-2xl font-black ${stat.color} block mt-1`}>{stat.val}</span>
              </div>
            ))}
          </motion.div>

          {/* Automatic Low Medication Count Refill Banner */}
          {medications.some(m => (typeof m.pillsRemaining === "number" && m.pillsRemaining < 5) || m.refillRequested) && (
            <motion.div
              id="low-stock-refill-banner"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    💊
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-amber-950 flex items-center gap-2">
                      Low Medication Stock Alert (&lt; 5 Pills Remaining)
                      <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Action Needed
                      </span>
                    </h3>
                    <p className="text-xs text-amber-800">
                      The system automatically detected medications with low remaining pill counts for {activeAdult.name}. Submit a refill request or restock inventory below.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {medications
                  .filter(m => (typeof m.pillsRemaining === "number" && m.pillsRemaining < 5) || m.refillRequested)
                  .map(med => (
                    <div key={`refill-alert-${med.id}`} className="bg-white rounded-xl p-3.5 border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 font-extrabold text-sm">{med.name}</strong>
                          <span className="text-xs text-slate-500 font-medium">({med.dosage})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Treats: {med.disease}</p>
                        
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                            (med.pillsRemaining ?? 0) < 5
                              ? "bg-rose-100 text-rose-900 border border-rose-300 animate-pulse"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            💊 {med.pillsRemaining ?? 0} pills left
                          </span>
                          {med.refillRequested && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-300">
                              ⏳ Refill Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => onRequestRefill && onRequestRefill(med.id)}
                          id={`btn-request-refill-${med.id}`}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          💊 Request Refill
                        </button>
                        <button
                          onClick={() => onRestockMedication && onRestockMedication(med.id, 30)}
                          id={`btn-restock-30-${med.id}`}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          +30 Restock
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Table/Cards listing active medications */}
            <motion.div
              id="caregiver-roster-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.04, ease: "easeOut" }}
              className={`xl:col-span-2 bg-white rounded-3xl p-6 shadow-sm border transition-all duration-300 flex flex-col justify-between ${
                isOnboardingOpen && onboardingStep === 1
                  ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg"
                  : "border-slate-100"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-gray-150 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>{t.adherenceRoster}</span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {activeAdult.name}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{t.rosterDescription}</p>
                  </div>
                  <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-extrabold border border-emerald-200">
                    {medications.length} {t.activeSchedules}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold">
                        <th className="py-2.5 px-3">{t.medication}</th>
                        <th className="py-2.5 px-3">{t.schedule}</th>
                        <th className="py-2.5 px-3">Stock / Pills</th>
                        <th className="py-2.5 px-3">{t.adherenceStatus}</th>
                        <th className="py-2.5 px-3">{t.escalationPhase}</th>
                        <th className="py-2.5 px-3 text-right">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/60 font-medium text-gray-700">
                      {medications.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                            {t.noMeds}
                          </td>
                        </tr>
                      ) : (
                        medications.map((med, index) => {
                          const isLowStock = typeof med.pillsRemaining === "number" && med.pillsRemaining < 5;
                          const isSpotlightTarget = isOnboardingOpen && onboardingStep === 2 && (index === 0 || medications.findIndex(m => m.status !== "taken") === index);

                          return (
                            <tr key={med.id} id={`caregiver-row-${med.id}`} className="hover:bg-slate-50/50 transition">
                              {/* Med Info */}
                              <td className="py-3 px-3">
                                <span className="font-extrabold text-slate-900 text-sm block">{med.name}</span>
                                <span className="text-[10px] text-gray-500 block font-normal mt-0.5">
                                  {med.dosage} • treats {med.disease}
                                </span>
                              </td>

                              {/* Schedule */}
                              <td className="py-3 px-3">
                                <span className="flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md w-max text-[11px] border border-emerald-100">
                                  <Clock className="w-3.5 h-3.5" />
                                  {med.scheduleTime}
                                </span>
                                <span className="text-[10px] text-gray-400 block font-normal mt-0.5">{med.frequency}</span>
                              </td>

                              {/* Stock / Pills Count Column */}
                              <td className="py-3 px-3">
                                <div className="flex flex-col gap-1">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] w-max ${
                                    isLowStock
                                      ? "bg-rose-100 text-rose-900 border border-rose-300 font-extrabold animate-pulse"
                                      : "bg-slate-100 text-slate-700"
                                  }`}>
                                    💊 {med.pillsRemaining ?? 30} / {med.totalPills ?? 30}
                                  </span>
                                  {med.refillRequested ? (
                                    <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 w-max">
                                      Refill Pending
                                    </span>
                                  ) : isLowStock ? (
                                    <button
                                      onClick={() => onRequestRefill && onRequestRefill(med.id)}
                                      className="text-[10px] font-extrabold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300 w-max cursor-pointer"
                                    >
                                      Prompt Refill
                                    </button>
                                  ) : null}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  med.status === "taken"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : med.status === "missed"
                                    ? "bg-amber-100 text-amber-800 animate-pulse"
                                    : med.status === "escalated"
                                    ? "bg-rose-100 text-rose-800 font-extrabold animate-pulse border border-rose-200"
                                    : "bg-blue-100 text-blue-800"
                                }`}>
                                  {med.status}
                                </span>
                                {med.lastActionTime && (
                                  <span className="text-[10px] text-gray-400 block font-normal mt-0.5">Taken at {med.lastActionTime}</span>
                                )}
                              </td>

                              {/* Escalation Phase */}
                              <td className="py-3 px-3">
                                {med.status === "taken" ? (
                                  <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                    Secured
                                  </span>
                                ) : med.escalationStep === 0 ? (
                                  <span className="text-[10px] text-gray-400">0 - Waiting</span>
                                ) : (
                                  <div className="flex flex-col gap-0.5">
                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${
                                      med.escalationStep === 3
                                        ? "text-rose-600 font-black"
                                        : med.escalationStep === 2
                                        ? "text-amber-600"
                                        : "text-blue-600"
                                    }`}>
                                      {med.escalationStep === 3 ? "🚨 Doctor Alert" : med.escalationStep === 2 ? "⚠️ Caregiver SMS" : "⏰ Patient SMS"}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-mono">Phase {med.escalationStep}/3</span>
                                  </div>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5 relative">
                                  {med.status !== "taken" && (
                                    <div className="relative inline-flex flex-col items-end">
                                      <AnimatePresence>
                                        {isSpotlightTarget && (
                                          <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.92 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                            transition={{ duration: 0.22, ease: "easeOut" }}
                                            className="absolute -top-11 right-0 z-30 whitespace-nowrap bg-rose-950 text-rose-100 text-[10px] font-extrabold px-3 py-1 rounded-full shadow-xl border border-rose-400/80 flex items-center gap-1.5 ring-4 ring-rose-500/20 pointer-events-none"
                                          >
                                            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping shrink-0" />
                                            <span>Safety Tooltip: Trigger Force Escalate</span>
                                            <div className="absolute top-full right-5 -mt-0.5 border-4 border-transparent border-t-rose-950" />
                                          </motion.div>
                                        )}
                                      </AnimatePresence>

                                      <button
                                        onClick={() => onForceEscalate(med.id)}
                                        id={index === 0 ? "btn-escalate-trigger-demo" : `btn-escalate-trigger-${med.id}`}
                                        className={`rounded-full px-2.5 py-1 transition cursor-pointer flex items-center gap-1 text-[10px] font-extrabold border ${
                                          isSpotlightTarget
                                            ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-400 ring-4 ring-rose-500/25 shadow-md animate-pulse"
                                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                                        }`}
                                        title="Manually prompt next safety escalation step for demo"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5 text-current animate-spin" />
                                        {t.triggerStep}
                                      </button>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => onDeleteMedication(med.id)}
                                    id={`btn-delete-med-${med.id}`}
                                    className="text-gray-400 hover:text-rose-600 rounded-full p-1.5 transition hover:bg-rose-50 cursor-pointer"
                                    title="Delete schedule"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-gray-150 flex items-start gap-2 text-slate-600 leading-relaxed text-[11px]">
                <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-indigo-500 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Reviewer Note:</strong> {t.reviewerNote}
                </div>
              </div>
            </motion.div>

            {/* Add Medication Form */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.08, ease: "easeOut" }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                  <Plus className="w-4.5 h-4.5 text-indigo-500" />
                  {t.addManual}
                </h3>
                <p className="text-xs text-gray-500 mb-4">Register a custom medicine with timing for {activeAdult.name}</p>

                <form onSubmit={handleSubmitMed} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">{t.drugName} *</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Lisinopril, Metformin..."
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">{t.dosage} *</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g., 500mg, 1 tab"
                        value={formDose}
                        onChange={(e) => setFormDose(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">{t.scheduleTime} *</label>
                      <input
                        type="text"
                        required
                        placeholder="HH:MM (e.g. 08:00)"
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">{t.condition} *</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g., Type 2 Diabetes"
                        value={formDisease}
                        onChange={(e) => setFormDisease(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Pill Bottle Stock *</label>
                      <input
                        type="number"
                        min="1"
                        max="300"
                        required
                        placeholder="30"
                        value={formPills}
                        onChange={(e) => setFormPills(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">{t.seniorInstructions}</label>
                    <textarea
                      placeholder="E.g., Take with morning meal, avoid juice."
                      value={formInst}
                      onChange={(e) => setFormInst(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!formName || !formDose || !formTime || !formDisease}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {t.registerSchedule}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>

          {/* Caregiver & Elderly Interactive Chat Hub */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12, ease: "easeOut" }}
          >
            <ChatWidget
              chatMessages={chatMessages}
              currentRole="caregiver"
              onSendMessage={onSendMessage}
              simulatedTime={simulatedTime}
              t={t}
              language={language}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);
}
