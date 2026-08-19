import React, { useState, useEffect, useRef } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Link,
  Unlink,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ChevronDown,
  X,
  Shield,
  UserCheck,
  Users,
  Server,
  Zap,
  Radio
} from "lucide-react";
import { OlderAdultProfile } from "../types";
import { User } from "firebase/auth";

interface ConnectionStatusIndicatorProps {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  activeProfile?: OlderAdultProfile;
  caregiverCode: string;
  activeTab: "elderly" | "caregiver" | "chat";
  user: User | null;
  demoUser: { displayName: string; email: string } | null;
  onManualSync: () => Promise<void> | void;
  onConnectCaregiver?: (code: string) => Promise<void>;
  onDisconnectCaregiver?: () => Promise<void>;
}

export default function ConnectionStatusIndicator({
  isSyncing,
  lastSyncedAt,
  syncError,
  activeProfile,
  caregiverCode,
  activeTab,
  user,
  demoUser,
  onManualSync,
  onConnectCaregiver,
  onDisconnectCaregiver
}: ConnectionStatusIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectMsg, setConnectMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [timeAgoStr, setTimeAgoStr] = useState("Just now");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Check if partner is linked
  const isPartnerLinked = !!activeProfile?.connectedCaregiverId || !!activeProfile?.connectedCode;
  const partnerName = activeProfile?.name || "Arthur Pendelton";

  // Update time-ago string dynamically
  useEffect(() => {
    const updateSecs = () => {
      if (!lastSyncedAt) {
        setTimeAgoStr("Syncing...");
        return;
      }
      const elapsedSec = Math.floor((new Date().getTime() - lastSyncedAt.getTime()) / 1000);
      if (elapsedSec < 3) {
        setTimeAgoStr("Just now");
      } else if (elapsedSec < 60) {
        setTimeAgoStr(`${elapsedSec}s ago`);
      } else {
        const mins = Math.floor(elapsedSec / 60);
        setTimeAgoStr(`${mins}m ago`);
      }
    };

    updateSecs();
    const interval = setInterval(updateSecs, 1000);
    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(caregiverCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || !onConnectCaregiver) return;
    setIsConnecting(true);
    setConnectMsg(null);
    try {
      await onConnectCaregiver(inputCode.trim());
      setConnectMsg({ type: "success", text: "Successfully linked to partner account!" });
      setInputCode("");
    } catch (err: any) {
      setConnectMsg({ type: "error", text: err.message || "Failed to link code. Please verify code." });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!onDisconnectCaregiver) return;
    setIsConnecting(true);
    setConnectMsg(null);
    try {
      await onDisconnectCaregiver();
      setConnectMsg({ type: "success", text: "Disconnected partner link." });
    } catch (err: any) {
      setConnectMsg({ type: "error", text: err.message || "Failed to disconnect." });
    } finally {
      setIsConnecting(false);
    }
  };

  // Status Badge visual styling
  const getStatusTheme = () => {
    if (syncError) {
      return {
        bg: "bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-rose-900",
        dotBg: "bg-rose-500 shadow-rose-400/50",
        pulse: false
      };
    }
    if (isSyncing) {
      return {
        bg: "bg-emerald-50 hover:bg-emerald-100/70 border-emerald-300 text-emerald-900",
        dotBg: "bg-emerald-500 shadow-emerald-400/50",
        pulse: true
      };
    }
    if (isPartnerLinked) {
      return {
        bg: "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200/90 text-emerald-950",
        dotBg: "bg-emerald-600 shadow-emerald-400/50",
        pulse: true
      };
    }
    return {
      bg: "bg-white hover:bg-emerald-50/50 border-emerald-200/70 text-slate-800",
      dotBg: "bg-emerald-500 shadow-emerald-400/50",
      pulse: true
    };
  };

  const theme = getStatusTheme();

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Visual Header Indicator Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition shadow-2xs cursor-pointer ${theme.bg}`}
        title="Click to view real-time sync & partner connection status"
      >
        {/* Live Pulse Dot */}
        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
          {theme.pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.dotBg}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.dotBg}`} />
        </span>

        {/* Sync & Partner Status Summary */}
        <div className="flex items-center gap-1.5">
          {isPartnerLinked ? (
            <span className="flex items-center gap-1 font-bold text-emerald-900">
              <Link className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Linked:</span>
              <span className="max-w-[105px] sm:max-w-[130px] truncate">
                {activeTab === "caregiver" ? partnerName : "Caregiver Jane"}
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Unlink className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">Partner:</span>
              <span className="text-amber-800 font-bold">Not Linked</span>
            </span>
          )}

          {/* Sync Pill divider */}
          <span className="text-emerald-200 mx-0.5">|</span>

          {/* Firebase state label */}
          <span className="flex items-center gap-1 text-[11px] text-emerald-900 font-medium">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span className="hidden md:inline">Sync</span>
            <span className="text-[10px] text-emerald-700 font-bold">({timeAgoStr})</span>
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-emerald-100 z-50 p-5 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-emerald-100/70 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <Radio className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Real-Time Sync Monitor
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Firestore & Partner Link State</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onManualSync()}
                disabled={isSyncing}
                className="p-1.5 rounded-full hover:bg-emerald-50 text-slate-500 hover:text-emerald-800 transition cursor-pointer"
                title="Force Manual Sync"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section 1: Firebase Database Live Status */}
          <div className="bg-emerald-50/40 rounded-2xl p-3.5 border border-emerald-100/80 mb-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-600" />
                Cloud Database Engine:
              </span>
              {syncError ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Sync Error
                </span>
              ) : isSyncing ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Syncing...
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1.5 border-t border-emerald-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Cloud Sync Engine</span>
                <span className="font-semibold text-slate-800">Firestore (Live)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Sync</span>
                <span className="font-semibold text-emerald-800">{timeAgoStr}</span>
              </div>
            </div>

            {syncError && (
              <p className="text-[11px] text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
                {syncError}
              </p>
            )}
          </div>

          {/* Section 2: Partner Link Status */}
          <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200/70 mb-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Partner Link Status:
              </span>

              {isPartnerLinked ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-600" /> Active Link
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                  <Unlink className="w-3 h-3" /> Awaiting Partner
                </span>
              )}
            </div>

            {isPartnerLinked ? (
              <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Linked Partner:</span>
                  <span className="font-extrabold text-emerald-950 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {activeTab === "caregiver" ? partnerName : "Caregiver Jane"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Connection Code:</span>
                  <span className="font-mono font-bold bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 text-emerald-800 shadow-2xs">
                    {caregiverCode}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 font-medium pt-0.5">
                  ✓ Medication schedules, messages, and safety logs are synced across devices.
                </p>
                {onDisconnectCaregiver && (
                  <button
                    onClick={handleDisconnect}
                    disabled={isConnecting}
                    className="w-full mt-1.5 py-1.5 text-[11px] font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-full transition cursor-pointer shadow-2xs"
                  >
                    Disconnect Partner Link
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 space-y-2.5">
                <p className="text-[11px] text-amber-950 font-medium leading-snug">
                  You are currently unlinked. Connect with your partner using the Caregiver Code below.
                </p>

                {/* Connection Code Display */}
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-2xl border border-amber-200 text-xs shadow-2xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Your Code</span>
                    <span className="font-mono font-black text-slate-900 text-sm tracking-wider">{caregiverCode}</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-[11px] transition cursor-pointer shadow-2xs"
                  >
                    {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                {/* Quick Link Input Form */}
                {onConnectCaregiver && (
                  <form onSubmit={handleConnectSubmit} className="pt-1 flex gap-1.5">
                    <input
                      type="text"
                      placeholder="CARE-XXXXX"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 uppercase font-mono shadow-2xs"
                    />
                    <button
                      type="submit"
                      disabled={isConnecting || !inputCode.trim()}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isConnecting ? "Linking..." : "Link"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {connectMsg && (
              <p
                className={`text-[11px] p-2.5 rounded-xl border font-medium ${
                  connectMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-rose-50 text-rose-900 border-rose-200"
                }`}
              >
                {connectMsg.text}
              </p>
            )}
          </div>

          {/* Section 3: Active Health Pathways */}
          <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-100 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <Zap className="w-3 h-3 text-emerald-600" />
              Safety Pathways: <strong className="text-emerald-800 font-bold">Active</strong>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Auth: {user?.email || demoUser?.displayName || "Demo Mode"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
