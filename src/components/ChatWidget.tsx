import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "../types";
import { Send, MessageSquare, Volume2, VolumeX, User, Heart, Sparkles, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { TranslationSchema, Language, speechLangCodes } from "../lib/translations";

interface ChatWidgetProps {
  chatMessages: ChatMessage[];
  currentRole: "caregiver" | "elderly";
  onSendMessage: (text: string, isVoice?: boolean) => Promise<void>;
  simulatedTime: string;
  t: TranslationSchema;
  language: Language;
}

export default function ChatWidget({
  chatMessages,
  currentRole,
  onSendMessage,
  simulatedTime,
  t,
  language
}: ChatWidgetProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll internal messages container to bottom when messages update, without affecting main page scroll
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = async (customText?: string) => {
    const msgToSend = customText || text;
    if (!msgToSend.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(msgToSend.trim());
      if (!customText) setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const speakText = (msgId: string, messageText: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    if (speakingMsgId === msgId) {
      setSpeakingMsgId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(messageText);
    utterance.rate = 0.88; // Slightly relaxed pace for seniors
    utterance.pitch = 1.0;
    utterance.lang = speechLangCodes[language];

    const voices = window.speechSynthesis.getVoices();
    const langCode = speechLangCodes[language];
    const preferredVoice =
      voices.find((v) => v.lang.toLowerCase() === langCode.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(langCode.split("-")[0].toLowerCase())) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  const caregiverQuickMsgs = [
    t.caregiverQuickMsg1,
    t.caregiverQuickMsg2,
    t.caregiverQuickMsg3,
    t.caregiverQuickMsg4
  ];

  const elderlyQuickMsgs = [
    { text: t.elderlyQuickMsg1, bg: "bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100" },
    { text: t.elderlyQuickMsg2, bg: "bg-teal-50 border-teal-200 text-teal-900 hover:bg-teal-100" },
    { text: t.elderlyQuickMsg3, bg: "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100" },
    { text: t.elderlyQuickMsg4, bg: "bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100 font-extrabold" }
  ];

  return (
    <div
      id={`chat-widget-${currentRole}`}
      className={`rounded-3xl border shadow-sm flex flex-col overflow-hidden transition-all ${
        currentRole === "elderly"
          ? "bg-[#F8FAF9] border-emerald-100 p-6"
          : "bg-white border-slate-200/80 p-6"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-2xs ${
              currentRole === "elderly" ? "bg-emerald-600" : "bg-emerald-700"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              {currentRole === "elderly" ? t.elderlyChatTitle : t.caregiverChatTitle}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {currentRole === "elderly" ? t.elderlyChatSubtitle : t.caregiverChatSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 px-3 py-1 rounded-full text-[10px] font-extrabold border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-Time Sync
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto space-y-3 pr-1.5 scrollbar-thin ${
          currentRole === "elderly" ? "min-h-[240px] max-h-[360px]" : "min-h-[220px] max-h-[320px]"
        }`}
      >
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
            <MessageSquare className="w-8 h-8 stroke-1 mb-2 text-slate-300" />
            <p className="text-xs italic">No messages exchanged yet. Start the conversation!</p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.sender === currentRole;
            const isCaregiverSender = msg.sender === "caregiver";

            return (
              <div
                key={msg.id}
                id={`chat-msg-${msg.id}`}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1.5">
                  <span className="text-[10px] font-bold text-slate-500">
                    {msg.senderName}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {msg.timestamp}
                  </span>
                </div>

                <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar Icon */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                      isCaregiverSender
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {isCaregiverSender ? "👩‍⚕️" : "👴"}
                  </div>

                  {/* Message Body */}
                  <div
                    className={`relative rounded-3xl px-4 py-2.5 text-xs font-medium shadow-2xs border ${
                      isMe
                        ? "bg-emerald-600 text-white border-emerald-700"
                        : "bg-white text-slate-800 border-slate-200/80"
                    } ${currentRole === "elderly" ? "text-sm py-3 px-4 font-semibold" : ""}`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>

                    {/* Voice Read Aloud Button */}
                    <button
                      onClick={() => speakText(msg.id, msg.text)}
                      className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full transition cursor-pointer select-none ${
                        isMe
                          ? "bg-white/20 text-white hover:bg-white/30"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                      }`}
                      title="Read message aloud"
                    >
                      <Volume2 className={`w-3 h-3 ${speakingMsgId === msg.id ? "animate-bounce text-emerald-300" : ""}`} />
                      <span>{speakingMsgId === msg.id ? "Stop" : t.readAloudChat}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Tap Buttons */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
          {currentRole === "elderly" ? t.quickRepliesElderly : t.quickCheckIn}
        </span>

        {currentRole === "caregiver" ? (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {caregiverQuickMsgs.map((qText, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qText)}
                disabled={isSending}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200 transition cursor-pointer active:scale-98 text-left shadow-2xs"
              >
                + {qText}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {elderlyQuickMsgs.map((qItem, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qItem.text)}
                disabled={isSending}
                className={`py-2.5 px-3.5 rounded-full border text-xs font-black shadow-2xs transition cursor-pointer active:scale-98 flex items-center justify-center text-center ${qItem.bg}`}
              >
                {qItem.text}
              </button>
            ))}
          </div>
        )}

        {/* Text Input + Send Button */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.chatPlaceholder}
            className={`flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none shadow-2xs ${
              currentRole === "elderly"
                ? "text-sm py-2.5 font-medium"
                : ""
            }`}
          />
          <button
            type="submit"
            disabled={!text.trim() || isSending}
            className={`px-4 py-2 rounded-full text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-2xs bg-emerald-600 hover:bg-emerald-700 ${
              currentRole === "elderly"
                ? "py-2.5 text-sm px-5"
                : ""
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.sendMessage}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
