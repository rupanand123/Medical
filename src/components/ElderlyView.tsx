import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Medication, ChatMessage, OlderAdultProfile, MedicalFile } from "../types";
import { Check, CheckCircle, Heart, Info, Clock, AlertTriangle, Volume2, VolumeX, Link, UserCheck, FileText, ExternalLink, Unlink, Send, Play, Sparkles } from "lucide-react";
import { TranslationSchema, Language, speechLangCodes } from "../lib/translations";
import ChatWidget from "./ChatWidget";
import AlarmDashboardCard from "./AlarmDashboardCard";

interface ElderlyViewProps {
  medications: Medication[];
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, isVoice?: boolean, fileUrl?: string, fileName?: string) => Promise<void>;
  simulatedTime: string;
  onTakeMedication: (id: string) => void;
  onRequestRefill?: (id: string) => void;
  olderAdultProfile?: OlderAdultProfile;
  medicalFiles?: MedicalFile[];
  onConnectCaregiver?: (code: string) => Promise<void>;
  onDisconnectCaregiver?: () => Promise<void>;
  onOpenAlarmManager?: () => void;
  t: TranslationSchema;
  language: Language;
}

export default function ElderlyView({
  medications,
  chatMessages,
  onSendMessage,
  simulatedTime,
  onTakeMedication,
  onRequestRefill,
  olderAdultProfile,
  medicalFiles = [],
  onConnectCaregiver,
  onDisconnectCaregiver,
  onOpenAlarmManager,
  t,
  language
}: ElderlyViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"medications" | "medical_files" | "chat">("medications");
  const [speaking, setSpeaking] = useState(false);
  const [speakingMedId, setSpeakingMedId] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(0.8); // Senior friendly rate
  const [autoVoice, setAutoVoice] = useState<boolean>(true);
  const [inputCode, setInputCode] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [connectSuccess, setConnectSuccess] = useState("");
  const prevUrgentMedId = useRef<string | null>(null);

  const isConnected = !!olderAdultProfile?.connectedCaregiverId;

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Get greeting based on simulatedTime
  const getGreeting = () => {
    const [h] = simulatedTime.split(":").map(Number);
    if (h >= 5 && h < 12) return t.goodMorning;
    if (h >= 12 && h < 17) return t.goodAfternoon;
    return t.goodEvening;
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setConnecting(true);
    setConnectError("");
    setConnectSuccess("");

    try {
      if (onConnectCaregiver) {
        await onConnectCaregiver(inputCode.trim());
        setConnectSuccess("Successfully connected to Caregiver!");
        setInputCode("");
      }
    } catch (err: any) {
      setConnectError(err.message || "Failed to connect. Please check the code.");
    } finally {
      setConnecting(false);
    }
  };

  // Find the single most urgent medication to highlight
  const getMostUrgentMed = () => {
    const active = medications.filter(m => m.status !== "taken");
    if (active.length === 0) return null;

    return active.sort((a, b) => {
      const aUrgent = a.status === "missed" || a.status === "escalated" ? 0 : 1;
      const bUrgent = b.status === "missed" || b.status === "escalated" ? 0 : 1;
      if (aUrgent !== bUrgent) return aUrgent - bUrgent;
      return a.scheduleTime.localeCompare(b.scheduleTime);
    })[0];
  };

  const urgentMed = getMostUrgentMed();

  const cancelSpeech = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setSpeakingMedId(null);
  };

  const speakInstructions = (
    medName: string,
    dosage: string,
    instructions: string,
    medId: string = "urgent",
    scheduleTime?: string
  ) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser window.");
      return;
    }

    window.speechSynthesis.cancel();

    // If already speaking this specific medication, toggle off
    if (speaking && speakingMedId === medId) {
      setSpeaking(false);
      setSpeakingMedId(null);
      return;
    }

    const helloPart = t.speakHello.replace("{medName}", medName);
    const dosePart = t.speakDose.replace("{dosage}", dosage);
    const instPart = t.speakInstruction.replace("{instructions}", instructions);
    const timeIntro = scheduleTime ? `Scheduled for ${scheduleTime}.` : "";
    const pressButtonPart = t.speakPressButton;

    const utteranceText = `${timeIntro} ${helloPart} ${dosePart} ${instPart} ${pressButtonPart}`;
    const utterance = new SpeechSynthesisUtterance(utteranceText);

    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.lang = speechLangCodes[language] || "en-US";

    const voices = window.speechSynthesis.getVoices();
    const langCode = speechLangCodes[language] || "en-US";
    const preferredVoice = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase()) ||
                           voices.find(v => v.lang.toLowerCase().startsWith(langCode.split("-")[0].toLowerCase())) ||
                           voices.find(v => v.lang.toLowerCase().includes("en")) ||
                           voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setSpeaking(true);
      setSpeakingMedId(medId);
    };
    utterance.onend = () => {
      setSpeaking(false);
      setSpeakingMedId(null);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setSpeakingMedId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Auto voice readout when a new dose is due
  useEffect(() => {
    if (autoVoice && urgentMed && urgentMed.id !== prevUrgentMedId.current) {
      prevUrgentMedId.current = urgentMed.id;
      const timer = setTimeout(() => {
        speakInstructions(
          urgentMed.name,
          urgentMed.dosage,
          urgentMed.instructions,
          urgentMed.id,
          urgentMed.scheduleTime
        );
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [urgentMed?.id, autoVoice]);

  return (
    <motion.div
      id="elderly-view"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="bg-white min-h-full rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-6"
    >
      {/* Elderly App Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: "easeOut" }}
        className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-emerald-100/80 gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-2xl flex items-center justify-center shadow-2xs shrink-0">
            👴
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{getGreeting()}!</h2>
            <div className="flex items-center gap-2 text-slate-600 font-medium text-xs sm:text-sm mt-0.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{t.timeIsNow}</span>
              <span className="text-slate-900 font-mono font-bold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/70 text-xs">
                {simulatedTime}
              </span>
            </div>
          </div>
        </div>
        <div className="self-start sm:self-auto bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
          <Heart className="w-3.5 h-3.5 fill-current text-emerald-600 animate-pulse" />
          <span>{t.elderlyMode}</span>
        </div>
      </motion.div>

      {/* Caregiver Connection System Integration Banner */}
      <motion.div
        id="caregiver-connection-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.08, ease: "easeOut" }}
        className="bg-[#F8FAF9] p-5 sm:p-6 rounded-3xl border border-emerald-100 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
              <Link className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Caregiver Access Code Pairing
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Connect your account to your designated caregiver using their unique server access code.
              </p>
            </div>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                {t.connectionActive} {olderAdultProfile?.connectedCaregiverName ? `(${olderAdultProfile.connectedCaregiverName})` : ""}
              </span>
              {onDisconnectCaregiver && (
                <button
                  onClick={() => onDisconnectCaregiver()}
                  className="px-3 py-1.5 text-slate-500 hover:text-rose-700 rounded-full bg-white hover:bg-rose-50 border border-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  title={t.disconnect}
                >
                  <Unlink className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t.disconnect}</span>
                </button>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 text-xs font-bold px-3.5 py-1 rounded-full border border-amber-200 shadow-2xs">
              Not Connected
            </span>
          )}
        </div>

        {!isConnected && (
          <form onSubmit={handleConnectSubmit} className="space-y-2.5 pt-3 border-t border-emerald-100">
            <label htmlFor="access-code-input" className="block text-[11px] font-black uppercase text-slate-600 tracking-wider">
              Enter Caregiver Access Code:
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                id="access-code-input"
                type="text"
                required
                placeholder="CARE-XXXXX"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-full sm:flex-1 bg-white border border-slate-300 rounded-full px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none uppercase tracking-widest placeholder:text-slate-400 placeholder:font-normal shadow-2xs"
              />
              <button
                type="submit"
                disabled={connecting || !inputCode.trim()}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-emerald-600/25"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{connecting ? "Validating..." : t.verifyAndConnect}</span>
              </button>
            </div>
          </form>
        )}

        {connectError && (
          <div className="text-xs text-rose-900 font-medium bg-rose-50 p-3.5 rounded-2xl border border-rose-200 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-rose-950">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{connectError}</span>
            </div>
            {(connectError.toLowerCase().includes("already paired") ||
              connectError.toLowerCase().includes("already connected") ||
              connectError.toLowerCase().includes("already exists") ||
              connectError.toLowerCase().includes("unlink") ||
              isConnected) && onDisconnectCaregiver && (
              <div className="pt-2 border-t border-rose-200 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-slate-600 font-medium text-[11px]">
                  Need to switch caregivers or re-pair this account?
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    setConnecting(true);
                    setConnectError("");
                    try {
                      await onDisconnectCaregiver();
                      setConnectSuccess("Previous connection unlinked successfully. You can now enter a new access code.");
                    } catch (err: any) {
                      setConnectError(err.message || "Failed to unlink connection.");
                    } finally {
                      setConnecting(false);
                    }
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs text-xs"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Unlink Account
                </button>
              </div>
            )}
          </div>
        )}
        {connectSuccess && (
          <p className="text-xs text-emerald-950 font-bold bg-emerald-50 p-3 rounded-2xl border border-emerald-200 flex items-center gap-2 shadow-2xs">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            {connectSuccess}
          </p>
        )}
      </motion.div>

      {/* Senior Precision Alarm & Exact Notification Dashboard Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.12, ease: "easeOut" }}
      >
        <AlarmDashboardCard
          role="elderly"
          medications={medications}
          onOpenManager={onOpenAlarmManager || (() => {})}
          t={t}
        />
      </motion.div>

      {/* Elderly Sub-navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
        className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-full border border-slate-200/70 shadow-inner"
      >
        <button
          onClick={() => setActiveSubTab("medications")}
          className={`flex-1 py-2 px-3 sm:px-4 rounded-full text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === "medications"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>💊</span>
          <span>{t.medicationsTab}</span>
        </button>
        <button
          onClick={() => setActiveSubTab("medical_files")}
          className={`flex-1 py-2 px-3 sm:px-4 rounded-full text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === "medical_files"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>📄</span>
          <span>{t.prescriptions}</span>
          {medicalFiles.length > 0 && (
            <span className="px-2 py-0.5 bg-emerald-800 text-white rounded-full text-[10px] font-black">
              {medicalFiles.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("chat")}
          className={`flex-1 py-2 px-3 sm:px-4 rounded-full text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
            activeSubTab === "chat"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>💬</span>
          <span>{t.elderlyChatTitle}</span>
          {chatMessages.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black">
              {chatMessages.length}
            </span>
          )}
        </button>
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
              currentRole="elderly"
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
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100 space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{t.medicalReportsAndFiles}</h3>
                <p className="text-xs text-slate-500 font-medium">Prescriptions and reports shared by your caregiver.</p>
              </div>
            </div>

            <div className="space-y-3">
              {medicalFiles.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
                  No medical files or prescriptions shared yet.
                </div>
              ) : (
                medicalFiles.map((file, idx) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                    className="p-4 rounded-2xl border border-emerald-100 bg-[#F8FAF9] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-bold text-lg">
                        📄
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{file.fileName}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">{file.notes}</p>
                        <span className="text-[10px] text-slate-400 font-mono">Shared on {file.uploadedAt}</span>
                      </div>
                    </div>

                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </a>
                  </motion.div>
                ))
              )}
            </div>
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
            {/* Text-To-Speech Senior Voice Assistant Control Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.04, ease: "easeOut" }}
              className="bg-[#F8FAF9] rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-2xs flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full text-white font-bold flex items-center justify-center transition-colors shadow-2xs ${speaking ? "bg-emerald-600 animate-pulse" : "bg-emerald-600"}`}>
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    Voice Assistant (Audio Reader)
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Active</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Reads medication names & instructions out loud for senior accessibility.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Auto Voice Readout Toggle */}
                <button
                  onClick={() => setAutoVoice(!autoVoice)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                    autoVoice
                      ? "bg-emerald-50 text-emerald-900 border-emerald-200 font-extrabold"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                  title="Automatically read medication out loud when a new dose is due"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${autoVoice ? "text-emerald-600" : "text-slate-400"}`} />
                  <span>Auto-announce: <strong className="text-emerald-700">{autoVoice ? "ON" : "OFF"}</strong></span>
                </button>

                {/* Speech Speed Controls */}
                <div className="flex items-center bg-white p-1 rounded-full border border-slate-200 text-xs font-semibold shadow-2xs">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 px-2">Speed:</span>
                  <button
                    onClick={() => setSpeechRate(0.65)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                      speechRate === 0.65 ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    0.65x
                  </button>
                  <button
                    onClick={() => setSpeechRate(0.8)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                      speechRate === 0.8 ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    0.8x (Slow)
                  </button>
                  <button
                    onClick={() => setSpeechRate(1.0)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                      speechRate === 1.0 ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    1.0x
                  </button>
                </div>

                {/* Stop Voice Button if actively speaking */}
                {speaking && (
                  <button
                    onClick={cancelSpeech}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs animate-bounce"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Stop Voice</span>
                  </button>
                )}
              </div>
            </motion.div>

            {/* Main Focus Area: The Next Dose */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
              className="flex-1 flex flex-col justify-center my-2"
            >
              {urgentMed ? (
                <div id={`elderly-focus-${urgentMed.id}`} className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.04)] border-2 border-emerald-500/80 flex flex-col items-center text-center relative overflow-hidden">
                  {/* Active Audio Wave Bar indicator */}
                  {speaking && speakingMedId === urgentMed.id && (
                    <div className="w-full bg-emerald-600 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 animate-pulse mb-4 rounded-full shadow-2xs">
                      <Volume2 className="w-4 h-4 animate-bounce" />
                      <span>🔊 Reading out loud: {urgentMed.name} ({urgentMed.dosage})</span>
                    </div>
                  )}

                  {/* Urgency Badge */}
                  {(urgentMed.status === "missed" || urgentMed.status === "escalated") ? (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 animate-bounce flex items-center gap-1.5 shadow-2xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      {t.overdue}
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 shadow-2xs">
                      {t.nextScheduled}
                    </div>
                  )}

                  <h3 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2">
                    {urgentMed.name}
                  </h3>

                  <p className="text-xl sm:text-2xl font-bold text-slate-600 mb-3">
                    {t.dosage}: <strong className="text-emerald-700">{urgentMed.dosage}</strong>
                  </p>

                  {/* Big Audio Read Aloud Button */}
                  <button
                    onClick={() => speakInstructions(urgentMed.name, urgentMed.dosage, urgentMed.instructions, urgentMed.id, urgentMed.scheduleTime)}
                    className={`w-full max-w-lg mb-5 py-3 px-6 rounded-full text-xs sm:text-sm font-black transition flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs select-none border ${
                      speaking && speakingMedId === urgentMed.id
                        ? "bg-rose-50 border-rose-300 text-rose-800 animate-pulse"
                        : "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950"
                    }`}
                  >
                    <Volume2 className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
                    <span>
                      {speaking && speakingMedId === urgentMed.id
                        ? "⏹️ Stop Reading Out Loud"
                        : "🔊 Read Medication Name & Instructions Out Loud"}
                    </span>
                  </button>

                  <div className="bg-[#F8FAF9] border border-emerald-100 rounded-3xl px-6 py-4 mb-6 max-w-lg w-full text-left shadow-2xs">
                    <div className="flex items-center justify-between border-b border-emerald-100/70 pb-2.5 mb-2.5">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">{t.instructionsForArthur}</span>
                      <button
                        onClick={() => speakInstructions(urgentMed.name, urgentMed.dosage, urgentMed.instructions, urgentMed.id, urgentMed.scheduleTime)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition cursor-pointer select-none border shadow-2xs ${
                          speaking && speakingMedId === urgentMed.id
                            ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
                            : "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{speaking && speakingMedId === urgentMed.id ? t.stopVoice : t.readAloud}</span>
                      </button>
                    </div>

                    <p className="text-base text-slate-800 font-extrabold mt-1">
                      👉 {urgentMed.instructions}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-3 text-xs text-slate-500 border-t border-emerald-100/70 pt-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t.treatingCondition}: <strong className="text-slate-800 font-bold">{urgentMed.disease}</strong></span>
                      </div>

                      {typeof urgentMed.pillsRemaining === "number" && (
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                            urgentMed.pillsRemaining < 5
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-white text-slate-700 border border-slate-200"
                          }`}>
                            💊 {urgentMed.pillsRemaining} pills left
                          </span>

                          {urgentMed.refillRequested ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              ⏳ Refill Requested
                            </span>
                          ) : urgentMed.pillsRemaining < 5 && onRequestRefill ? (
                            <button
                              type="button"
                              onClick={() => onRequestRefill(urgentMed.id)}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-0.5 rounded-full text-[11px] font-extrabold cursor-pointer transition shadow-2xs"
                            >
                              Request Refill
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Giant One-Tap Button */}
                  <button
                    onClick={() => {
                      cancelSpeech();
                      onTakeMedication(urgentMed.id);
                    }}
                    id={`btn-elderly-take-${urgentMed.id}`}
                    className="w-full max-w-md py-5 px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all text-white font-black text-xl sm:text-2xl shadow-lg hover:shadow-emerald-600/25 flex items-center justify-center gap-3 cursor-pointer select-none"
                    style={{ minHeight: "72px" }}
                  >
                    <Check className="w-7 h-7 stroke-[3.5px]" />
                    <span>{t.yesITookIt}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-10 shadow-sm border border-emerald-100 flex flex-col items-center text-center justify-center min-h-[280px]">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mb-3" />
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t.allMedsTakenTitle}</h3>
                  <p className="text-sm text-slate-500 font-medium max-w-md mt-1">
                    {t.allMedsTakenDesc}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Simplified Elderly Medication Schedule List */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.12, ease: "easeOut" }}
              className="bg-[#F8FAF9] rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-2xs"
            >
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3.5">{t.remainingSchedule}</h4>
              <div className="space-y-2">
                {medications.map((med, idx) => (
                  <motion.div
                    key={med.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    id={`elderly-schedule-${med.id}`}
                    className={`flex flex-wrap items-center justify-between p-3.5 rounded-2xl border text-sm gap-2 transition shadow-2xs ${
                      med.status === "taken"
                        ? "bg-white border-emerald-100 text-slate-400 line-through opacity-80"
                        : med.status === "missed" || med.status === "escalated"
                        ? "bg-rose-50 border-rose-200 text-rose-900"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full font-mono font-bold text-xs ${
                        med.status === "taken"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-emerald-100 text-emerald-900"
                      }`}>
                        {med.scheduleTime}
                      </span>
                      <span className="font-extrabold text-sm sm:text-base">{med.name}</span>
                      <span className="text-xs text-slate-500 font-medium">({med.dosage})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">{med.disease}</span>

                      {/* Individual Read Aloud TTS button for each schedule item */}
                      <button
                        onClick={() => speakInstructions(med.name, med.dosage, med.instructions, med.id, med.scheduleTime)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 border shadow-2xs ${
                          speaking && speakingMedId === med.id
                            ? "bg-rose-50 text-rose-800 border-rose-300 animate-pulse"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200"
                        }`}
                        title={`Listen to ${med.name} instructions`}
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{speaking && speakingMedId === med.id ? "Stop" : "Read"}</span>
                      </button>

                      {med.status === "taken" && <span className="text-emerald-700 font-extrabold text-xs">{t.done}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Senior Direct Chat Section */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.16, ease: "easeOut" }}
            >
              <ChatWidget
                chatMessages={chatMessages}
                currentRole="elderly"
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
