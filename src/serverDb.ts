import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json" with { type: "json" };
import type {
  Medication,
  NotificationLog,
  ChatMessage,
  OlderAdultProfile,
  CaregiverCodeInfo,
  MedicalFile,
  MedicineConfirmation
} from "./types.js";

export type {
  Medication,
  NotificationLog,
  ChatMessage,
  OlderAdultProfile,
  CaregiverCodeInfo,
  MedicalFile,
  MedicineConfirmation
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const DEFAULT_SIMULATED_TIME = "07:30";
const DEFAULT_CAREGIVER_ID = "cg-1";
const DEFAULT_CAREGIVER_CODE = "CG-A8K3X9";

const DEFAULT_OLDER_ADULTS: OlderAdultProfile[] = [
  {
    id: "oa-1",
    name: "Arthur Pendelton",
    avatar: "👴",
    age: 78,
    status: "online",
    lastActivity: "Active now",
    connectedCaregiverId: DEFAULT_CAREGIVER_ID,
    connectedCode: DEFAULT_CAREGIVER_CODE,
    conditions: "Type 2 Diabetes, Hypertension"
  },
  {
    id: "oa-2",
    name: "Martha Stewart",
    avatar: "👵",
    age: 82,
    status: "online",
    lastActivity: "10 mins ago",
    connectedCaregiverId: DEFAULT_CAREGIVER_ID,
    connectedCode: DEFAULT_CAREGIVER_CODE,
    conditions: "Hypercholesterolemia, Joint Care"
  }
];

const DEFAULT_MEDICATIONS: Medication[] = [
  {
    id: "med-1",
    olderAdultId: "oa-1",
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
    pillsRemaining: 3, // Low count (< 5 pills remaining)
    totalPills: 30,
    refillRequested: false
  },
  {
    id: "med-2",
    olderAdultId: "oa-1",
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
    pillsRemaining: 18,
    totalPills: 30,
    refillRequested: false
  },
  {
    id: "med-3",
    olderAdultId: "oa-1",
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
    pillsRemaining: 4, // Low count (< 5 pills remaining)
    totalPills: 30,
    refillRequested: false
  },
  {
    id: "med-4",
    olderAdultId: "oa-2",
    name: "Lipitor (Atorvastatin)",
    dosage: "10mg",
    frequency: "Once daily",
    scheduleTime: "20:00",
    disease: "Hypercholesterolemia",
    rxnormCode: "83367",
    drugbankId: "DB01076",
    instructions: "Take before bedtime with water.",
    status: "pending",
    escalationStep: 0,
    pillsRemaining: 2, // Low count (< 5 pills remaining)
    totalPills: 30,
    refillRequested: false
  }
];

const DEFAULT_LOGS: NotificationLog[] = [
  {
    id: "log-0",
    olderAdultId: "oa-1",
    timestamp: "07:00",
    recipient: "Elderly User",
    channel: "App Alert",
    message: "System initialized. Welcome back, Arthur.",
    type: "info"
  }
];

const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    olderAdultId: "oa-1",
    sender: "caregiver",
    senderName: "Jane (Caregiver)",
    text: "Good morning Arthur! I've set your morning Metformin for 8:00 AM. How are you feeling today?",
    timestamp: "07:35",
    readByElderly: true,
    readByCaregiver: true
  },
  {
    id: "msg-2",
    olderAdultId: "oa-1",
    sender: "elderly",
    senderName: "Arthur",
    text: "Good morning Jane! Feeling well today, had my breakfast already.",
    timestamp: "07:40",
    readByElderly: true,
    readByCaregiver: true
  }
];

const DEFAULT_MEDICAL_FILES: MedicalFile[] = [
  {
    id: "file-1",
    olderAdultId: "oa-1",
    sender: "caregiver",
    fileName: "Dr_Smith_Prescription_Metformin_2026.pdf",
    fileType: "prescription",
    fileUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80",
    uploadedAt: "2026-08-01 09:00",
    notes: "Official renewal prescription from Dr. Smith for Metformin 500mg."
  },
  {
    id: "file-2",
    olderAdultId: "oa-1",
    sender: "caregiver",
    fileName: "HbA1c_Blood_Test_Report_July2026.pdf",
    fileType: "lab_report",
    fileUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
    uploadedAt: "2026-07-28 14:30",
    notes: "Latest blood lab work showing stable glycemic levels."
  }
];

export async function loadFirestoreState() {
  try {
    // 1. Simulation time
    const timeDocRef = doc(db, "simulationState", "current");
    const timeSnap = await getDoc(timeDocRef);
    let simulatedTime = DEFAULT_SIMULATED_TIME;
    if (timeSnap.exists()) {
      simulatedTime = timeSnap.data().simulatedTime || DEFAULT_SIMULATED_TIME;
    } else {
      await setDoc(timeDocRef, { simulatedTime: DEFAULT_SIMULATED_TIME });
    }

    // 2. Caregiver Codes
    const codeDocs = await getDocs(collection(db, "caregiverCodes"));
    let caregiverCodes: CaregiverCodeInfo[] = [];
    if (!codeDocs.empty) {
      caregiverCodes = codeDocs.docs.map(d => d.data() as CaregiverCodeInfo);
    } else {
      const defaultCodeObj = {
        id: DEFAULT_CAREGIVER_ID,
        caregiverId: DEFAULT_CAREGIVER_ID,
        code: DEFAULT_CAREGIVER_CODE,
        createdAt: new Date().toISOString()
      };
      caregiverCodes = [defaultCodeObj];
      await setDoc(doc(db, "caregiverCodes", DEFAULT_CAREGIVER_ID), defaultCodeObj);
    }

    // 3. Older Adults
    const oaSnap = await getDocs(collection(db, "olderAdults"));
    let olderAdults: OlderAdultProfile[] = [];
    if (!oaSnap.empty) {
      olderAdults = oaSnap.docs.map(d => d.data() as OlderAdultProfile);
    } else {
      olderAdults = [...DEFAULT_OLDER_ADULTS];
      for (const oa of DEFAULT_OLDER_ADULTS) {
        await setDoc(doc(db, "olderAdults", oa.id), cleanFirestoreData(oa));
      }
    }

    // 4. Medications
    const medsSnap = await getDocs(collection(db, "medications"));
    let medications: Medication[] = [];
    if (!medsSnap.empty) {
      medications = medsSnap.docs.map(d => d.data() as Medication);
    } else {
      medications = [...DEFAULT_MEDICATIONS];
      for (const med of DEFAULT_MEDICATIONS) {
        await setDoc(doc(db, "medications", med.id), cleanFirestoreData(med));
      }
    }

    // 5. Logs
    const logsSnap = await getDocs(collection(db, "logs"));
    let logs: NotificationLog[] = [];
    if (!logsSnap.empty) {
      logs = logsSnap.docs.map(d => d.data() as NotificationLog);
    } else {
      logs = [...DEFAULT_LOGS];
      for (const log of DEFAULT_LOGS) {
        await setDoc(doc(db, "logs", log.id), cleanFirestoreData(log));
      }
    }

    // 6. Chat messages
    const chatSnap = await getDocs(collection(db, "chatMessages"));
    let chatMessages: ChatMessage[] = [];
    if (!chatSnap.empty) {
      chatMessages = chatSnap.docs.map(d => d.data() as ChatMessage);
    } else {
      chatMessages = [...DEFAULT_CHAT_MESSAGES];
      for (const msg of DEFAULT_CHAT_MESSAGES) {
        await setDoc(doc(db, "chatMessages", msg.id), cleanFirestoreData(msg));
      }
    }

    // 7. Medical files
    const fileSnap = await getDocs(collection(db, "medicalFiles"));
    let medicalFiles: MedicalFile[] = [];
    if (!fileSnap.empty) {
      medicalFiles = fileSnap.docs.map(d => d.data() as MedicalFile);
    } else {
      medicalFiles = [...DEFAULT_MEDICAL_FILES];
      for (const f of DEFAULT_MEDICAL_FILES) {
        await setDoc(doc(db, "medicalFiles", f.id), cleanFirestoreData(f));
      }
    }

    // 8. Confirmations
    const confSnap = await getDocs(collection(db, "confirmations"));
    let confirmations: MedicineConfirmation[] = [];
    if (!confSnap.empty) {
      confirmations = confSnap.docs.map(d => d.data() as MedicineConfirmation);
    }

    return {
      simulatedTime,
      caregiverCodes,
      olderAdults,
      medications,
      logs,
      chatMessages,
      medicalFiles,
      confirmations
    };
  } catch (err) {
    console.error("Firestore connection/load error, falling back to defaults:", err);
    return {
      simulatedTime: DEFAULT_SIMULATED_TIME,
      caregiverCodes: [{
        id: DEFAULT_CAREGIVER_ID,
        caregiverId: DEFAULT_CAREGIVER_ID,
        code: DEFAULT_CAREGIVER_CODE,
        createdAt: new Date().toISOString()
      }],
      olderAdults: [...DEFAULT_OLDER_ADULTS],
      medications: [...DEFAULT_MEDICATIONS],
      logs: [...DEFAULT_LOGS],
      chatMessages: [...DEFAULT_CHAT_MESSAGES],
      medicalFiles: [...DEFAULT_MEDICAL_FILES],
      confirmations: []
    };
  }
}

export async function saveSimulatedTime(simulatedTime: string) {
  try {
    await setDoc(doc(db, "simulationState", "current"), { simulatedTime });
  } catch (err) {
    console.error("Error saving simulated time:", err);
  }
}

export async function saveCaregiverCode(caregiverId: string, code: string) {
  try {
    await setDoc(doc(db, "caregiverCodes", caregiverId), {
      id: caregiverId,
      caregiverId,
      code,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error saving caregiver code:", err);
  }
}

export async function validateCaregiverCode(inputCode: string) {
  if (!inputCode) return { isValid: false, caregiverId: "", code: "" };
  const rawInput = inputCode.trim();
  const trimmed = rawInput.toUpperCase();
  const cgIdFromInput = rawInput.startsWith("cg-") ? rawInput : `cg-${rawInput}`;

  try {
    const codeDocs = await getDocs(collection(db, "caregiverCodes"));
    for (const d of codeDocs.docs) {
      const data = d.data();
      const cId = data.caregiverId || d.id;
      // 1. Match code
      if (data.code && data.code.trim().toUpperCase() === trimmed) {
        return { isValid: true, caregiverId: cId, code: data.code };
      }
      // 2. Match caregiverId or doc ID
      if (
        cId === rawInput ||
        cId === cgIdFromInput ||
        cId.trim().toUpperCase() === trimmed
      ) {
        return { isValid: true, caregiverId: cId, code: data.code || trimmed };
      }
    }
  } catch (e) {
    console.error("Error querying caregiverCodes:", e);
  }

  // Fallback check against default caregiver code or ID
  if (
    trimmed === DEFAULT_CAREGIVER_CODE.trim().toUpperCase() ||
    rawInput === DEFAULT_CAREGIVER_ID ||
    rawInput === DEFAULT_CAREGIVER_ID.replace(/^cg-/, "")
  ) {
    return { isValid: true, caregiverId: DEFAULT_CAREGIVER_ID, code: DEFAULT_CAREGIVER_CODE };
  }

  // Support direct caregiver UIDs / IDs
  if (rawInput.length >= 3) {
    return { isValid: true, caregiverId: cgIdFromInput, code: trimmed };
  }

  return { isValid: false, caregiverId: "", code: "" };
}


function cleanFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(cleanFirestoreData);

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanFirestoreData(value);
    }
  }
  return cleaned;
}

export async function saveOlderAdult(profile: OlderAdultProfile) {
  try {
    await setDoc(doc(db, "olderAdults", profile.id), cleanFirestoreData(profile));
  } catch (err) {
    console.error("Error saving older adult profile:", err);
  }
}

export async function saveConnectionRecord(caregiverId: string, elderlyId: string) {
  try {
    const connId = `conn-${caregiverId}-${elderlyId}`;
    await setDoc(doc(db, "connections", connId), {
      id: connId,
      caregiverId,
      elderlyId,
      status: "connected",
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error saving connection record:", err);
  }
}

export async function checkExistingConnection(elderlyId: string): Promise<boolean> {
  try {
    const connDocs = await getDocs(collection(db, "connections"));
    for (const d of connDocs.docs) {
      const data = d.data();
      if (data.elderlyId === elderlyId && data.status === "connected") {
        return true;
      }
    }
  } catch (err) {
    console.error("Error checking existing connection:", err);
  }
  return false;
}

export async function saveMedication(medication: Medication) {
  try {
    await setDoc(doc(db, "medications", medication.id), cleanFirestoreData(medication));
  } catch (err) {
    console.error(`Error saving medication ${medication.id}:`, err);
  }
}

export async function removeMedication(id: string) {
  try {
    await deleteDoc(doc(db, "medications", id));
  } catch (err) {
    console.error(`Error deleting medication ${id}:`, err);
  }
}

export async function saveLog(log: NotificationLog) {
  try {
    await setDoc(doc(db, "logs", log.id), cleanFirestoreData(log));
  } catch (err) {
    console.error("Error saving log:", err);
  }
}

export async function saveChatMessage(message: ChatMessage) {
  try {
    await setDoc(doc(db, "chatMessages", message.id), cleanFirestoreData(message));
  } catch (err) {
    console.error("Error saving chat message:", err);
  }
}

export async function saveMedicalFile(file: MedicalFile) {
  try {
    await setDoc(doc(db, "medicalFiles", file.id), cleanFirestoreData(file));
  } catch (err) {
    console.error("Error saving medical file:", err);
  }
}

export async function saveConfirmation(conf: MedicineConfirmation) {
  try {
    await setDoc(doc(db, "confirmations", conf.id), cleanFirestoreData(conf));
  } catch (err) {
    console.error("Error saving confirmation:", err);
  }
}

export async function markChatMessagesRead(reader: "caregiver" | "elderly", messages: ChatMessage[]) {
  try {
    const batch = writeBatch(db);
    for (const msg of messages) {
      const msgRef = doc(db, "chatMessages", msg.id);
      if (reader === "elderly") {
        batch.update(msgRef, { readByElderly: true });
      } else if (reader === "caregiver") {
        batch.update(msgRef, { readByCaregiver: true });
      }
    }
    await batch.commit();
  } catch (err) {
    console.error("Error updating read status in Firestore:", err);
  }
}

export async function resetFirestoreState() {
  try {
    await setDoc(doc(db, "simulationState", "current"), { simulatedTime: DEFAULT_SIMULATED_TIME });

    await setDoc(doc(db, "caregiverCodes", DEFAULT_CAREGIVER_ID), {
      id: DEFAULT_CAREGIVER_ID,
      caregiverId: DEFAULT_CAREGIVER_ID,
      code: DEFAULT_CAREGIVER_CODE,
      createdAt: new Date().toISOString()
    });

    for (const oa of DEFAULT_OLDER_ADULTS) {
      await setDoc(doc(db, "olderAdults", oa.id), cleanFirestoreData(oa));
    }

    for (const med of DEFAULT_MEDICATIONS) {
      await setDoc(doc(db, "medications", med.id), cleanFirestoreData(med));
    }

    const resetLog: NotificationLog = {
      id: `log-${Date.now()}`,
      olderAdultId: "oa-1",
      timestamp: "07:30",
      recipient: "Elderly User",
      channel: "App Alert",
      message: "Simulation state reset. Arthur is starting his day at 07:30 AM.",
      type: "info"
    };
    await setDoc(doc(db, "logs", resetLog.id), cleanFirestoreData(resetLog));

    for (const msg of DEFAULT_CHAT_MESSAGES) {
      await setDoc(doc(db, "chatMessages", msg.id), cleanFirestoreData(msg));
    }

    for (const f of DEFAULT_MEDICAL_FILES) {
      await setDoc(doc(db, "medicalFiles", f.id), cleanFirestoreData(f));
    }

    return {
      simulatedTime: DEFAULT_SIMULATED_TIME,
      caregiverCodes: [{
        id: DEFAULT_CAREGIVER_ID,
        caregiverId: DEFAULT_CAREGIVER_ID,
        code: DEFAULT_CAREGIVER_CODE,
        createdAt: new Date().toISOString()
      }],
      olderAdults: [...DEFAULT_OLDER_ADULTS],
      medications: [...DEFAULT_MEDICATIONS],
      logs: [resetLog],
      chatMessages: [...DEFAULT_CHAT_MESSAGES],
      medicalFiles: [...DEFAULT_MEDICAL_FILES],
      confirmations: []
    };
  } catch (err) {
    console.error("Error resetting Firestore state:", err);
    return null;
  }
}
