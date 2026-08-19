export interface Medication {
  id: string;
  olderAdultId?: string;
  name: string;
  dosage: string;
  frequency: string;
  scheduleTime: string; // "HH:MM"
  disease: string;
  rxnormCode: string;
  drugbankId: string;
  instructions: string;
  status: "pending" | "taken" | "missed" | "escalated";
  lastActionTime?: string;
  escalationStep: 0 | 1 | 2 | 3; // 0 = None, 1 = Elderly SMS/Voice, 2 = Caregiver SMS Alert, 3 = Health Worker Critical Alert
  pillsRemaining?: number;
  totalPills?: number;
  refillRequested?: boolean;
}

export interface NotificationLog {
  id: string;
  olderAdultId?: string;
  timestamp: string; // "HH:MM"
  recipient: string;
  channel: "SMS" | "Voice Call" | "App Alert";
  message: string;
  type: "info" | "warning" | "critical";
}

export interface ChatMessage {
  id: string;
  olderAdultId?: string;
  sender: "caregiver" | "elderly" | "system";
  senderName: string;
  text: string;
  timestamp: string; // "HH:MM"
  readByElderly?: boolean;
  readByCaregiver?: boolean;
  isVoice?: boolean;
  fileUrl?: string;
  fileName?: string;
}

export interface OlderAdultProfile {
  id: string;
  name: string;
  avatar: string;
  age: number;
  status: "online" | "offline";
  lastActivity: string;
  connectedCaregiverId?: string | null;
  connectedCaregiverName?: string | null;
  connectedCode?: string | null;
  conditions?: string;
}

export interface CaregiverCodeInfo {
  id: string;
  caregiverId: string;
  code: string;
  createdAt: string;
}

export interface MedicalFile {
  id: string;
  olderAdultId: string;
  sender: "caregiver" | "elderly";
  fileName: string;
  fileType: "prescription" | "lab_report" | "pdf" | "image";
  fileUrl: string;
  uploadedAt: string;
  notes?: string;
}

export interface MedicineConfirmation {
  id: string;
  olderAdultId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  takenTime: string;
  date: string;
  status: "taken" | "missed";
}

export interface StateResponse {
  simulatedTime: string;
  medications: Medication[];
  logs: NotificationLog[];
  chatMessages: ChatMessage[];
  caregiverCode?: string;
  olderAdults?: OlderAdultProfile[];
  activeOlderAdultId?: string;
  medicalFiles?: MedicalFile[];
  confirmations?: MedicineConfirmation[];
}

export interface DiseaseIntelligenceResponse {
  medications: Array<{
    name: string;
    class: string;
    rxnormCode: string;
    drugbankId: string;
    dosage: string;
    frequency: string;
    scheduleTime: string;
    instructions: string;
    whyLinked: string;
  }>;
  generalPrecautions: string[];
  whoGuidelinesSummary: string;
}

export interface InteractionResponse {
  hasInteraction: boolean;
  severity: "none" | "mild" | "moderate" | "severe";
  description: string;
  alternativesSuggested: string;
}

export type AlarmSoundType = "gentle_chime" | "medical_beep" | "zen_bell" | "vital_pulse" | "voice_alert";

export interface AlarmItem {
  id: string;
  title: string;
  medicationId?: string;
  olderAdultId?: string;
  scheduleType: "daily" | "exact_datetime" | "specific_days";
  time: string; // "HH:MM" or "HH:MM:SS" (24h format internally, formatted for display)
  targetDate?: string; // "YYYY-MM-DD" for exact_datetime
  daysOfWeek?: number[]; // [0, 1, 2, 3, 4, 5, 6] (0 = Sunday)
  sound: AlarmSoundType;
  volume: number; // 0.1 to 1.0
  vibrate: boolean;
  enabled: boolean;
  label?: string;
  dosage?: string;
  instructions?: string;
  snoozeCount: number;
  lastTriggered?: string;
  nextTriggerEpoch: number; // Exact millisecond UNIX timestamp
  createdAt: string;
  updatedAt: string;
}

