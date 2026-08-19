import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Medication, DiseaseIntelligenceResponse, InteractionResponse } from "../types";
import { Search, Loader2, Sparkles, AlertTriangle, CheckCircle, ShieldAlert, BookOpen, Plus, Activity, HelpCircle } from "lucide-react";
import { TranslationSchema } from "../lib/translations";

interface DiseaseIntelligenceProps {
  medications: Medication[];
  onAddMedication: (med: Partial<Medication>) => void;
  t: TranslationSchema;
}

export default function DiseaseIntelligence({ medications, onAddMedication, t }: DiseaseIntelligenceProps) {
  const [diseaseQuery, setDiseaseQuery] = useState("");
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<DiseaseIntelligenceResponse | null>(null);
  
  const [interactionQuery, setInteractionQuery] = useState("");
  const [loadingInteraction, setLoadingInteraction] = useState(false);
  const [interactionResult, setInteractionResult] = useState<InteractionResponse | null>(null);
  const [errorText, setErrorText] = useState("");
  const [interactionError, setInteractionError] = useState("");

  const quickDiseases = [
    "Type 2 Diabetes",
    "Hypertension",
    "Alzheimer's Disease",
    "Asthma",
    "Parkinson's Disease"
  ];

  const quickDrugs = [
    "Ibuprofen",
    "Warfarin",
    "Aspirin",
    "Ginkgo Biloba"
  ];

  const handleSearchDisease = async (queryStr: string) => {
    if (!queryStr) return;
    setLoadingSchedule(true);
    setErrorText("");
    setScheduleResult(null);
    try {
      const response = await fetch("/api/disease-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryStr, mode: "schedule" })
      });
      if (!response.ok) throw new Error("Failed to load clinical schedule database.");
      const data = await response.json();
      setScheduleResult(data);
    } catch (err: any) {
      setErrorText(err.message || "An error occurred fetching disease intelligence.");
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleCheckInteraction = async (queryStr: string) => {
    if (!queryStr) return;
    setLoadingInteraction(true);
    setInteractionError("");
    setInteractionResult(null);
    try {
      const response = await fetch("/api/disease-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryStr,
          mode: "interaction",
          currentMeds: medications.map(m => m.name)
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process drug interaction evaluation.");
      }
      const data = await response.json();
      setInteractionResult(data);
    } catch (err: any) {
      setInteractionError(err.message || "An error occurred during drug safety analysis.");
    } finally {
      setLoadingInteraction(false);
    }
  };

  const handleAddRecommended = (med: any, diseaseName: string) => {
    onAddMedication({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      scheduleTime: med.scheduleTime,
      disease: diseaseName,
      instructions: med.instructions,
      rxnormCode: med.rxnormCode,
      drugbankId: med.drugbankId
    });
  };

  return (
    <div id="disease-intelligence-portal" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 fill-emerald-100" />
            </div>
            <span>{t.clinicalIntelTitle}</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {t.clinicalIntelDesc}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 self-start sm:self-center shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>WHO &amp; DrugBank Clinical Verification</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Disease Schedule Intelligence */}
        <div className="space-y-4">
          <div className="bg-[#F8FAF9] rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-2xs">
            <label className="text-[11px] font-black text-slate-600 block mb-2 uppercase tracking-wider">
              {t.searchDisease}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="E.g., Asthma, Alzheimer's..."
                value={diseaseQuery}
                onChange={(e) => setDiseaseQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchDisease(diseaseQuery)}
                className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none shadow-2xs"
              />
              <button
                onClick={() => handleSearchDisease(diseaseQuery)}
                disabled={loadingSchedule || !diseaseQuery}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-full px-4 py-2.5 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                {loadingSchedule ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>{t.analyzeBtn}</span>
              </button>
            </div>

            {/* Quick selectors */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3.5 pt-3 border-t border-emerald-100/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">{t.quickSearch}:</span>
              {quickDiseases.map(d => (
                <button
                  key={d}
                  onClick={() => {
                    setDiseaseQuery(d);
                    handleSearchDisease(d);
                  }}
                  className="bg-white hover:bg-emerald-50 border border-slate-200/90 hover:border-emerald-200 text-slate-600 hover:text-emerald-800 rounded-full px-3 py-1 text-[10px] font-bold transition cursor-pointer shadow-2xs"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {errorText && (
            <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 p-3 rounded-2xl shadow-2xs font-medium">
              {errorText}
            </p>
          )}

          {/* Disease Schedule Results */}
          {loadingSchedule && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs gap-3 bg-emerald-50/30 rounded-3xl border border-dashed border-emerald-200 animate-pulse">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <div className="text-center">
                <p className="font-bold text-emerald-950">Querying clinical reference systems...</p>
                <p className="text-[10px] text-slate-400 mt-1">Extracting WHO guidelines, RxNorm identifiers, and drug classes.</p>
              </div>
            </div>
          )}

          {scheduleResult && (
            <div className="border border-emerald-100 rounded-3xl p-5 bg-white shadow-2xs max-h-[450px] overflow-y-auto space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[9px] font-black tracking-widest text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">{t.analysisComplete}</span>
                <h4 className="text-sm font-extrabold text-slate-900 mt-1.5">{t.clinicalRationale} <strong className="text-emerald-700">{diseaseQuery}</strong></h4>
                <p className="text-[11px] text-slate-500 mt-1 italic flex items-start gap-1.5 font-medium">
                  <BookOpen className="w-3.5 h-3.5 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{scheduleResult.whoGuidelinesSummary}</span>
                </p>
              </div>

              {/* Recommended Medications */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t.recommendedMeds}:</span>
                {scheduleResult.medications.map((med, index) => (
                  <div key={index} className="p-4 bg-[#F8FAF9] border border-emerald-100 rounded-2xl flex flex-col gap-2 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-extrabold text-slate-900">{med.name}</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5">{med.class} • <strong className="text-emerald-700 font-mono text-[10px]">{med.dosage}</strong></p>
                      </div>
                      <button
                        onClick={() => handleAddRecommended(med, diseaseQuery)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-full px-3 py-1 text-[10px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        title="Add this drug to the active medications schedule list"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t.addMedToArthur}</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-700 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                      💡 <strong className="text-slate-900">{t.seniorInstructions}:</strong> {med.instructions}
                    </p>

                    <p className="text-[10px] text-slate-500">
                      🔬 <strong className="text-slate-700">{t.clinicalRationale}:</strong> {med.whyLinked}
                    </p>

                    <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono border-t border-emerald-100/70 pt-2 mt-0.5 flex-wrap">
                      <span>{t.rxnormCode}: <strong className="text-slate-600">{med.rxnormCode}</strong></span>
                      <span>•</span>
                      <span>{t.drugbankId}: <strong className="text-slate-600">{med.drugbankId}</strong></span>
                      <span>•</span>
                      <span>{t.scheduleTime}: <strong className="text-emerald-700 font-bold">{med.scheduleTime}</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* General Precautions */}
              <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider block mb-1">{t.safetyPrecautions}:</span>
                <ul className="list-disc list-inside text-[10px] text-emerald-950 space-y-1 font-medium">
                  {scheduleResult.generalPrecautions.map((prec, i) => (
                    <li key={i} className="leading-relaxed">{prec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Panel 2: Drug Safety / Interaction Evaluation */}
        <div className="space-y-4">
          <div className="bg-[#F8FAF9] rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-2xs">
            <div>
              <label className="text-[11px] font-black text-slate-600 block mb-1 uppercase tracking-wider">
                {t.evalDrugSafety}
              </label>
              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed break-words font-medium">
                {t.evalDescription}
                {medications.length > 0 ? (
                  <span className="font-bold text-emerald-800 ml-1 inline-block bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {medications.map(m => m.name).join(", ")}
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium ml-1 italic">(No active medications loaded)</span>
                )}
              </p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="E.g., Ibuprofen, Warfarin..."
                  value={interactionQuery}
                  onChange={(e) => setInteractionQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckInteraction(interactionQuery)}
                  className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none shadow-2xs"
                />
                <button
                  onClick={() => handleCheckInteraction(interactionQuery)}
                  disabled={loadingInteraction || !interactionQuery || medications.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-full px-4 py-2.5 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs"
                >
                  {loadingInteraction ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Activity className="w-3.5 h-3.5" />
                  )}
                  <span>{t.checkSafetyBtn}</span>
                </button>
              </div>

              {/* Quick selectors */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3.5 pt-3 border-t border-emerald-100/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">{t.quickCheck}:</span>
                {quickDrugs.map(drug => (
                  <button
                    key={drug}
                    onClick={() => {
                      setInteractionQuery(drug);
                      handleCheckInteraction(drug);
                    }}
                    disabled={medications.length === 0}
                    className="bg-white hover:bg-emerald-50 border border-slate-200/90 hover:border-emerald-200 disabled:opacity-50 text-slate-600 hover:text-emerald-800 rounded-full px-3 py-1 text-[10px] font-bold transition cursor-pointer shadow-2xs"
                  >
                    {drug}
                  </button>
                ))}
              </div>
            </div>
            
            {medications.length === 0 && (
              <p className="text-[10px] text-amber-900 bg-amber-50 p-2.5 rounded-2xl border border-amber-200 mt-3 text-center font-medium">
                ⚠️ Add medications to the active schedule first to evaluate cross-drug contraindications.
              </p>
            )}
          </div>

          {interactionError && (
            <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 p-3 rounded-2xl shadow-2xs font-medium">
              {interactionError}
            </p>
          )}

          {/* Interaction Results */}
          {loadingInteraction && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs gap-3 bg-amber-50/20 rounded-3xl border border-dashed border-amber-200 animate-pulse">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
              <div className="text-center">
                <p className="font-bold text-amber-950">Querying drug safety databanks...</p>
                <p className="text-[10px] text-slate-400 mt-1">Auditing RxNorm interactions and DrugBank contraindications.</p>
              </div>
            </div>
          )}

          {interactionResult && (
            <div className={`border p-5 rounded-3xl shadow-2xs transition-all max-h-[450px] overflow-y-auto break-words ${
              !interactionResult.hasInteraction
                ? "bg-emerald-50/40 border-emerald-200"
                : interactionResult.severity === "severe"
                ? "bg-rose-50 border-rose-200"
                : interactionResult.severity === "moderate"
                ? "bg-amber-50 border-amber-200"
                : "bg-blue-50 border-blue-200"
            }`}>
              <div className="flex items-start gap-3">
                {/* Icon mapping */}
                {!interactionResult.hasInteraction ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : interactionResult.severity === "severe" ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}

                <div className="space-y-3 flex-1 min-w-0">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">{t.drugSafetyTitle} for <strong className="text-slate-700">{interactionQuery}</strong></span>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-1 flex flex-wrap items-center gap-1.5">
                      <span>Result:</span>
                      <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide inline-block shadow-2xs ${
                        !interactionResult.hasInteraction
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                          : interactionResult.severity === "severe"
                          ? "bg-rose-100 text-rose-900 border border-rose-200"
                          : interactionResult.severity === "moderate"
                          ? "bg-amber-100 text-amber-900 border border-amber-200"
                          : "bg-blue-100 text-blue-900 border border-blue-200"
                      }`}>
                        {interactionResult.hasInteraction ? `${interactionResult.severity} Interaction Detected` : "No Interactions Found"}
                      </span>
                    </h4>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-white/90 p-3.5 rounded-2xl border border-slate-100">
                    {interactionResult.description}
                  </p>

                  <div className="p-3.5 bg-white/80 rounded-2xl border border-slate-100 text-xs">
                    <span className="font-extrabold text-slate-900 block mb-1">{t.safetyRecommendation}:</span>
                    <p className="text-slate-600 leading-relaxed text-[11px] font-medium">
                      {interactionResult.alternativesSuggested}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
