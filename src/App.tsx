/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Medication, NotificationLog, StateResponse, ChatMessage, OlderAdultProfile, MedicalFile, MedicineConfirmation } from "./types";
import ElderlyView from "./components/ElderlyView";
import CaregiverView from "./components/CaregiverView";
import EscalationTimeline from "./components/EscalationTimeline";
import DiseaseIntelligence from "./components/DiseaseIntelligence";
import { Heart, Activity, AlertCircle, Globe, User as UserIcon, LogOut, Bell } from "lucide-react";
import { Language, translations } from "./lib/translations";
import AuthModal from "./components/AuthModal";
import ConnectionStatusIndicator from "./components/ConnectionStatusIndicator";
import ActiveAlarmModal from "./components/ActiveAlarmModal";
import AlarmManagerModal from "./components/AlarmManagerModal";
import { alarmScheduler } from "./lib/alarmScheduler";
import { auth, signInWithGoogle, logoutFirebase } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function App() {
  const [activeTab, setActiveTab] = useState<"elderly" | "caregiver">("caregiver");
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("meds_app_lang") as Language;
    return saved && ["en", "es", "hi", "zh", "te"].includes(saved) ? saved : "en";
  });
  const [simulatedTime, setSimulatedTime] = useState("07:30");
  const [caregiverCode, setCaregiverCode] = useState("CG-A8K3X9");
  const [olderAdults, setOlderAdults] = useState<OlderAdultProfile[]>([]);
  const [activeOlderAdultId, setActiveOlderAdultId] = useState("oa-1");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [medicalFiles, setMedicalFiles] = useState<MedicalFile[]>([]);
  const [confirmations, setConfirmations] = useState<MedicineConfirmation[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [demoUser, setDemoUser] = useState<{ displayName: string; email: string } | null>(null);
  const [authErrorNotice, setAuthErrorNotice] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAlarmManagerOpen, setIsAlarmManagerOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setDemoUser(null);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthErrorNotice(null);
    try {
      await signInWithGoogle();
      setDemoUser(null);
    } catch (err: any) {
      console.warn("Google Sign-In notice:", err);
      if (err?.code === "auth/unauthorized-domain" || String(err).includes("unauthorized-domain")) {
        setAuthErrorNotice(
          `Domain "${window.location.hostname}" is not authorized in Firebase Console yet. We've enabled Demo Account mode for you. To enable Google Sign-In, add "${window.location.hostname}" in Firebase Console -> Authentication -> Settings -> Authorized Domains.`
        );
        handleDemoSignIn();
      } else {
        setAuthErrorNotice(err?.message || "Sign-in failed. Please try again.");
      }
    }
  };

  const handleDemoSignIn = () => {
    setAuthErrorNotice(null);
    setDemoUser({
      displayName: "Jane (Caregiver)",
      email: "jane.caregiver@example.com"
    });
  };

  const handleSignOut = async () => {
    setDemoUser(null);
    setAuthErrorNotice(null);
    setOlderAdults([]);
    setMedications([]);
    setChatMessages([]);
    setLogs([]);
    setMedicalFiles([]);
    setConfirmations([]);
    setActiveOlderAdultId("");
    localStorage.removeItem("caregiver_elderly_device_id");
    try {
      await logoutFirebase();
    } catch (err) {
      console.error(err);
    }
  };

  const [deviceId] = useState<string>(() => {
    let id = localStorage.getItem("caregiver_elderly_device_id");
    if (!id) {
      id = "dev-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now().toString(36);
      localStorage.setItem("caregiver_elderly_device_id", id);
    }
    return id;
  });

  const currentUserId = user
    ? user.uid
    : demoUser
    ? `demo-${demoUser.email}`
    : deviceId;

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": currentUserId,
    "x-role": activeTab
  });

  useEffect(() => {
    localStorage.setItem("meds_app_lang", language);
  }, [language]);

  const t = translations[language];

  // Fetch initial app state from server
  const fetchState = async () => {
    setIsSyncing(true);
    try {
      const url = `/api/state?userId=${encodeURIComponent(currentUserId)}&role=${encodeURIComponent(activeTab)}&olderAdultId=${encodeURIComponent(activeOlderAdultId || "")}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load virtual database state.");
      const data: StateResponse = await res.json();
      setSimulatedTime(data.simulatedTime);
      if (data.caregiverCode) setCaregiverCode(data.caregiverCode);
      if (data.olderAdults) setOlderAdults(data.olderAdults);
      if (data.activeOlderAdultId) setActiveOlderAdultId(data.activeOlderAdultId);
      setMedications(data.medications);
      setLogs(data.logs);
      if (data.chatMessages) setChatMessages(data.chatMessages);
      if (data.medicalFiles) setMedicalFiles(data.medicalFiles);
      if (data.confirmations) setConfirmations(data.confirmations);
      setLastSyncedAt(new Date());
      setSyncError(null);
    } catch (err: any) {
      setSyncError(err.message || "Error syncing with full-stack server.");
      setErrorMessage(err.message || "Error syncing with full-stack server.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchState();
    
    // Set up a state-polling ticker every 3 seconds to keep views synced in real-time
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [activeOlderAdultId, activeTab, currentUserId]);

  // Handler: Reset Caregiver Connection Code
  const handleResetCaregiverCode = async () => {
    setErrorMessage("");
    try {
      const res = await fetch("/api/connections/reset-code", {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to reset connection code.");
      const data = await res.json();
      if (data.success && data.caregiverCode) {
        setCaregiverCode(data.caregiverCode);
        fetchState();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Handler: Connect Older Adult using Connection Code
  const handleConnectCaregiver = async (code: string) => {
    setErrorMessage("");
    const targetUserId = currentUserId;
    const targetName = user?.displayName || user?.email?.split("@")[0] || "Arthur Pendelton";

    // Client-side pre-check: Verify if connection already exists for this requesting elderly user
    const currentProfile = olderAdults.find(o => o.id === (activeOlderAdultId || targetUserId));
    if (currentProfile?.connectedCaregiverId) {
      const caregiverName = currentProfile.connectedCaregiverName || "a caregiver";
      throw new Error(`This elderly account is already paired with ${caregiverName}. Please unlink or re-pair if you wish to connect with a new caregiver.`);
    }

    const res = await fetch("/api/connections/connect", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        code,
        olderAdultId: targetUserId,
        name: targetName
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to establish caregiver connection.");
    }
    setActiveOlderAdultId(targetUserId);
    fetchState();
  };

  // Handler: Disconnect Older Adult
  const handleDisconnectCaregiver = async () => {
    setErrorMessage("");
    try {
      const targetId = activeOlderAdultId || currentUserId;
      const res = await fetch("/api/connections/disconnect", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ olderAdultId: targetId })
      });
      if (!res.ok) throw new Error("Failed to disconnect caregiver.");
      await fetchState();
    } catch (err: any) {
      setErrorMessage(err.message);
      throw err;
    }
  };

  // Handler: Switch patient (Caregiver dashboard)
  const handleSwitchPatient = async (id: string) => {
    setActiveOlderAdultId(id);
    try {
      const res = await fetch("/api/caregiver/switch-patient", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ olderAdultId: id })
      });
      if (res.ok) {
        const data = await res.json();
        setMedications(data.medications);
        setLogs(data.logs);
        setChatMessages(data.chatMessages);
        setMedicalFiles(data.medicalFiles);
        setConfirmations(data.confirmations);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Handler: Upload medical file
  const handleUploadMedicalFile = async (file: { fileName: string; fileType: string; fileUrl: string; notes?: string }) => {
    setErrorMessage("");
    try {
      const sender = activeTab === "caregiver" ? "caregiver" : "elderly";
      const res = await fetch("/api/medical-files", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...file,
          olderAdultId: activeOlderAdultId,
          sender
        })
      });
      if (!res.ok) throw new Error("Failed to upload medical file.");
      const data = await res.json();
      if (data.success) {
        setMedicalFiles(data.medicalFiles);
        if (data.logs) setLogs(data.logs);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Handler: Send chat message
  const handleSendMessage = async (text: string, isVoice?: boolean, fileUrl?: string, fileName?: string) => {
    setErrorMessage("");
    try {
      const sender = activeTab === "caregiver" ? "caregiver" : "elderly";
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ sender, text, isVoice, fileUrl, fileName, olderAdultId: activeOlderAdultId })
      });
      if (!res.ok) throw new Error("Failed to send message.");
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.chatMessages);
        if (data.logs) setLogs(data.logs);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Handler: Senior marking medication as "Taken"
  const handleTakeMedication = async (id: string) => {
    setErrorMessage("");
    try {
      const res = await fetch(`/api/medications/${id}/take`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to register dose completion.");
      const data = await res.json();
      if (data.success) {
        if (data.confirmations) setConfirmations(data.confirmations);
        fetchState();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Handler: Caregiver adding custom medication
  const handleAddMedication = async (medPayload: Partial<Medication>) => {
    setErrorMessage("");
    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...medPayload,
          olderAdultId: activeOlderAdultId
        })
      });
      if (!res.ok) throw new Error("Could not register new medication.");
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Handler: Caregiver deleting medication
  const handleDeleteMedication = async (id: string) => {
    setErrorMessage("");
    try {
      const res = await fetch(`/api/medications/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to delete medication from database.");
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Handler: Force next escalation phase (Immediate test)
  const handleForceEscalate = async (id: string) => {
    setErrorMessage("");
    try {
      const res = await fetch(`/api/medications/${id}/force-escalate`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to force medication safety escalation.");
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Handler: Request medication refill
  const handleRequestRefill = async (id: string) => {
    setErrorMessage("");
    try {
      const res = await fetch(`/api/medications/${id}/request-refill`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to request medication refill.");
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Handler: Restock medication pills
  const handleRestockMedication = async (id: string, count = 30) => {
    setErrorMessage("");
    try {
      const res = await fetch(`/api/medications/${id}/restock`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ count })
      });
      if (!res.ok) throw new Error("Failed to restock medication.");
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const activeProfile = olderAdults.find(o => o.id === activeOlderAdultId) || olderAdults[0];

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-slate-900 flex flex-col antialiased">
      {/* Upper Navigation Hub */}
      <header className="bg-white/95 backdrop-blur-md border-b border-emerald-100/80 sticky top-0 z-40 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
          <div className="flex flex-wrap items-center justify-between md:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 ring-4 ring-emerald-50">
                <Heart className="w-5 h-5 fill-current text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{t.appName}</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/80 uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {t.diseaseIntelligence}
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 font-medium hidden lg:block">
                  Caregiver–Older Adult Adherence Portal • RxNorm & WHO Safety Intelligence
                </p>
              </div>
            </div>

            {/* Visual Real-Time Connection & Partner Status Indicator */}
            <ConnectionStatusIndicator
              isSyncing={isSyncing}
              lastSyncedAt={lastSyncedAt}
              syncError={syncError}
              activeProfile={activeProfile}
              caregiverCode={caregiverCode}
              activeTab={activeTab}
              user={user}
              demoUser={demoUser}
              onManualSync={fetchState}
              onConnectCaregiver={handleConnectCaregiver}
              onDisconnectCaregiver={handleDisconnectCaregiver}
            />
          </div>

          {/* Mode Switch & Language Selectors & Auth */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Firebase / Demo Auth Button */}
            {user || demoUser ? (
              <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-950 shadow-2xs">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="w-5 h-5 rounded-full ring-2 ring-emerald-300" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    <UserIcon className="w-3 h-3" />
                  </div>
                )}
                <span className="max-w-[120px] sm:max-w-[140px] truncate">{user?.displayName || user?.email || demoUser?.displayName}</span>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-1 hover:bg-emerald-200/60 rounded-full text-emerald-800 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition shadow-sm hover:shadow-emerald-600/25 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In / Demo</span>
              </button>
            )}

            {/* Exact Alarms Quick Launch Button */}
            <button
              onClick={() => setIsAlarmManagerOpen(true)}
              id="btn-nav-alarms"
              className="flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-extrabold transition shadow-2xs cursor-pointer"
              title="Configure Exact Date & Time Alarms"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Exact Alarms</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 text-xs shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                title="Select Language"
              >
                <option value="en">English (EN)</option>
                <option value="es">Español (ES)</option>
                <option value="hi">हिन्दी (HI)</option>
                <option value="zh">中文 (ZH)</option>
                <option value="te">తెలుగు (TE)</option>
              </select>
            </div>

            {/* Segmented Mode Navigation Bar */}
            <div className="flex bg-slate-100/90 p-1 rounded-full border border-slate-200/70 shadow-inner">
              <button
                onClick={() => setActiveTab("caregiver")}
                id="tab-caregiver"
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "caregiver"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{t.caregiverMode}</span>
              </button>
              <button
                onClick={() => setActiveTab("elderly")}
                id="tab-elderly"
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "elderly"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>{t.elderlyMode}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {authErrorNotice && (
        <div className="max-w-7xl mx-auto w-full px-4 mt-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-emerald-700 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950 mb-0.5">Firebase Authentication Domain Configuration</p>
                <p className="text-emerald-800 leading-relaxed">{authErrorNotice}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                onClick={handleDemoSignIn}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded-full transition cursor-pointer shadow-xs"
              >
                Use Demo Account
              </button>
              <button
                onClick={() => setAuthErrorNotice(null)}
                className="text-emerald-800 hover:text-emerald-950 px-2 py-1 font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-7xl mx-auto w-full px-4 mt-4 sm:px-6 lg:px-8">
          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-center gap-2 text-xs text-rose-900 font-medium shadow-2xs">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {activeTab === "caregiver" ? (
          <div className="space-y-6">
            <CaregiverView
              medications={medications}
              chatMessages={chatMessages}
              onSendMessage={handleSendMessage}
              simulatedTime={simulatedTime}
              onAddMedication={handleAddMedication}
              onDeleteMedication={handleDeleteMedication}
              onForceEscalate={handleForceEscalate}
              onRequestRefill={handleRequestRefill}
              onRestockMedication={handleRestockMedication}
              caregiverCode={caregiverCode}
              olderAdults={olderAdults}
              activeOlderAdultId={activeOlderAdultId}
              medicalFiles={medicalFiles}
              confirmations={confirmations}
              onResetCode={handleResetCaregiverCode}
              onSwitchPatient={handleSwitchPatient}
              onUploadMedicalFile={handleUploadMedicalFile}
              onOpenAlarmManager={() => setIsAlarmManagerOpen(true)}
              t={t}
              language={language}
            />

            <EscalationTimeline medications={medications} />

            <DiseaseIntelligence
              medications={medications}
              onAddMedication={handleAddMedication}
              t={t}
            />
          </div>
        ) : (
          <ElderlyView
            medications={medications}
            chatMessages={chatMessages}
            onSendMessage={handleSendMessage}
            simulatedTime={simulatedTime}
            onTakeMedication={handleTakeMedication}
            onRequestRefill={handleRequestRefill}
            olderAdultProfile={activeProfile}
            medicalFiles={medicalFiles}
            onConnectCaregiver={handleConnectCaregiver}
            onDisconnectCaregiver={handleDisconnectCaregiver}
            onOpenAlarmManager={() => setIsAlarmManagerOpen(true)}
            t={t}
            language={language}
          />
        )}
      </main>

      {/* Active Alarm Modal (triggers at the exact second) */}
      <ActiveAlarmModal
        onTakeMedication={handleTakeMedication}
        t={t}
      />

      {/* Exact Alarm & Reminder Settings Manager Modal */}
      <AlarmManagerModal
        isOpen={isAlarmManagerOpen}
        onClose={() => setIsAlarmManagerOpen(false)}
        medications={medications}
        olderAdultId={activeOlderAdultId}
        t={t}
      />

      {/* Elegant Green & White Footer */}
      <footer className="bg-white border-t border-emerald-100 py-6 text-center text-xs text-slate-500 mt-12 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-bold text-slate-700">CareConnect Health Portal</span>
            <span className="text-slate-300">•</span>
            <span>RxNorm & WHO Verified Pharmacopeia</span>
          </div>
          <p className="text-slate-400">{t.footerText}</p>
        </div>
      </footer>

      {/* Auth Modal for Login & Registration */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onDemoSignIn={handleDemoSignIn}
      />
    </div>
  );
}
