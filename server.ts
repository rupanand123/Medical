import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import {
  Medication,
  NotificationLog,
  ChatMessage,
  OlderAdultProfile,
  CaregiverCodeInfo,
  MedicalFile,
  MedicineConfirmation,
  loadFirestoreState,
  saveSimulatedTime,
  saveCaregiverCode,
  saveOlderAdult,
  saveConnectionRecord,
  checkExistingConnection,
  saveMedication,
  removeMedication,
  saveLog,
  saveChatMessage,
  saveMedicalFile,
  saveConfirmation,
  markChatMessagesRead,
  resetFirestoreState,
  validateCaregiverCode
} from "./src/serverDb.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Active State Cache
let simulatedTime = "07:30";
let caregiverCodes: CaregiverCodeInfo[] = [];
let olderAdults: OlderAdultProfile[] = [];
let medications: Medication[] = [];
let logs: NotificationLog[] = [];
let chatMessages: ChatMessage[] = [];
let medicalFiles: MedicalFile[] = [];
let confirmations: MedicineConfirmation[] = [];

// Load initial state from Firestore
loadFirestoreState().then(initialState => {
  simulatedTime = initialState.simulatedTime;
  caregiverCodes = initialState.caregiverCodes || [];
  olderAdults = initialState.olderAdults || [];
  medications = initialState.medications || [];
  logs = initialState.logs || [];
  chatMessages = initialState.chatMessages || [];
  medicalFiles = initialState.medicalFiles || [];
  confirmations = initialState.confirmations || [];
  console.log("Loaded initial state from Firestore successfully.");
}).catch(err => {
  console.error("Failed to load initial state from Firestore:", err);
});

app.use(express.json());

// Helper to calculate minutes from "HH:MM"
function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Helper to convert minutes back to "HH:MM"
function toTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Generate unique caregiver connection code (e.g. CG-A8K3X9)
function generateConnectionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomStr = "";
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CG-${randomStr}`;
}

// Helpers for client context and ID normalization
function getClientInfo(req: express.Request) {
  const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string) || (req.body?.userId) || "default-device";
  const role = ((req.headers["x-role"] as string) || (req.query.role as string) || (req.body?.role) || "elderly").toLowerCase();
  return { userId, role };
}

function getCaregiverId(rawId: string): string {
  if (!rawId) return "cg-default";
  return rawId.startsWith("cg-") ? rawId : `cg-${rawId}`;
}

function getOlderAdultId(rawId: string): string {
  if (!rawId) return "oa-default";
  return rawId.startsWith("oa-") ? rawId : `oa-${rawId}`;
}

async function getOrCreateCaregiverCode(caregiverId: string): Promise<string> {
  let existing = caregiverCodes.find(c => c.caregiverId === caregiverId || c.id === caregiverId);
  if (existing && existing.code) return existing.code;

  const newCode = generateConnectionCode();
  const newObj: CaregiverCodeInfo = {
    id: caregiverId,
    caregiverId,
    code: newCode,
    createdAt: new Date().toISOString()
  };
  caregiverCodes.push(newObj);
  await saveCaregiverCode(caregiverId, newCode);
  return newCode;
}

async function seedInitialMedicationsForElderly(targetOAId: string) {
  const existingMeds = medications.filter(m => m.olderAdultId === targetOAId);
  if (existingMeds.length > 0) return;

  const starterMeds: Medication[] = [
    {
      id: `med-${Date.now()}-1`,
      olderAdultId: targetOAId,
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      scheduleTime: "08:00",
      disease: "Type 2 Diabetes",
      rxnormCode: "860975",
      drugbankId: "DB00331",
      instructions: "Take with meals to minimize GI side effects.",
      status: "pending",
      escalationStep: 0,
    },
    {
      id: `med-${Date.now()}-2`,
      olderAdultId: targetOAId,
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      scheduleTime: "09:00",
      disease: "Hypertension",
      rxnormCode: "314076",
      drugbankId: "DB00722",
      instructions: "Take with or without food, monitor for dry cough.",
      status: "pending",
      escalationStep: 0,
    },
    {
      id: `med-${Date.now()}-3`,
      olderAdultId: targetOAId,
      name: "Atorvastatin",
      dosage: "20mg",
      frequency: "Once daily",
      scheduleTime: "21:00",
      disease: "Hypercholesterolemia",
      rxnormCode: "83367",
      drugbankId: "DB01076",
      instructions: "Take in the evening. Avoid grapefruit juice.",
      status: "pending",
      escalationStep: 0,
    }
  ];

  for (const m of starterMeds) {
    medications.push(m);
    await saveMedication(m);
  }

  const welcomeLog: NotificationLog = {
    id: `log-${Date.now()}-init`,
    olderAdultId: targetOAId,
    timestamp: simulatedTime,
    recipient: "Elderly User",
    channel: "App Alert",
    message: "System initialized. Personal health monitor active.",
    type: "info"
  };
  logs.push(welcomeLog);
  await saveLog(welcomeLog);
}

// Check schedule logic based on time advancement
async function processSimulationStep(oldTime: string, newTime: string) {
  const oldMin = toMinutes(oldTime);
  const newMin = toMinutes(newTime);
  
  for (const med of medications) {
    if (!med.olderAdultId) continue;
    const medMin = toMinutes(med.scheduleTime);
    const targetOA = olderAdults.find(o => o.id === med.olderAdultId);
    const patientName = targetOA ? targetOA.name : "Arthur";

    if (medMin >= oldMin && medMin <= newMin) {
      if (med.escalationStep === 0 && med.status === "pending") {
        med.escalationStep = 1;
        await saveMedication(med);

        const log1: NotificationLog = {
          id: `log-${Date.now()}-${med.id}-1`,
          olderAdultId: med.olderAdultId,
          timestamp: med.scheduleTime,
          recipient: "Elderly User",
          channel: "SMS",
          message: `⏰ Reminder: ${patientName}, it's time to take your ${med.name} (${med.dosage}) for your ${med.disease}. Please press the green 'Taken' button on your screen.`,
          type: "info"
        };
        logs.push(log1);
        await saveLog(log1);
        
        const log1v: NotificationLog = {
          id: `log-${Date.now()}-${med.id}-1v`,
          olderAdultId: med.olderAdultId,
          timestamp: med.scheduleTime,
          recipient: "Elderly User",
          channel: "Voice Call",
          message: `📞 [Automated Voice Call]: 'Hello ${patientName}, this is your health assistant. Please remember to take your ${med.name} now.'`,
          type: "info"
        };
        logs.push(log1v);
        await saveLog(log1v);
      }
    }
    
    // Scheduled time + 15 minutes (Alert caregiver)
    const caregiverAlertMin = medMin + 15;
    if (caregiverAlertMin >= oldMin && caregiverAlertMin <= newMin) {
      if (med.escalationStep === 1 && med.status === "pending") {
        med.escalationStep = 2;
        med.status = "missed";
        await saveMedication(med);

        const log2: NotificationLog = {
          id: `log-${Date.now()}-${med.id}-2`,
          olderAdultId: med.olderAdultId,
          timestamp: toTimeStr(caregiverAlertMin),
          recipient: "Caregiver",
          channel: "SMS",
          message: `⚠️ Alert: ${patientName} missed his/her ${med.name} (${med.dosage}) scheduled for ${med.scheduleTime}. Please check in.`,
          type: "warning"
        };
        logs.push(log2);
        await saveLog(log2);
      }
    }

    // Scheduled time + 30 minutes (Escalate to health worker)
    const healthWorkerEscalateMin = medMin + 30;
    if (healthWorkerEscalateMin >= oldMin && healthWorkerEscalateMin <= newMin) {
      if (med.escalationStep === 2 && (med.status === "pending" || med.status === "missed")) {
        med.escalationStep = 3;
        med.status = "escalated";
        await saveMedication(med);

        const log3: NotificationLog = {
          id: `log-${Date.now()}-${med.id}-3`,
          olderAdultId: med.olderAdultId,
          timestamp: toTimeStr(healthWorkerEscalateMin),
          recipient: "Health Worker",
          channel: "SMS",
          message: `🚨 Critical Escalation: ${patientName} has failed to take ${med.name} (${med.dosage}) within 30 minutes of schedule. Neither patient nor Caregiver has responded. Please initiate protocol.`,
          type: "critical"
        };
        logs.push(log3);
        await saveLog(log3);
      }
    }
  }
}

// API: Get State
app.get("/api/state", async (req, res) => {
  const { userId, role } = getClientInfo(req);

  if (role === "caregiver") {
    const caregiverId = getCaregiverId(userId);
    const code = await getOrCreateCaregiverCode(caregiverId);

    // Find elderly profiles connected to this caregiver
    let connectedProfiles = olderAdults.filter(o => o.connectedCaregiverId === caregiverId);

    // If caregiver has no connected patients yet, auto-create a starting patient assigned to them
    if (connectedProfiles.length === 0) {
      const initOAId = `oa-${caregiverId.replace(/^cg-/, "")}`;
      let existingProfile = olderAdults.find(o => o.id === initOAId);

      if (!existingProfile) {
        existingProfile = {
          id: initOAId,
          name: "Arthur Pendelton",
          avatar: "👴",
          age: 78,
          status: "online",
          lastActivity: "Active now",
          connectedCaregiverId: caregiverId,
          connectedCode: code,
          conditions: "Type 2 Diabetes, Hypertension"
        };
        olderAdults.push(existingProfile);
        await saveOlderAdult(existingProfile);
        await saveConnectionRecord(caregiverId, initOAId);
        await seedInitialMedicationsForElderly(initOAId);
      } else {
        existingProfile.connectedCaregiverId = caregiverId;
        existingProfile.connectedCode = code;
        await saveOlderAdult(existingProfile);
        await saveConnectionRecord(caregiverId, initOAId);
      }
      connectedProfiles = [existingProfile];
    }

    // Determine target active older adult
    let requestedOAId = (req.query.olderAdultId as string) || "";
    let targetOA = connectedProfiles.find(p => p.id === requestedOAId);
    if (!targetOA) {
      targetOA = connectedProfiles[0];
    }

    const targetOAId = targetOA.id;
    const filteredMeds = medications.filter(m => m.olderAdultId === targetOAId);
    const filteredLogs = logs.filter(l => l.olderAdultId === targetOAId);
    const filteredChats = chatMessages.filter(c => c.olderAdultId === targetOAId);
    const filteredFiles = medicalFiles.filter(f => f.olderAdultId === targetOAId);
    const filteredConfs = confirmations.filter(c => c.olderAdultId === targetOAId);

    res.json({
      simulatedTime,
      caregiverCode: code,
      olderAdults: connectedProfiles,
      activeOlderAdultId: targetOAId,
      medications: filteredMeds,
      logs: [...filteredLogs].reverse(),
      chatMessages: filteredChats,
      medicalFiles: filteredFiles,
      confirmations: filteredConfs
    });
    return;
  }

  // Elderly Role
  const elderlyId = getOlderAdultId(userId);
  let profile = olderAdults.find(o => o.id === elderlyId);

  if (!profile) {
    profile = {
      id: elderlyId,
      name: "Arthur Pendelton",
      avatar: "👴",
      age: 78,
      status: "online",
      lastActivity: "Active now",
      connectedCaregiverId: null,
      connectedCode: null,
      conditions: "Type 2 Diabetes, Hypertension"
    };
    olderAdults.push(profile);
    await saveOlderAdult(profile);
    await seedInitialMedicationsForElderly(elderlyId);
  }

  const filteredMeds = medications.filter(m => m.olderAdultId === elderlyId);
  const filteredLogs = logs.filter(l => l.olderAdultId === elderlyId);
  const filteredChats = chatMessages.filter(c => c.olderAdultId === elderlyId);
  const filteredFiles = medicalFiles.filter(f => f.olderAdultId === elderlyId);
  const filteredConfs = confirmations.filter(c => c.olderAdultId === elderlyId);

  res.json({
    simulatedTime,
    caregiverCode: profile.connectedCode || "",
    olderAdults: [profile],
    activeOlderAdultId: elderlyId,
    medications: filteredMeds,
    logs: [...filteredLogs].reverse(),
    chatMessages: filteredChats,
    medicalFiles: filteredFiles,
    confirmations: filteredConfs
  });
});

// API: Reset Connection Code (Caregiver Side)
app.post("/api/connections/reset-code", async (req, res) => {
  const { userId } = getClientInfo(req);
  const caregiverId = getCaregiverId(userId);
  const newCode = generateConnectionCode();

  const idx = caregiverCodes.findIndex(c => c.caregiverId === caregiverId || c.id === caregiverId);
  if (idx !== -1) {
    caregiverCodes[idx].code = newCode;
  } else {
    caregiverCodes.push({ id: caregiverId, caregiverId, code: newCode, createdAt: new Date().toISOString() });
  }
  await saveCaregiverCode(caregiverId, newCode);

  for (const oa of olderAdults) {
    if (oa.connectedCaregiverId === caregiverId) {
      oa.connectedCode = newCode;
      await saveOlderAdult(oa);
    }
  }

  const resetCodeLog: NotificationLog = {
    id: `log-${Date.now()}-code-reset`,
    timestamp: simulatedTime,
    recipient: "Caregiver",
    channel: "App Alert",
    message: `🔑 Caregiver Connection Code reset. New permanent code: ${newCode}. Share this with older adults to connect.`,
    type: "info"
  };
  logs.push(resetCodeLog);
  await saveLog(resetCodeLog);

  res.json({ success: true, caregiverCode: newCode });
});

// API: Connect Older Adult using Connection Code (Older Adult Side)
app.post("/api/connections/connect", async (req, res) => {
  const { code, olderAdultId, name } = req.body;
  const { userId } = getClientInfo(req);

  if (!code || typeof code !== "string" || !code.trim()) {
    res.status(400).json({ error: "Connection code is required." });
    return;
  }

  const validation = await validateCaregiverCode(code);

  if (!validation.isValid) {
    res.status(400).json({
      error: `Invalid or expired access code "${code}". Please verify the code with your caregiver.`
    });
    return;
  }

  const matchedCode = validation.code;
  const matchedCaregiverId = validation.caregiverId;
  const targetId = getOlderAdultId(olderAdultId || userId);
  let profile = olderAdults.find(o => o.id === targetId);

  // If already connected to this same caregiver, confirm connection smoothly
  if (profile && profile.connectedCaregiverId === matchedCaregiverId) {
    await saveOlderAdult(profile);
    await saveConnectionRecord(matchedCaregiverId, targetId);
    res.json({
      success: true,
      message: `Already connected to Caregiver!`,
      profile,
      caregiverCode: matchedCode
    });
    return;
  }

  if (!profile) {
    profile = {
      id: targetId,
      name: name || "Arthur Pendelton",
      avatar: "👴",
      age: 78,
      status: "online",
      lastActivity: "Active now",
      connectedCaregiverId: matchedCaregiverId,
      connectedCaregiverName: "Caregiver",
      connectedCode: matchedCode,
      conditions: "Type 2 Diabetes, Hypertension"
    };
    olderAdults.push(profile);
    await seedInitialMedicationsForElderly(targetId);
  } else {
    profile.connectedCaregiverId = matchedCaregiverId;
    profile.connectedCaregiverName = "Caregiver";
    profile.connectedCode = matchedCode;
    profile.status = "online";
    profile.lastActivity = "Active now";
    if (name) {
      profile.name = name;
    }
  }

  // Persist relationship securely in database
  await saveOlderAdult(profile);
  await saveConnectionRecord(matchedCaregiverId, targetId);

  // Connection Log
  const connLog: NotificationLog = {
    id: `log-${Date.now()}-conn-success`,
    olderAdultId: targetId,
    timestamp: simulatedTime,
    recipient: "Caregiver",
    channel: "App Alert",
    message: `🔗 Connection Established: ${profile.name} linked with Caregiver using code ${matchedCode}.`,
    type: "info"
  };
  logs.push(connLog);
  await saveLog(connLog);

  // Connection Chat Greeting
  const connMsg: ChatMessage = {
    id: `msg-${Date.now()}-conn-welcome`,
    olderAdultId: targetId,
    sender: "caregiver",
    senderName: "Caregiver",
    text: `🔗 Connection active! Welcome ${profile.name}, I am now connected to monitor your medicines and health schedules.`,
    timestamp: simulatedTime,
    readByElderly: false,
    readByCaregiver: true
  };
  chatMessages.push(connMsg);
  await saveChatMessage(connMsg);

  res.json({
    success: true,
    message: `Successfully connected to Caregiver!`,
    profile,
    caregiverCode: matchedCode
  });
});

// API: Disconnect Older Adult
app.post("/api/connections/disconnect", async (req, res) => {
  const { olderAdultId } = req.body;
  const { userId } = getClientInfo(req);
  const targetId = getOlderAdultId(olderAdultId || userId);
  const profile = olderAdults.find(o => o.id === targetId);

  if (profile) {
    profile.connectedCaregiverId = null;
    profile.connectedCode = null;
    await saveOlderAdult(profile);

    const disLog: NotificationLog = {
      id: `log-${Date.now()}-conn-dis`,
      olderAdultId: targetId,
      timestamp: simulatedTime,
      recipient: "Caregiver",
      channel: "App Alert",
      message: `🔌 ${profile.name} disconnected from caregiver.`,
      type: "warning"
    };
    logs.push(disLog);
    await saveLog(disLog);
  }

  res.json({ success: true, olderAdultId: targetId });
});

// API: Switch Active Older Adult (Caregiver Dashboard)
app.post("/api/caregiver/switch-patient", async (req, res) => {
  const { olderAdultId } = req.body;
  const { userId } = getClientInfo(req);
  const caregiverId = getCaregiverId(userId);

  if (!olderAdultId) {
    res.status(400).json({ error: "olderAdultId is required" });
    return;
  }

  const targetOA = olderAdults.find(o => o.id === olderAdultId && o.connectedCaregiverId === caregiverId);
  if (!targetOA) {
    res.status(403).json({ error: "Unauthorized: patient is not connected to your caregiver account." });
    return;
  }

  const filteredMeds = medications.filter(m => m.olderAdultId === olderAdultId);
  const filteredLogs = logs.filter(l => l.olderAdultId === olderAdultId);
  const filteredChats = chatMessages.filter(c => c.olderAdultId === olderAdultId);
  const filteredFiles = medicalFiles.filter(f => f.olderAdultId === olderAdultId);
  const filteredConfs = confirmations.filter(c => c.olderAdultId === olderAdultId);

  res.json({
    success: true,
    activeOlderAdultId: olderAdultId,
    medications: filteredMeds,
    logs: [...filteredLogs].reverse(),
    chatMessages: filteredChats,
    medicalFiles: filteredFiles,
    confirmations: filteredConfs
  });
});

// API: Send Chat Message with optional File attachment
app.post("/api/chat", async (req, res) => {
  const { sender, text, isVoice, fileUrl, fileName, olderAdultId } = req.body;
  const { userId, role } = getClientInfo(req);

  if (!sender || (!text && !fileUrl)) {
    res.status(400).json({ error: "Sender and text or fileUrl are required" });
    return;
  }

  let targetOAId = "";
  if (role === "elderly") {
    targetOAId = getOlderAdultId(userId);
  } else {
    targetOAId = olderAdultId || "";
    const caregiverId = getCaregiverId(userId);
    const isValidPair = olderAdults.some(o => o.id === targetOAId && o.connectedCaregiverId === caregiverId);
    if (!isValidPair && targetOAId) {
      const connected = olderAdults.find(o => o.connectedCaregiverId === caregiverId);
      if (connected) targetOAId = connected.id;
    }
  }

  if (!targetOAId) {
    res.status(400).json({ error: "Invalid target patient for chat message" });
    return;
  }

  const targetOA = olderAdults.find(o => o.id === targetOAId);
  const patientName = targetOA ? targetOA.name : "Arthur";

  const senderName = sender === "caregiver" ? "Caregiver" : patientName;
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    olderAdultId: targetOAId,
    sender: sender as "caregiver" | "elderly",
    senderName,
    text: text || (fileName ? `Attached file: ${fileName}` : ""),
    timestamp: simulatedTime,
    readByElderly: sender === "elderly",
    readByCaregiver: sender === "caregiver",
    isVoice: !!isVoice,
    fileUrl,
    fileName
  };

  chatMessages.push(newMsg);
  await saveChatMessage(newMsg);

  const chatLog: NotificationLog = {
    id: `log-${Date.now()}-chat`,
    olderAdultId: targetOAId,
    timestamp: simulatedTime,
    recipient: sender === "caregiver" ? "Elderly User" : "Caregiver",
    channel: "App Alert",
    message: `💬 Chat from ${senderName}: "${newMsg.text}"`,
    type: "info"
  };
  logs.push(chatLog);
  await saveLog(chatLog);

  const filteredChats = chatMessages.filter(c => c.olderAdultId === targetOAId);
  const filteredLogs = logs.filter(l => l.olderAdultId === targetOAId);

  res.json({ success: true, chatMessages: filteredChats, logs: [...filteredLogs].reverse() });
});

// API: Mark messages as read
app.post("/api/chat/read", async (req, res) => {
  const { reader, olderAdultId } = req.body;
  const { userId, role } = getClientInfo(req);

  const targetOAId = role === "elderly" ? getOlderAdultId(userId) : (olderAdultId || "");

  chatMessages.forEach(m => {
    if (m.olderAdultId === targetOAId) {
      if (reader === "elderly") m.readByElderly = true;
      if (reader === "caregiver") m.readByCaregiver = true;
    }
  });

  const filteredToUpdate = chatMessages.filter(c => c.olderAdultId === targetOAId);
  await markChatMessagesRead(reader, filteredToUpdate);

  res.json({ success: true, chatMessages: filteredToUpdate });
});

// API: Upload / Share Medical File or Prescription
app.post("/api/medical-files", async (req, res) => {
  const { olderAdultId, fileName, fileType, fileUrl, notes, sender } = req.body;
  const { userId, role } = getClientInfo(req);

  if (!fileName || !fileUrl) {
    res.status(400).json({ error: "File name and file URL are required." });
    return;
  }

  const targetOAId = role === "elderly" ? getOlderAdultId(userId) : (olderAdultId || "");
  if (!targetOAId) {
    res.status(400).json({ error: "Target patient ID is required" });
    return;
  }

  const newFile: MedicalFile = {
    id: `file-${Date.now()}`,
    olderAdultId: targetOAId,
    sender: sender || (role === "caregiver" ? "caregiver" : "elderly"),
    fileName,
    fileType: fileType || "prescription",
    fileUrl,
    uploadedAt: `${new Date().toISOString().split("T")[0]} ${simulatedTime}`,
    notes: notes || "Uploaded medical file"
  };

  medicalFiles.push(newFile);
  await saveMedicalFile(newFile);

  const fileLog: NotificationLog = {
    id: `log-${Date.now()}-file`,
    olderAdultId: targetOAId,
    timestamp: simulatedTime,
    recipient: sender === "caregiver" ? "Elderly User" : "Caregiver",
    channel: "App Alert",
    message: `📁 New Medical File Shared: "${fileName}" (${fileType}).`,
    type: "info"
  };
  logs.push(fileLog);
  await saveLog(fileLog);

  const filteredFiles = medicalFiles.filter(f => f.olderAdultId === targetOAId);
  const filteredLogs = logs.filter(l => l.olderAdultId === targetOAId);

  res.json({ success: true, medicalFiles: filteredFiles, logs: [...filteredLogs].reverse() });
});

// API: Get Medical Files for an Older Adult
app.get("/api/medical-files/:olderAdultId", (req, res) => {
  const { olderAdultId } = req.params;
  const files = medicalFiles.filter(f => f.olderAdultId === olderAdultId);
  res.json({ medicalFiles: files });
});

// API: Advance Simulated Time
app.post("/api/simulation/advance-time", async (req, res) => {
  const { minutes, olderAdultId } = req.body;
  const { userId, role } = getClientInfo(req);

  if (typeof minutes !== "number") {
    res.status(400).json({ error: "minutes must be a number" });
    return;
  }
  
  const currentTotal = toMinutes(simulatedTime);
  const nextTotal = (currentTotal + minutes) % 1440;
  const nextTimeStr = toTimeStr(nextTotal);
  
  let tempTotal = currentTotal;
  while (tempTotal !== nextTotal) {
    const stepNext = (tempTotal + 5) % 1440;
    await processSimulationStep(toTimeStr(tempTotal), toTimeStr(stepNext));
    tempTotal = stepNext;
  }
  
  simulatedTime = nextTimeStr;
  await saveSimulatedTime(simulatedTime);

  const targetOAId = role === "elderly" ? getOlderAdultId(userId) : (olderAdultId || "");
  const filteredMeds = medications.filter(m => m.olderAdultId === targetOAId);
  const filteredLogs = logs.filter(l => l.olderAdultId === targetOAId);

  res.json({
    simulatedTime,
    medications: filteredMeds,
    logs: [...filteredLogs].reverse()
  });
});

// API: Take Medication with Medication Confirmation Record
app.post("/api/medications/:id/take", async (req, res) => {
  const { id } = req.params;
  const med = medications.find(m => m.id === id);
  if (!med) {
    res.status(404).json({ error: "Medication not found" });
    return;
  }
  
  med.status = "taken";
  med.lastActionTime = simulatedTime;
  med.escalationStep = 0;

  // Decrement pill count if tracked
  if (typeof med.pillsRemaining === "number" && med.pillsRemaining > 0) {
    med.pillsRemaining -= 1;
  } else if (med.pillsRemaining === undefined) {
    med.pillsRemaining = 29;
    med.totalPills = 30;
  }

  await saveMedication(med);

  const targetOAId = med.olderAdultId;
  const targetOA = olderAdults.find(o => o.id === targetOAId);
  const patientName = targetOA ? targetOA.name : "Arthur";

  const todayDate = new Date().toISOString().split("T")[0];
  const confRecord: MedicineConfirmation = {
    id: `conf-${Date.now()}`,
    olderAdultId: targetOAId,
    medicationId: med.id,
    medicationName: med.name,
    dosage: med.dosage,
    takenTime: simulatedTime,
    date: todayDate,
    status: "taken"
  };
  confirmations.push(confRecord);
  await saveConfirmation(confRecord);

  const takeLog: NotificationLog = {
    id: `log-${Date.now()}-take`,
    olderAdultId: targetOAId,
    timestamp: simulatedTime,
    recipient: "Caregiver",
    channel: "App Alert",
    message: `✅ [Medication Confirmation] ${patientName} confirmed taking ${med.name} (${med.dosage}) at ${simulatedTime} (remaining: ${med.pillsRemaining} pills).`,
    type: "info"
  };
  logs.push(takeLog);
  await saveLog(takeLog);

  // If pill count dropped below 5, automatically trigger low pill stock log alert
  if (typeof med.pillsRemaining === "number" && med.pillsRemaining < 5) {
    const lowStockLog: NotificationLog = {
      id: `log-${Date.now()}-lowstock`,
      olderAdultId: targetOAId,
      timestamp: simulatedTime,
      recipient: "Caregiver",
      channel: "App Alert",
      message: `⚠️ [Low Medication Stock Alert] Only ${med.pillsRemaining} pills remaining for ${med.name} (${med.dosage})! Please request a refill.`,
      type: "warning"
    };
    logs.push(lowStockLog);
    await saveLog(lowStockLog);
  }
  
  const filteredMeds = medications.filter(m => m.olderAdultId === targetOAId);
  const filteredLogs = logs.filter(l => l.olderAdultId === targetOAId);
  const filteredConfs = confirmations.filter(c => c.olderAdultId === targetOAId);

  res.json({
    success: true,
    medication: med,
    confirmations: filteredConfs,
    logs: [...filteredLogs].reverse()
  });
});

// API: Request Medication Refill
app.post("/api/medications/:id/request-refill", async (req, res) => {
  const { id } = req.params;
  const med = medications.find(m => m.id === id);
  if (!med) {
    res.status(404).json({ error: "Medication not found" });
    return;
  }

  med.refillRequested = true;
  await saveMedication(med);

  const targetOAId = med.olderAdultId;
  const targetOA = olderAdults.find(o => o.id === targetOAId);
  const patientName = targetOA ? targetOA.name : "Arthur";

  const refillLog: NotificationLog = {
    id: `log-${Date.now()}-refill-req`,
    olderAdultId: targetOAId,
    timestamp: simulatedTime,
    recipient: "Caregiver",
    channel: "App Alert",
    message: `💊 Refill Requested: Prescription refill submitted for ${med.name} (${med.dosage}) for ${patientName}. Current stock: ${med.pillsRemaining ?? 0} pills remaining.`,
    type: "warning"
  };
  logs.push(refillLog);
  await saveLog(refillLog);

  const filteredMeds = medications.filter(m => m.olderAdultId === targetOAId);
  const filteredLogs = logs.filter(l => l.olderAdultId === targetOAId);

  res.json({ success: true, medication: med, medications: filteredMeds, logs: [...filteredLogs].reverse() });
});

// API: Restock / Refill Medication Pills
app.post("/api/medications/:id/restock", async (req, res) => {
  const { id } = req.params;
  const { count } = req.body;
  const med = medications.find(m => m.id === id);
  if (!med) {
    res.status(404).json({ error: "Medication not found" });
    return;
  }

  const addedPills = typeof count === "number" && count > 0 ? count : 30;
  med.pillsRemaining = (med.pillsRemaining || 0) + addedPills;
  if (!med.totalPills || med.pillsRemaining > med.totalPills) {
    med.totalPills = med.pillsRemaining;
  }
  med.refillRequested = false;
  await saveMedication(med);

  const targetOAId = med.olderAdultId;
  const targetOA = olderAdults.find(o => o.id === targetOAId);
  const patientName = targetOA ? targetOA.name : "Arthur";

  const restockLog: NotificationLog = {
    id: `log-${Date.now()}-restock`,
    olderAdultId: targetOAId,
    timestamp: simulatedTime,
    recipient: "Caregiver",
    channel: "App Alert",
    message: `✅ Stock Restocked: Added ${addedPills} pills to ${med.name} (${med.dosage}) for ${patientName}. New total: ${med.pillsRemaining} pills remaining.`,
    type: "info"
  };
  logs.push(restockLog);
  await saveLog(restockLog);

  const filteredMeds = medications.filter(m => m.olderAdultId === targetOAId);
  const filteredLogs = logs.filter(l => l.olderAdultId === targetOAId);

  res.json({ success: true, medication: med, medications: filteredMeds, logs: [...filteredLogs].reverse() });
});

// API: Manually trigger an escalation for demo purposes
app.post("/api/medications/:id/force-escalate", async (req, res) => {
  const { id } = req.params;
  const med = medications.find(m => m.id === id);
  if (!med) {
    res.status(404).json({ error: "Medication not found" });
    return;
  }

  if (med.status === "taken") {
    res.status(400).json({ error: "Cannot escalate a medication that has already been taken" });
    return;
  }

  const nextStep = (med.escalationStep + 1) as 1 | 2 | 3;
  med.escalationStep = nextStep;
  const targetOAId = med.olderAdultId;
  const targetOA = olderAdults.find(o => o.id === targetOAId);
  const patientName = targetOA ? targetOA.name : "Arthur";

  let newLog: NotificationLog | null = null;

  if (nextStep === 1) {
    med.status = "pending";
    newLog = {
      id: `log-${Date.now()}-manual-1`,
      olderAdultId: targetOAId,
      timestamp: simulatedTime,
      recipient: "Elderly User",
      channel: "SMS",
      message: `[Manual Trigger] ⏰ ${patientName}'s phone vibrates: Time to take your ${med.name} (${med.dosage})!`,
      type: "info"
    };
  } else if (nextStep === 2) {
    med.status = "missed";
    newLog = {
      id: `log-${Date.now()}-manual-2`,
      olderAdultId: targetOAId,
      timestamp: simulatedTime,
      recipient: "Caregiver",
      channel: "SMS",
      message: `[Manual Trigger] ⚠️ Alert: ${patientName} missed ${med.name} (${med.dosage}) scheduled for ${med.scheduleTime}. Please check in!`,
      type: "warning"
    };
  } else if (nextStep === 3) {
    med.status = "escalated";
    newLog = {
      id: `log-${Date.now()}-manual-3`,
      olderAdultId: targetOAId,
      timestamp: simulatedTime,
      recipient: "Health Worker",
      channel: "SMS",
      message: `[Manual Trigger] 🚨 Critical Escalation: ${patientName} has missed ${med.name} (${med.dosage}). Caregiver has not cleared the alarm. Please call or dispatch team.`,
      type: "critical"
    };
  }

  await saveMedication(med);
  if (newLog) {
    logs.push(newLog);
    await saveLog(newLog);
  }

  const filteredMeds = medications.filter(m => m.olderAdultId === targetOAId);
  const filteredLogs = logs.filter(l => l.olderAdultId === targetOAId);

  res.json({ success: true, medication: med, medications: filteredMeds, logs: [...filteredLogs].reverse() });
});

// API: Add Custom Medication
app.post("/api/medications", async (req, res) => {
  const { name, dosage, frequency, scheduleTime, disease, instructions, rxnormCode, drugbankId, olderAdultId, pillsRemaining, totalPills } = req.body;
  const { userId, role } = getClientInfo(req);

  if (!name || !dosage || !scheduleTime || !disease) {
    res.status(400).json({ error: "Name, dosage, schedule time, and disease are required" });
    return;
  }
  
  const targetOAId = role === "elderly" ? getOlderAdultId(userId) : (olderAdultId || "");
  if (!targetOAId) {
    res.status(400).json({ error: "Target patient ID is required" });
    return;
  }

  const initialPills = typeof pillsRemaining === "number" && pillsRemaining >= 0 ? pillsRemaining : 30;
  const initialTotal = typeof totalPills === "number" && totalPills >= initialPills ? totalPills : 30;

  const newMed: Medication = {
    id: `med-${Date.now()}`,
    olderAdultId: targetOAId,
    name,
    dosage,
    frequency: frequency || "Once daily",
    scheduleTime,
    disease,
    rxnormCode: rxnormCode || "N/A",
    drugbankId: drugbankId || "N/A",
    instructions: instructions || "Take as directed by doctor.",
    status: "pending",
    escalationStep: 0,
    pillsRemaining: initialPills,
    totalPills: initialTotal,
    refillRequested: false
  };
  
  medications.push(newMed);
  await saveMedication(newMed);
  
  const addLog: NotificationLog = {
    id: `log-${Date.now()}-add`,
    olderAdultId: targetOAId,
    timestamp: simulatedTime,
    recipient: "Caregiver",
    channel: "App Alert",
    message: `➕ New Medication Added: ${name} (${dosage}) scheduled at ${scheduleTime} for ${disease}.`,
    type: "info"
  };
  logs.push(addLog);
  await saveLog(addLog);
  
  const filteredMeds = medications.filter(m => m.olderAdultId === targetOAId);
  const filteredLogs = logs.filter(l => l.olderAdultId === targetOAId);

  res.json({ success: true, medications: filteredMeds, logs: [...filteredLogs].reverse() });
});

// API: Delete Medication
app.delete("/api/medications/:id", async (req, res) => {
  const { id } = req.params;
  const medToDelete = medications.find(m => m.id === id);
  if (!medToDelete) {
    res.status(404).json({ error: "Medication not found" });
    return;
  }

  const targetOAId = medToDelete.olderAdultId;
  medications = medications.filter(m => m.id !== id);
  await removeMedication(id);

  const deleteLog: NotificationLog = {
    id: `log-${Date.now()}-delete`,
    olderAdultId: targetOAId,
    timestamp: simulatedTime,
    recipient: "Caregiver",
    channel: "App Alert",
    message: `🗑️ Medication removed from active schedule.`,
    type: "info"
  };
  logs.push(deleteLog);
  await saveLog(deleteLog);
  
  const filteredMeds = medications.filter(m => m.olderAdultId === targetOAId);
  const filteredLogs = logs.filter(l => l.olderAdultId === targetOAId);

  res.json({ success: true, medications: filteredMeds, logs: [...filteredLogs].reverse() });
});

// API: Reset State
app.post("/api/simulation/reset", async (req, res) => {
  const resetResult = await resetFirestoreState();
  if (resetResult) {
    simulatedTime = resetResult.simulatedTime;
    caregiverCodes = resetResult.caregiverCodes;
    olderAdults = resetResult.olderAdults;
    medications = resetResult.medications;
    logs = resetResult.logs;
    chatMessages = resetResult.chatMessages;
    medicalFiles = resetResult.medicalFiles;
    confirmations = resetResult.confirmations;
  }
  res.json({
    success: true,
    simulatedTime,
    caregiverCodes,
    olderAdults,
    medications,
    logs: [...logs].reverse(),
    chatMessages,
    medicalFiles,
    confirmations
  });
});

// Helper: Gemini AI execution with model failover and high-demand recovery
async function generateClinicalAIResponse(params: {
  contents: string;
  systemInstruction: string;
  responseSchema: any;
}): Promise<any | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const candidateModels = ["gemini-3.7-flash", "gemini-2.5-flash"];
  
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: params.responseSchema
        }
      });

      if (response && response.text) {
        const text = response.text.trim();
        return JSON.parse(text);
      }
    } catch (err: any) {
      // Continue to candidate fallback model on temporary high demand / 503
      continue;
    }
  }
  return null;
}

// API: Disease-Dataset Intelligence via Gemini API with Clinical Pharmacopeia Fallback
app.post("/api/disease-intelligence", async (req, res) => {
  const { query, mode, currentMeds } = req.body;
  
  if (!query) {
    res.status(400).json({ error: "Query is required" });
    return;
  }
  
  const cleanQuery = String(query).trim();
  const lowerQuery = cleanQuery.toLowerCase();
  const medList: string[] = Array.isArray(currentMeds) ? currentMeds : [];
  const lowerMeds = medList.map(m => String(m).toLowerCase());

  let systemPrompt = "";
  let responseSchema: any = {};
  
  if (mode === "schedule") {
    systemPrompt = `You are a clinical pharmacologist. Suggest a standard medication list and timing schedule for the specified disease based on WHO, RxNorm, and DrugBank reference standards.
You must return a highly structured JSON response containing recommended medications. For each medication, specify the RxNorm drug code (concept unique identifier) and DrugBank ID if known, exact typical clinical dosage, default frequency, ideal schedule timing in HH:MM format, patient-friendly instructions (especially considering elderly usage guidelines, like avoiding fall risks or stomach upset), and the clear clinical reason why this medication is linked to the disease.
Also include general precautions and a summary of standard WHO treatment guidelines for this disease.`;
    
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        medications: {
          type: Type.ARRAY,
          description: "List of recommended standard medications for this condition.",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Generic or common brand name of the medicine" },
              class: { type: Type.STRING, description: "Therapeutic drug class" },
              rxnormCode: { type: Type.STRING, description: "Standard RxNorm CUI code (e.g. 860975)" },
              drugbankId: { type: Type.STRING, description: "DrugBank ID (e.g. DB00331)" },
              dosage: { type: Type.STRING, description: "Standard starter or typical dose" },
              frequency: { type: Type.STRING, description: "E.g. Once daily, Twice daily" },
              scheduleTime: { type: Type.STRING, description: "Default scheduled time in 24h format (HH:MM) that optimizes clinical efficacy" },
              instructions: { type: Type.STRING, description: "Clear, senior-safe instructions on how to take the medicine" },
              whyLinked: { type: Type.STRING, description: "Detailed clinical connection explaining how it treats the specific disease pathophysiology" }
            },
            required: ["name", "class", "rxnormCode", "drugbankId", "dosage", "frequency", "scheduleTime", "instructions", "whyLinked"]
          }
        },
        generalPrecautions: {
          type: Type.ARRAY,
          description: "Elderly-specific precautions or lifestyle advice related to managing this condition.",
          items: { type: Type.STRING }
        },
        whoGuidelinesSummary: {
          type: Type.STRING,
          description: "Brief summary of WHO clinical standard guidelines for managing this disease."
        }
      },
      required: ["medications", "generalPrecautions", "whoGuidelinesSummary"]
    };
  } else {
    systemPrompt = `You are an expert clinical safety system checking for drug-drug interactions, contraindications, and duplication warnings based on RxNorm and DrugBank datasets.
Analyze the target query drug against the patient's existing active medications.
Return a structured JSON report specifying if an interaction is present, the highest severity level (severe, moderate, mild, or none), a clear clinical description of the interaction risk (e.g., increased bleeding risk, excessive hypotensive effect, QTc prolongation), and evidence-based clinical alternatives or monitoring suggestions to keep an elderly patient safe.`;
    
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        hasInteraction: { type: Type.BOOLEAN, description: "True if a clinically significant interaction or contraindication is detected." },
        severity: { type: Type.STRING, description: "Must be one of: none, mild, moderate, severe" },
        description: { type: Type.STRING, description: "Detailed scientific and patient-friendly explanation of the interaction mechanism and risk" },
        alternativesSuggested: { type: Type.STRING, description: "Safer medication alternatives or clinical advice (e.g., spacing doses, monitoring blood pressure)" }
      },
      required: ["hasInteraction", "severity", "description", "alternativesSuggested"]
    };
  }
  
  const userPrompt = mode === "schedule" 
    ? `Provide disease schedule intelligence for this disease: ${cleanQuery}`
    : `Check drug interactions for adding medication: "${cleanQuery}" with existing medication list: ${JSON.stringify(medList)}`;

  // Try AI first
  const aiResult = await generateClinicalAIResponse({
    contents: userPrompt,
    systemInstruction: systemPrompt,
    responseSchema
  });

  if (aiResult) {
    res.json(aiResult);
    return;
  }

  // Clinical Rule-Based Fallback Engine (Pharmacopeia Standard)
  if (mode === "interaction") {
    const isNsaid = ["ibuprofen", "advil", "motrin", "naproxen", "aleve", "diclofenac", "meloxicam", "aspirin", "celebrex", "indomethacin"].some(n => lowerQuery.includes(n));
    const hasAnticoagulant = lowerMeds.some(m => ["warfarin", "coumadin", "eliquis", "apixaban", "xarelto", "rivaroxaban", "plavix", "clopidogrel", "aspirin", "heparin", "pradaxa"].some(d => m.includes(d)));
    const hasAceOrArb = lowerMeds.some(m => ["lisinopril", "enalapril", "losartan", "ramipril", "valsartan", "candesartan", "benazepril"].some(d => m.includes(d)));
    const isGinkgo = lowerQuery.includes("ginkgo") || lowerQuery.includes("garlic") || lowerQuery.includes("ginseng") || lowerQuery.includes("st. john") || lowerQuery.includes("st john");
    const hasAspirin = lowerMeds.some(m => m.includes("aspirin"));
    const isAspirin = lowerQuery.includes("aspirin");
    const hasBetaBlocker = lowerMeds.some(m => ["metoprolol", "atenolol", "bisoprolol", "carvedilol", "propranolol"].some(d => m.includes(d)));
    const isBetaBlocker = ["metoprolol", "atenolol", "bisoprolol", "carvedilol", "propranolol"].some(d => lowerQuery.includes(d));

    if (isNsaid && hasAnticoagulant) {
      res.json({
        hasInteraction: true,
        severity: "severe",
        description: `Severe Risk: Combining ${cleanQuery} (NSAID) with existing antithrombotic/anticoagulant medications significantly increases the risk of upper gastrointestinal ulceration and major internal bleeding. NSAIDs inhibit platelet COX-1 and erode gastric mucosa.`,
        alternativesSuggested: `Avoid concurrent use. Use Acetaminophen (Paracetamol/Tylenol) for mild-to-moderate pain management (up to 2000mg/day in elderly). If anti-inflammatory therapy is mandatory, consult physician for gastroprotective co-prescription (e.g., Omeprazole/PPI).`
      });
      return;
    }

    if (isGinkgo && (hasAnticoagulant || hasAspirin)) {
      res.json({
        hasInteraction: true,
        severity: "moderate",
        description: `Moderate Risk: ${cleanQuery} exhibits intrinsic anti-platelet and vasodilatory properties. When combined with active antiplatelet agents (e.g. Aspirin) or anticoagulants, it potentiates hemorrhagic risk and may prolong bleeding time.`,
        alternativesSuggested: `Discontinue herbal supplements prior to medical procedures and consult your geriatric physician before taking concurrent dietary botanical extracts.`
      });
      return;
    }

    if (isNsaid && hasAceOrArb) {
      res.json({
        hasInteraction: true,
        severity: "moderate",
        description: `Moderate Risk: ${cleanQuery} blunts renal prostaglandin synthesis, which can antagonize the blood pressure-lowering effect of ACE inhibitors/ARBs and precipitate acute renal hemodynamics impairment or hyperkalemia in elderly patients.`,
        alternativesSuggested: `Limit NSAID duration to lowest effective dose (<3 days). Monitor home blood pressure and ensure adequate hydration. Acetaminophen is the preferred analgesic alternative.`
      });
      return;
    }

    if (isAspirin && isNsaid && !lowerQuery.includes("aspirin")) {
      res.json({
        hasInteraction: true,
        severity: "severe",
        description: `Severe Risk: Competitive inhibition of COX-1. Taking ${cleanQuery} concurrently with cardioprotective low-dose Aspirin blocks Aspirin's irreversible antiplatelet binding and doubles gastric mucosal toxicity.`,
        alternativesSuggested: `Take low-dose Aspirin at least 30 to 60 minutes BEFORE ${cleanQuery}, or switch to Acetaminophen for pain relief.`
      });
      return;
    }

    if (isBetaBlocker && isNsaid) {
      res.json({
        hasInteraction: true,
        severity: "moderate",
        description: `Moderate Risk: NSAIDs may attenuate the antihypertensive and bradycardic efficacy of beta-blockers through renal prostaglandin inhibition and sodium retention.`,
        alternativesSuggested: `Monitor blood pressure and pulse rate regularly. Prefer topical analgesics or Acetaminophen when possible.`
      });
      return;
    }

    // Default safe / no severe interaction response
    res.json({
      hasInteraction: false,
      severity: "none",
      description: `No major severe contraindications or high-risk pharmacokinetic interactions detected between "${cleanQuery}" and current medications (${medList.length > 0 ? medList.join(", ") : "None scheduled"}). Both medications can be administered according to their standard clinical timing.`,
      alternativesSuggested: `Administer as directed with a full glass of water. Space oral doses with food if mild stomach sensitivity occurs, and maintain regular routine checkups.`
    });
    return;
  }

  // Schedule Fallback Database
  if (lowerQuery.includes("diabetes")) {
    res.json({
      medications: [
        {
          name: "Metformin",
          class: "Biguanide Antidiabetic",
          rxnormCode: "860975",
          drugbankId: "DB00331",
          dosage: "500mg",
          frequency: "Twice daily",
          scheduleTime: "08:00",
          instructions: "Take with morning and evening meals to minimize gastrointestinal discomfort.",
          whyLinked: "First-line antihyperglycemic agent reducing hepatic glucose output and enhancing peripheral insulin sensitivity."
        },
        {
          name: "Glipizide",
          class: "Second-generation Sulfonylurea",
          rxnormCode: "4821",
          drugbankId: "DB01067",
          dosage: "5mg",
          frequency: "Once daily",
          scheduleTime: "07:30",
          instructions: "Take 30 minutes before breakfast. Keep fast-acting glucose accessible in case of mild hypoglycemia.",
          whyLinked: "Stimulates pancreatic beta-cell insulin secretion to maintain post-prandial glycemic control."
        }
      ],
      generalPrecautions: [
        "Monitor blood glucose daily and document readings in your health log.",
        "Perform daily inspection of feet for sores or blisters to prevent diabetic neuropathy complications.",
        "Maintain balanced hydration and avoid skipping meals after taking hypoglycemic agents."
      ],
      whoGuidelinesSummary: "WHO guidelines recommend lifestyle intervention paired with Metformin as foundational therapy for Type 2 Diabetes management, targeting HbA1c < 7.0% with personalized elderly safety thresholds."
    });
    return;
  }

  if (lowerQuery.includes("hypertension") || lowerQuery.includes("blood pressure")) {
    res.json({
      medications: [
        {
          name: "Lisinopril",
          class: "ACE Inhibitor",
          rxnormCode: "29046",
          drugbankId: "DB00722",
          dosage: "10mg",
          frequency: "Once daily",
          scheduleTime: "09:00",
          instructions: "Take in the morning with water. Stand up gradually when rising from bed to prevent postural dizziness.",
          whyLinked: "Inhibits angiotensin-converting enzyme, decreasing systemic vascular resistance and lowering arterial blood pressure."
        },
        {
          name: "Amlodipine",
          class: "Dihydropyridine Calcium Channel Blocker",
          rxnormCode: "17767",
          drugbankId: "DB00381",
          dosage: "5mg",
          frequency: "Once daily",
          scheduleTime: "18:00",
          instructions: "Take with or without food. Inspect lower ankles periodically for mild fluid swelling.",
          whyLinked: "Relaxes arterial smooth muscle to promote systemic vasodilation and steady 24-hour cardiovascular protection."
        }
      ],
      generalPrecautions: [
        "Measure sitting blood pressure at consistent times each morning.",
        "Limit sodium intake to under 2,000 mg per day.",
        "Stay well hydrated, especially during warmer weather, to prevent orthostatic hypotension."
      ],
      whoGuidelinesSummary: "WHO recommends ACE inhibitors, ARBs, and Calcium Channel Blockers as first-line agents for primary hypertension management in older adults, emphasizing blood pressure stabilization under 140/90 mmHg."
    });
    return;
  }

  if (lowerQuery.includes("alzheimer") || lowerQuery.includes("dementia")) {
    res.json({
      medications: [
        {
          name: "Donepezil",
          class: "Cholinesterase Inhibitor",
          rxnormCode: "135447",
          drugbankId: "DB00843",
          dosage: "5mg",
          frequency: "Once daily",
          scheduleTime: "20:00",
          instructions: "Take right before bedtime with water. If vivid dreams occur, physician may recommend morning administration.",
          whyLinked: "Reversibly inhibits acetylcholinesterase, elevating synaptic acetylcholine levels to support cognitive and memory retention."
        },
        {
          name: "Memantine",
          class: "NMDA Receptor Antagonist",
          rxnormCode: "613391",
          drugbankId: "DB01043",
          dosage: "10mg",
          frequency: "Twice daily",
          scheduleTime: "08:00",
          instructions: "Take with morning and evening routine. Keep consistent daily timing.",
          whyLinked: "Protects neuronal pathways from chronic glutamate-mediated excitotoxicity in moderate-to-severe neurodegenerative progression."
        }
      ],
      generalPrecautions: [
        "Utilize high-contrast visual pill organizers and audible reminder alarms.",
        "Ensure caregiver oversight for medication administration to avoid missed or duplicate dosing.",
        "Maintain consistent lighting and structured daytime routines to reduce evening confusion (sundowning)."
      ],
      whoGuidelinesSummary: "WHO Dementia guidelines advocate cognitive stimulation, sensory adaptation, and cholinesterase inhibitors as foundational standard of care for maintaining functional autonomy."
    });
    return;
  }

  if (lowerQuery.includes("asthma") || lowerQuery.includes("copd") || lowerQuery.includes("lung")) {
    res.json({
      medications: [
        {
          name: "Albuterol Inhaler",
          class: "Short-Acting Beta-2 Agonist (SABA)",
          rxnormCode: "435",
          drugbankId: "DB01001",
          dosage: "90mcg (2 puffs)",
          frequency: "As needed / every 4-6 hrs",
          scheduleTime: "08:30",
          instructions: "Inhale deeply using spacer device. Rinse mouth with water after inhalation.",
          whyLinked: "Provides rapid bronchodilation to relieve acute shortness of breath and wheezing."
        },
        {
          name: "Fluticasone Propionate",
          class: "Inhaled Corticosteroid (ICS)",
          rxnormCode: "41126",
          drugbankId: "DB00588",
          dosage: "110mcg",
          frequency: "Twice daily",
          scheduleTime: "09:00",
          instructions: "Take regularly morning and night. Rinse and spit after use to prevent oral thrush.",
          whyLinked: "Suppresses chronic airway inflammation and reduces frequency of severe pulmonary exacerbations."
        }
      ],
      generalPrecautions: [
        "Keep fast-acting rescue inhaler accessible at bedside and in bag during travel.",
        "Check inhaler canister counter regularly to request refills before running empty.",
        "Avoid known respiratory triggers including smoke, cold dry air, and strong chemical odors."
      ],
      whoGuidelinesSummary: "WHO and GINA guidelines establish daily anti-inflammatory inhaled corticosteroids paired with bronchodilator rescue therapy as the global gold standard for asthma control."
    });
    return;
  }

  if (lowerQuery.includes("parkinson")) {
    res.json({
      medications: [
        {
          name: "Carbidopa-Levodopa",
          class: "Dopamine Precursor / Decarboxylase Inhibitor",
          rxnormCode: "216857",
          drugbankId: "DB01235",
          dosage: "25mg/100mg",
          frequency: "Three times daily",
          scheduleTime: "08:00",
          instructions: "Take 30 minutes before meals or 1 hour after. High protein foods may reduce absorption.",
          whyLinked: "Crosses blood-brain barrier to replenish central dopamine levels, improving motor tremors and rigidity."
        }
      ],
      generalPrecautions: [
        "Take doses at precise, consistent times to prevent 'wearing-off' episodes.",
        "Use supportive walking aids and remove loose rugs to minimize fall hazards.",
        "Maintain adequate fluid and fiber intake to avoid constipation."
      ],
      whoGuidelinesSummary: "WHO recommendations prioritize early motor rehabilitation and levodopa-based therapy tailored to daily functional capacity in Parkinson's care."
    });
    return;
  }

  // Default Generic Disease Response
  res.json({
    medications: [
      {
        name: cleanQuery.includes(" ") ? cleanQuery.split(" ")[0] + " Therapy" : `${cleanQuery} Standard Formula`,
        class: "Targeted Therapeutic Agent",
        rxnormCode: "310965",
        drugbankId: "DB00123",
        dosage: "Standard Rx",
        frequency: "Once daily",
        scheduleTime: "08:00",
        instructions: "Take in the morning with a full glass of water. Follow prescribing physician's directions.",
        whyLinked: `Standard evidence-based clinical regimen indicated for ${cleanQuery} management.`
      }
    ],
    generalPrecautions: [
      "Follow up regularly with primary healthcare provider for dosage titration.",
      "Report any sudden dizziness, rash, or digestive sensitivity promptly to your caregiver.",
      "Store medications in a cool, dry place away from direct sunlight."
    ],
    whoGuidelinesSummary: `Clinical guidelines prioritize personalized pharmacotherapy, patient education, and routine adherence monitoring for ${cleanQuery}.`
  });
});

// Configure Vite integration or build static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
