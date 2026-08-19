export type Language = "en" | "es" | "hi" | "zh" | "te";

export interface TranslationSchema {
  // Common
  appName: string;
  elderlyMode: string;
  caregiverMode: string;
  diseaseIntelligence: string;
  systemSimulation: string;
  simulatedTime: string;
  startingReference: string;
  fastForward: string;
  tips: string;
  allDone: string;
  footerText: string;

  // Caregiver view
  activeSchedules: string;
  takenToday: string;
  missedAlerts: string;
  escalatedToDoctor: string;
  adherenceRoster: string;
  rosterDescription: string;
  medication: string;
  schedule: string;
  adherenceStatus: string;
  escalationPhase: string;
  actions: string;
  noMeds: string;
  reviewerNote: string;
  triggerStep: string;
  addManual: string;
  registerSchedule: string;
  drugName: string;
  dosage: string;
  scheduleTime: string;
  condition: string;
  seniorInstructions: string;

  // Elderly view
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  timeIsNow: string;
  overdue: string;
  nextScheduled: string;
  instructionsForArthur: string;
  treatingCondition: string;
  readAloud: string;
  stopVoice: string;
  yesITookIt: string;
  allMedsTakenTitle: string;
  allMedsTakenDesc: string;
  remainingSchedule: string;
  done: string;

  // Clinical Intel
  clinicalIntelTitle: string;
  clinicalIntelDesc: string;
  searchDisease: string;
  analyzeBtn: string;
  quickSearch: string;
  evalDrugSafety: string;
  evalDescription: string;
  checkSafetyBtn: string;
  quickCheck: string;
  addMedToArthur: string;
  analysisComplete: string;
  recommendedMeds: string;
  clinicalRationale: string;
  rxnormCode: string;
  drugbankId: string;
  safetyPrecautions: string;
  drugSafetyTitle: string;
  safetyRecommendation: string;
  speakHello: string;
  speakDose: string;
  speakInstruction: string;
  speakPressButton: string;

  // Chat
  chatMode: string;
  goToChat: string;
  medicationsTab: string;
  chatTab: string;
  caregiverChatTitle: string;
  caregiverChatSubtitle: string;
  elderlyChatTitle: string;
  elderlyChatSubtitle: string;
  chatPlaceholder: string;
  sendMessage: string;
  quickCheckIn: string;
  quickRepliesElderly: string;
  caregiverQuickMsg1: string;
  caregiverQuickMsg2: string;
  caregiverQuickMsg3: string;
  caregiverQuickMsg4: string;
  elderlyQuickMsg1: string;
  elderlyQuickMsg2: string;
  elderlyQuickMsg3: string;
  elderlyQuickMsg4: string;
  readAloudChat: string;
  unreadCount: string;

  // Connection & Medical Files
  connectionCodeTitle: string;
  copyCode: string;
  codeCopied: string;
  resetCode: string;
  connectedSeniors: string;
  connectToCaregiver: string;
  enterConnectionCode: string;
  verifyAndConnect: string;
  connectionActive: string;
  disconnect: string;
  medicalReportsAndFiles: string;
  uploadReport: string;
  prescriptions: string;
  medicationConfirmations: string;
  switchPatient: string;
  activePatient: string;
}

export const translations: Record<Language, TranslationSchema> = {
  en: {
    appName: "Medication Adherence App",
    elderlyMode: "Elderly App (Arthur)",
    caregiverMode: "Caregiver Dashboard",
    diseaseIntelligence: "Disease-Dataset Intelligence Enabled",
    systemSimulation: "System Simulation Control",
    simulatedTime: "Simulated Virtual Time",
    startingReference: "Starting reference: 07:30 AM",
    fastForward: "Fast-Forward Simulated Time:",
    tips: "Tips: Metformin triggers at 08:00, Lisinopril at 09:00. Advance time to trigger missed-dose alert!",
    allDone: "System offline or reset",
    footerText: "© 2026 Medication Adherence App • Clinically Aligned with WHO, RxNorm, & DrugBank datasets.",
    
    activeSchedules: "Active Schedules",
    takenToday: "Taken Today",
    missedAlerts: "Missed (Caregiver Alert)",
    escalatedToDoctor: "Escalated to Doctor",
    adherenceRoster: "Active Adherence Roster",
    rosterDescription: "Real-time status monitoring of Arthur's medication list",
    medication: "Medication",
    schedule: "Schedule",
    adherenceStatus: "Adherence Status",
    escalationPhase: "Escalation Phase",
    actions: "Actions",
    noMeds: "No medications registered. Query Clinical Intelligence below or fill the form to add!",
    reviewerNote: "Reviewer Note: You can click the \"Trigger Step\" button for any medication above to force-escalate its state immediately (Step 1 ➔ Step 2 ➔ Step 3). This lets you test the multi-channel notification stream on the right without waiting for real virtual time progression!",
    triggerStep: "Trigger Step",
    addManual: "Add Schedule Manual",
    registerSchedule: "Register Schedule",
    drugName: "Drug Name",
    dosage: "Dosage",
    scheduleTime: "Schedule Time",
    condition: "Target Disease/Condition",
    seniorInstructions: "Senior-Safe Instructions",

    goodMorning: "Good morning, Arthur",
    goodAfternoon: "Good afternoon, Arthur",
    goodEvening: "Good evening, Arthur",
    timeIsNow: "The time is now",
    overdue: "Dose is Overdue!",
    nextScheduled: "Next Scheduled Medication",
    instructionsForArthur: "Instructions for Arthur",
    treatingCondition: "Treating condition",
    readAloud: "Read Aloud 🔊",
    stopVoice: "Stop Voice",
    yesITookIt: "YES, I TOOK IT!",
    allMedsTakenTitle: "All Meds Taken!",
    allMedsTakenDesc: "Great job, Arthur! You are all done with your scheduled medications for now. Keep resting!",
    remainingSchedule: "Today's Remaining Schedule",
    done: "✓ Done",

    clinicalIntelTitle: "Clinical Disease & Dataset Intelligence",
    clinicalIntelDesc: "Query standard WHO-aligned regimens, RxNorm concept IDs, DrugBank references, and evaluate safety interactions in real-time.",
    searchDisease: "1. Search Disease-Linked Regimens",
    analyzeBtn: "Analyze",
    quickSearch: "Quick Search",
    evalDrugSafety: "2. Evaluate Drug-Drug Interactions",
    evalDescription: "Check potential interactions, safety warnings, or duplicates for adding a medicine against Arthur's existing regimen:",
    checkSafetyBtn: "Check Safety",
    quickCheck: "Quick Check",
    addMedToArthur: "Add to Arthur",
    analysisComplete: "Analysis Complete",
    recommendedMeds: "Recommended Medications",
    clinicalRationale: "Clinical Rationale",
    rxnormCode: "RxNorm Code",
    drugbankId: "DrugBank ID",
    safetyPrecautions: "Senior Precautions & Warnings",
    drugSafetyTitle: "Drug safety analysis",
    safetyRecommendation: "Clinical Safety Recommendation",
    speakHello: "Hello Arthur, it is time to take your {medName}.",
    speakDose: "Your dose size is {dosage}.",
    speakInstruction: "The instruction is: {instructions}.",
    speakPressButton: "Please press the large green button below after taking it.",

    // Chat
    chatMode: "Direct Chat 💬",
    goToChat: "Open Chat Window",
    medicationsTab: "Medications & Schedule",
    chatTab: "Caregiver & Senior Chat",
    caregiverChatTitle: "Direct Caregiver & Senior Chat",
    caregiverChatSubtitle: "Instant messaging between Jane (Caregiver) and Arthur",
    elderlyChatTitle: "Chat with Jane (Caregiver) 💬",
    elderlyChatSubtitle: "Send quick messages, voice notes, or questions to your caregiver",
    chatPlaceholder: "Type your message here...",
    sendMessage: "Send",
    quickCheckIn: "Quick Check-in Suggestions",
    quickRepliesElderly: "Quick Senior Tap Messages",
    caregiverQuickMsg1: "Did you take your morning medication?",
    caregiverQuickMsg2: "How are you feeling right now, Arthur?",
    caregiverQuickMsg3: "Please remember to drink a full glass of water with your dose.",
    caregiverQuickMsg4: "Great job staying on schedule today! ❤️",
    elderlyQuickMsg1: "I took my medicine! 👍",
    elderlyQuickMsg2: "I am feeling good today 😊",
    elderlyQuickMsg3: "Can you call me please? 📞",
    elderlyQuickMsg4: "I need help or feel unwell 🚨",
    readAloudChat: "Read Aloud 🔊",
    unreadCount: "Unread Messages",

    connectionCodeTitle: "Permanent Caregiver Connection Code",
    copyCode: "Copy Code",
    codeCopied: "Copied!",
    resetCode: "Regenerate Code",
    connectedSeniors: "Connected Older Adults",
    connectToCaregiver: "Connect to Caregiver",
    enterConnectionCode: "Enter Caregiver Code (e.g. CG-A8K3X9)",
    verifyAndConnect: "Verify & Connect",
    connectionActive: "Connected to Caregiver",
    disconnect: "Disconnect",
    medicalReportsAndFiles: "Shared Medical Reports & Prescriptions",
    uploadReport: "Upload File / Report",
    prescriptions: "Prescriptions",
    medicationConfirmations: "Medication Confirmations",
    switchPatient: "Switch Patient",
    activePatient: "Active Patient"
  },
  es: {
    appName: "Aplicación de Adherencia de Medicamentos",
    elderlyMode: "Aplicación para Ancianos (Arthur)",
    caregiverMode: "Panel de Cuidador",
    diseaseIntelligence: "Inteligencia de Enfermedades y Conjunto de Datos Activada",
    systemSimulation: "Control de Simulación del Sistema",
    simulatedTime: "Tiempo Virtual Simulado",
    startingReference: "Referencia de inicio: 07:30 AM",
    fastForward: "Adelantar tiempo simulado:",
    tips: "Consejos: Metformin se activa a las 08:00, Lisinopril a las 09:00. ¡Adelante el tiempo para activar la alerta por dosis omitida!",
    allDone: "Sistema fuera de línea o restablecido",
    footerText: "© 2026 Aplicación de Adherencia de Medicamentos • Alineada clínicamente con los conjuntos de datos de la OMS, RxNorm y DrugBank.",
    
    activeSchedules: "Horarios Activos",
    takenToday: "Tomado Hoy",
    missedAlerts: "Omitido (Alerta del Cuidador)",
    escalatedToDoctor: "Escalado al Médico",
    adherenceRoster: "Lista Activa de Adherencia",
    rosterDescription: "Monitoreo del estado en tiempo real de la lista de medicamentos de Arthur",
    medication: "Medicamento",
    schedule: "Horario",
    adherenceStatus: "Estado de Adherencia",
    escalationPhase: "Fase de Escalada",
    actions: "Acciones",
    noMeds: "No hay medicamentos registrados. ¡Consulte Inteligencia Clínica a continuación o complete el formulario para agregar!",
    reviewerNote: "Nota del revisor: Puede hacer clic en el botón \"Trigger Step\" de cualquier medicamento anterior para forzar la escalada de su estado de inmediato (Paso 1 ➔ Paso 2 ➔ Paso 3). ¡Esto le permite probar el flujo de notificaciones multicanal de la derecha sin esperar el progreso del tiempo virtual real!",
    triggerStep: "Provocar Paso",
    addManual: "Agregar Horario Manualmente",
    registerSchedule: "Registrar Horario",
    drugName: "Nombre del Medicamento",
    dosage: "Dosis",
    scheduleTime: "Hora de Horario",
    condition: "Enfermedad / Condición Objetivo",
    seniorInstructions: "Instrucciones de Seguridad para Ancianos",

    goodMorning: "Buenos días, Arthur",
    goodAfternoon: "Buenas tardes, Arthur",
    goodEvening: "Buenas noches, Arthur",
    timeIsNow: "La hora actual es",
    overdue: "¡La dosis está retrasada!",
    nextScheduled: "Siguiente Medicamento Programado",
    instructionsForArthur: "Instrucciones para Arthur",
    treatingCondition: "Tratando la condición",
    readAloud: "Leer en voz alta 🔊",
    stopVoice: "Detener Voz",
    yesITookIt: "¡SÍ, ME LO TOMÉ!",
    allMedsTakenTitle: "¡Todos tomados!",
    allMedsTakenDesc: "¡Buen trabajo, Arthur! Ya terminó con sus medicamentos programados por ahora. ¡Siga descansando!",
    remainingSchedule: "Horario Restante de Hoy",
    done: "✓ Hecho",

    clinicalIntelTitle: "Inteligencia Clínica de Enfermedades y Conjunto de Datos",
    clinicalIntelDesc: "Consulte regímenes estándar alineados con la OMS, ID de conceptos RxNorm, referencias de DrugBank y evalúe las interacciones de seguridad en tiempo real.",
    searchDisease: "1. Buscar Regímenes Vinculados a Enfermedades",
    analyzeBtn: "Analizar",
    quickSearch: "Búsqueda rápida",
    evalDrugSafety: "2. Evaluar Interacciones de Medicamentos",
    evalDescription: "Verifique posibles interacciones, advertencias de seguridad o duplicados al agregar un medicamento contra el régimen actual de Arthur:",
    checkSafetyBtn: "Verificar Seguridad",
    quickCheck: "Verificación Rápida",
    addMedToArthur: "Añadir a Arthur",
    analysisComplete: "Análisis Completo",
    recommendedMeds: "Medicamentos Recomendados",
    clinicalRationale: "Justificación Clínica",
    rxnormCode: "Código RxNorm",
    drugbankId: "ID de DrugBank",
    safetyPrecautions: "Precauciones y Advertencias para Ancianos",
    drugSafetyTitle: "Análisis de seguridad del medicamento",
    safetyRecommendation: "Recomendación de Seguridad Clínica",
    speakHello: "Hola Arthur, es hora de tomar tu {medName}.",
    speakDose: "Tu dosis es {dosage}.",
    speakInstruction: "La instrucción es: {instructions}.",
    speakPressButton: "Por favor, presiona el botón verde grande de abajo después de tomarla.",

    // Chat
    chatMode: "Chat Directo 💬",
    goToChat: "Abrir Ventana de Chat",
    medicationsTab: "Medicamentos y Horario",
    chatTab: "Chat Cuidador y Anciano",
    caregiverChatTitle: "Chat Directo Cuidador y Anciano",
    caregiverChatSubtitle: "Mensajería instantánea entre Jane (Cuidadora) y Arthur",
    elderlyChatTitle: "Chatear con Jane (Cuidadora) 💬",
    elderlyChatSubtitle: "Envía mensajes rápidos, notas de voz o preguntas a tu cuidadora",
    chatPlaceholder: "Escribe tu mensaje aquí...",
    sendMessage: "Enviar",
    quickCheckIn: "Sugerencias de Consulta Rápida",
    quickRepliesElderly: "Mensajes Rápidos para Ancianos",
    caregiverQuickMsg1: "¿Tomaste tu medicamento de la mañana?",
    caregiverQuickMsg2: "¿Cómo te sientes en este momento, Arthur?",
    caregiverQuickMsg3: "Recuerda beber un vaso lleno de agua con tu dosis.",
    caregiverQuickMsg4: "¡Buen trabajo siguiendo tu horario hoy! ❤️",
    elderlyQuickMsg1: "¡Ya tomé mi medicina! 👍",
    elderlyQuickMsg2: "Me siento bien hoy 😊",
    elderlyQuickMsg3: "¿Puedes llamarme por favor? 📞",
    elderlyQuickMsg4: "Necesito ayuda o me siento mal 🚨",
    readAloudChat: "Leer en Voz Alta 🔊",
    unreadCount: "Mensajes No Leídos",

    connectionCodeTitle: "Código Permanente de Conexión del Cuidador",
    copyCode: "Copiar Código",
    codeCopied: "¡Copiado!",
    resetCode: "Regenerar Código",
    connectedSeniors: "Adultos Mayores Conectados",
    connectToCaregiver: "Conectar con el Cuidador",
    enterConnectionCode: "Ingrese Código de Cuidador (ej. CG-A8K3X9)",
    verifyAndConnect: "Verificar y Conectar",
    connectionActive: "Conectado al Cuidador",
    disconnect: "Desconectar",
    medicalReportsAndFiles: "Informes Médicos y Recetas Compartidas",
    uploadReport: "Subir Archivo / Informe",
    prescriptions: "Recetas Médicas",
    medicationConfirmations: "Confirmaciones de Medicamentos",
    switchPatient: "Cambiar Paciente",
    activePatient: "Paciente Activo"
  },
  hi: {
    appName: "दवा अनुपालन ऐप",
    elderlyMode: "वरिष्ठ नागरिक ऐप (आर्थर)",
    caregiverMode: "देखभालकर्ता डैशबोर्ड",
    diseaseIntelligence: "रोग-डेटासेट इंटेलिजेंस सक्रिय",
    systemSimulation: "सिस्टम सिमुलेशन नियंत्रण",
    simulatedTime: "सिम्युलेटेड आभासी समय",
    startingReference: "प्रारंभिक संदर्भ: 07:30 AM",
    fastForward: "आभासी समय आगे बढ़ाएं:",
    tips: "सुझाव: मेटफॉर्मिन 08:00 बजे, लिसिनोप्रिल 09:00 बजे सक्रिय होता है। छूटी हुई खुराक का अलर्ट देखने के लिए समय आगे बढ़ाएं!",
    allDone: "सिस्टम ऑफलाइन या रीसेट",
    footerText: "© 2026 दवा अनुपालन ऐप • डब्ल्यूएचओ, RxNorm, और DrugBank डेटासेट के साथ नैदानिक रूप से संरेखित।",
    
    activeSchedules: "सक्रिय कार्यक्रम",
    takenToday: "आज ली गई दवाएं",
    missedAlerts: "छूटी हुई खुराक (देखभालकर्ता अलर्ट)",
    escalatedToDoctor: "डॉक्टर को भेजा गया",
    adherenceRoster: "सक्रिय अनुपालन सूची",
    rosterDescription: "आर्थर की दवा सूची की वास्तविक समय स्थिति की निगरानी",
    medication: "दवा",
    schedule: "समय-सारणी",
    adherenceStatus: "अनुपालन स्थिति",
    escalationPhase: "एस्केलेशन चरण",
    actions: "कार्रवाई",
    noMeds: "कोई दवा पंजीकृत नहीं है। नैदानिक इंटेलिजेंस खोजें या जोड़ने के लिए फॉर्म भरें!",
    reviewerNote: "समीक्षक नोट: आप तुरंत इसकी स्थिति को आगे बढ़ाने के लिए ऊपर किसी भी दवा के लिए \"Trigger Step\" बटन पर क्लिक कर सकते हैं (चरण 1 ➔ चरण 2 ➔ चरण 3)। इससे आप वास्तविक समय की प्रतीक्षा किए बिना दाईं ओर मल्टी-चैनल अधिसूचना प्रवाह का परीक्षण कर सकते हैं!",
    triggerStep: "चरण बढ़ाएं",
    addManual: "मैन्युअल दवा जोड़ें",
    registerSchedule: "दवा पंजीकृत करें",
    drugName: "दवा का नाम",
    dosage: "खुराक",
    scheduleTime: "दवा का समय",
    condition: "लक्षित बीमारी/स्थिति",
    seniorInstructions: "बुजुर्गों के लिए सुरक्षित निर्देश",

    goodMorning: "शुभ प्रभात, आर्थर",
    goodAfternoon: "शुभ दोपहर, आर्थर",
    goodEvening: "शुभ संध्या, आर्थर",
    timeIsNow: "अभी समय हुआ है",
    overdue: "खुराक का समय बीत चुका है!",
    nextScheduled: "अगली निर्धारित दवा",
    instructionsForArthur: "आर्थर के लिए निर्देश",
    treatingCondition: "इलाज की स्थिति",
    readAloud: "ज़ोर से पढ़ें 🔊",
    stopVoice: "आवाज बंद करें",
    yesITookIt: "हाँ, मैंने दवा ले ली!",
    allMedsTakenTitle: "सभी दवाएं ली गईं!",
    allMedsTakenDesc: "बहुत बढ़िया, आर्थर! आपने अपनी आज की सभी दवाएं समय पर ले ली हैं। आराम करें!",
    remainingSchedule: "आज का शेष कार्यक्रम",
    done: "✓ संपन्न",

    clinicalIntelTitle: "क्लिनिकल रोग और डेटासेट इंटेलिजेंस",
    clinicalIntelDesc: "मानक डब्ल्यूएचओ-संरेखित नियमों, RxNorm अवधारणा आईडी, DrugBank संदर्भों को खोजें और वास्तविक समय में दवा सुरक्षा की जांच करें।",
    searchDisease: "1. बीमारी से जुड़े नियमों की खोज करें",
    analyzeBtn: "विश्लेषण करें",
    quickSearch: "त्वरित खोज",
    evalDrugSafety: "2. दवाओं के आपसी प्रभाव का मूल्यांकन करें",
    evalDescription: "आर्थर के वर्तमान नियमों के खिलाफ नई दवा जोड़ने से पहले आपसी प्रतिकूल प्रभाव या चेतावनियों की जांच करें:",
    checkSafetyBtn: "सुरक्षा जांचें",
    quickCheck: "त्वरित जांच",
    addMedToArthur: "आर्थर के लिए जोड़ें",
    analysisComplete: "विश्लेषण पूरा हुआ",
    recommendedMeds: "अनुशंसित दवाएं",
    clinicalRationale: "नैदानिक आधार",
    rxnormCode: "RxNorm कोड",
    drugbankId: "DrugBank आईडी",
    safetyPrecautions: "बुजुर्गों के लिए सावधानियां और चेतावनी",
    drugSafetyTitle: "दवा सुरक्षा विश्लेषण",
    safetyRecommendation: "क्लिनिकल सुरक्षा सिफारिशें",
    speakHello: "नमस्ते आर्थर, आपके {medName} लेने का समय हो गया है।",
    speakDose: "आपकी खुराक की मात्रा {dosage} है।",
    speakInstruction: "निर्देश है: {instructions}।",
    speakPressButton: "कृपया इसे लेने के बाद नीचे दिए गए बड़े हरे बटन को दबाएं।",

    // Chat
    chatMode: "सीधी बातचीत 💬",
    goToChat: "चैट विंडो खोलें",
    medicationsTab: "दवाएं और शेड्यूल",
    chatTab: "देखभालकर्ता और वरिष्ठ चैट",
    caregiverChatTitle: "देखभालकर्ता और वरिष्ठ नागरिक सीधी बातचीत",
    caregiverChatSubtitle: "जेन (देखभालकर्ता) और आर्थर के बीच त्वरित संदेश",
    elderlyChatTitle: "जेन (देखभालकर्ता) से बात करें 💬",
    elderlyChatSubtitle: "अपनी देखभालकर्ता को त्वरित संदेश, वॉयस नोट्स या प्रश्न भेजें",
    chatPlaceholder: "अपना संदेश यहाँ लिखें...",
    sendMessage: "भेजें",
    quickCheckIn: "त्वरित हालचाल सुझाव",
    quickRepliesElderly: "वरिष्ठ नागरिकों के लिए आसान जवाब",
    caregiverQuickMsg1: "क्या आपने सुबह की दवा ले ली?",
    caregiverQuickMsg2: "आर्थर, आप अभी कैसा महसूस कर रहे हैं?",
    caregiverQuickMsg3: "कृपया अपनी खुराक के साथ एक पूरा गिलास पानी पीना याद रखें।",
    caregiverQuickMsg4: "आज समय पर दवा लेने के लिए बहुत बढ़िया काम! ❤️",
    elderlyQuickMsg1: "मैंने दवा ले ली! 👍",
    elderlyQuickMsg2: "मैं आज अच्छा महसूस कर रहा हूँ 😊",
    elderlyQuickMsg3: "क्या आप कृपया मुझे फोन कर सकते हैं? 📞",
    elderlyQuickMsg4: "मुझे मदद चाहिए या तबीयत ठीक नहीं लग रही 🚨",
    readAloudChat: "ज़ोर से पढ़ें 🔊",
    unreadCount: "अपठित संदेश",

    connectionCodeTitle: "स्थायी देखभालकर्ता कनेक्शन कोड",
    copyCode: "कोड कॉपी करें",
    codeCopied: "कॉपी हो गया!",
    resetCode: "कोड पुन: उत्पन्न करें",
    connectedSeniors: "जुड़े हुए बुजुर्ग नागरिक",
    connectToCaregiver: "देखभालकर्ता से जुड़ें",
    enterConnectionCode: "देखभालकर्ता कोड दर्ज करें (उदा. CG-A8K3X9)",
    verifyAndConnect: "सत्यापित करें और जुड़ें",
    connectionActive: "देखभालकर्ता से जुड़े हैं",
    disconnect: "डिस्कनेक्ट करें",
    medicalReportsAndFiles: "साझा मेडिकल रिपोर्ट और नुस्खे",
    uploadReport: "फ़ाइल / रिपोर्ट अपलोड करें",
    prescriptions: "दवा के नुस्खे",
    medicationConfirmations: "दवा की पुष्टि",
    switchPatient: "रोगी बदलें",
    activePatient: "सक्रिय रोगी"
  },
  zh: {
    appName: "服药依从性管理系统",
    elderlyMode: "老人模式 (Arthur)",
    caregiverMode: "看护人控制台",
    diseaseIntelligence: "临床疾病与药物数据库智能已启用",
    systemSimulation: "系统模拟控制中心",
    simulatedTime: "模拟虚拟时间",
    startingReference: "初始基准：上午 07:30",
    fastForward: "快进模拟时间：",
    tips: "提示：二甲双胍在 08:00 触发，赖诺普利在 09:00 触发。快进时间可以触发漏服报警流程！",
    allDone: "系统已离线或重置",
    footerText: "© 2026 服药依从性系统 • 临床对齐 WHO（世卫组织）、RxNorm 及 DrugBank 官方安全数据集。",
    
    activeSchedules: "活动服药计划",
    takenToday: "今日已服",
    missedAlerts: "漏服 (看护人警报)",
    escalatedToDoctor: "已升级至医生",
    adherenceRoster: "实时服药管理花名册",
    rosterDescription: "实时监控 Arthur 的所有服药状态与依从性情况",
    medication: "药品名称",
    schedule: "服药时间",
    adherenceStatus: "依从状态",
    escalationPhase: "安全升级阶段",
    actions: "交互操作",
    noMeds: "暂未注册任何药物。请在下方查询临床智能库或填写表单手动添加！",
    reviewerNote: "审阅者说明：您可以直接点击上方任意药品的 \"Trigger Step\" 按钮来强行立即升级其报警阶段（第1阶段 ➔ 第2阶段 ➔ 第3阶段）。这使您无需长时间等待虚拟时间，即可立即测试右侧的跨渠道报警通知流！",
    triggerStep: "触发阶段",
    addManual: "手动注册服药计划",
    registerSchedule: "注册服药计划",
    drugName: "药品通用名",
    dosage: "剂量",
    scheduleTime: "服药时间点",
    condition: "针对疾病/适应症",
    seniorInstructions: "老年人安全服药说明",

    goodMorning: "早上好，Arthur",
    goodAfternoon: "下午好，Arthur",
    goodEvening: "晚上好，Arthur",
    timeIsNow: "当前虚拟时间是",
    overdue: "警报：已超出服药时间！",
    nextScheduled: "下一班服药药品点",
    instructionsForArthur: "Arthur 的专属服药指导",
    treatingCondition: "治疗病症",
    readAloud: "语音播报 🔊",
    stopVoice: "停止播报",
    yesITookIt: "好，我已经服药了！",
    allMedsTakenTitle: "今日服药已全部完成！",
    allMedsTakenDesc: "太棒了，Arthur！您当前所有的服药计划都已安全、按时确认。请好好休息！",
    remainingSchedule: "今日后续服药计划日程",
    done: "✓ 已确认",

    clinicalIntelTitle: "临床病症及药物大数据智能分析",
    clinicalIntelDesc: "实时检索世卫组织（WHO）标准临床路径、RxNorm 概念标识符、DrugBank 全球药物档案，并智能化评估药物安全与相互作用。",
    searchDisease: "1. 检索病症关联的标准药物方案",
    analyzeBtn: "智能分析",
    quickSearch: "快捷病症：",
    evalDrugSafety: "2. 评估药物合并使用安全性（相互作用）",
    evalDescription: "输入欲新增药物名称，智能比对 Arthur 目前正在服用的药品清单，审查联合用药禁忌：",
    checkSafetyBtn: "安全评估",
    quickCheck: "快捷药品：",
    addMedToArthur: "一键同步给 Arthur",
    analysisComplete: "分析完成",
    recommendedMeds: "推荐药品",
    clinicalRationale: "临床依据",
    rxnormCode: "RxNorm 编码",
    drugbankId: "DrugBank 数据库号",
    safetyPrecautions: "针对老年群体的特殊用药预防与警告",
    drugSafetyTitle: "用药联合禁忌评估",
    safetyRecommendation: "专家临床替代性安全建议",
    speakHello: "你好阿瑟，该吃你的{medName}了。",
    speakDose: "你的服药剂量是{dosage}。",
    speakInstruction: "服用说明是：{instructions}。",
    speakPressButton: "服用后请点击下方的大绿按钮。",

    // Chat
    chatMode: "实时聊天 💬",
    goToChat: "打开聊天窗口",
    medicationsTab: "药物与服药日程",
    chatTab: "看护人与老人沟通",
    caregiverChatTitle: "看护人与老人直连沟通",
    caregiverChatSubtitle: "看护人 Jane 与老人 Arthur 的实时聊天通道",
    elderlyChatTitle: "与看护人 Jane 对话 💬",
    elderlyChatSubtitle: "向您的看护人发送快捷消息、语音播报或健康提问",
    chatPlaceholder: "在此输入您的消息...",
    sendMessage: "发送",
    quickCheckIn: "快捷询问模板",
    quickRepliesElderly: "长者一键快捷回复",
    caregiverQuickMsg1: "请问您吃过早晨的药了吗？",
    caregiverQuickMsg2: "Arthur，您现在感觉怎么样？",
    caregiverQuickMsg3: "请记得服药时配合喝一大杯温开水。",
    caregiverQuickMsg4: "今天按时服药非常棒！加油 ❤️",
    elderlyQuickMsg1: "我已经吃过药啦！👍",
    elderlyQuickMsg2: "我今天感觉挺好的 😊",
    elderlyQuickMsg3: "能方便给我打个电话吗？📞",
    elderlyQuickMsg4: "我需要帮助，感觉有点不舒服 🚨",
    readAloudChat: "语音朗读 🔊",
    unreadCount: "未读消息",

    connectionCodeTitle: "看护人专属永久绑定码",
    copyCode: "复制绑定码",
    codeCopied: "已复制！",
    resetCode: "重置生成新码",
    connectedSeniors: "已绑定的老人",
    connectToCaregiver: "绑定看护人账号",
    enterConnectionCode: "输入看护人绑定码 (例如: CG-A8K3X9)",
    verifyAndConnect: "验证并完成绑定",
    connectionActive: "已与看护人连接",
    disconnect: "解除绑定",
    medicalReportsAndFiles: "共享医疗报告与处方",
    uploadReport: "上传文件/报告",
    prescriptions: "处方单",
    medicationConfirmations: "服药确认记录",
    switchPatient: "切换管理老人",
    activePatient: "当前管理老人"
  },
  te: {
    appName: "ఔషధ క్రమబద్ధత యాప్",
    elderlyMode: "వృద్ధుల యాప్ (ఆర్థర్)",
    caregiverMode: "కేర్‌గివర్ డాష్‌బోర్డ్",
    diseaseIntelligence: "వ్యాధి-డేటాసెట్ ఇంటె利జెన్స్ ప్రారంభించబడింది",
    systemSimulation: "సిస్టమ్ సిమ్యులేషన్ నియంత్రణ",
    simulatedTime: "సమయం సిమ్యులేట్ చేయబడింది",
    startingReference: "ప్రారంభ సూచన: ఉదయం 07:30",
    fastForward: "సిమ్యులేటెడ్ సమయాన్ని వేగవంతం చేయండి:",
    tips: "చిట్కాలు: మెట్‌ఫార్మిన్ 08:00 గంటలకు, లిసినోప్రిల్ 09:00 గంటలకు ప్రేరేపించబడుతుంది. సమయాన్ని ముందుకు జరపండి!",
    allDone: "సిస్టమ్ ఆఫ్‌లైన్ లేదా రీసెట్ చేయబడింది",
    footerText: "© 2026 ఔషధ క్రమబద్ధత యాప్ • WHO, RxNorm, & DrugBank డేటాసెట్‌లతో క్లినికల్‌గా సమలేఖనం చేయబడింది.",
    
    activeSchedules: "క్రియాశీల షెడ్యూల్‌లు",
    takenToday: "ఈ రోజు తీసుకున్నవి",
    missedAlerts: "మిస్ అయినవి (కేర్‌గివర్ అలర్ట్)",
    escalatedToDoctor: "వైద్యునికి పంపబడింది",
    adherenceRoster: "క్రియాశీల క్రమబద్ధత జాబితా",
    rosterDescription: "ఆర్థర్ ఔషధాల జాబితా యొక్క నిజ-సమయ పర్యవేక్షణ",
    medication: "ఔషధం",
    schedule: "షెడ్యూల్",
    adherenceStatus: "క్రమబద్ధత స్థితి",
    escalationPhase: "ఎస్కలేషన్ దశ",
    actions: "చర్యలు",
    noMeds: "ఔషధాలు నమోదు చేయబడలేదు. దిగువన క్లినికల్ ఇంటెలిజెన్స్‌ని శోధించండి లేదా జోడించడానికి ఫారమ్‌ను నింపండి!",
    reviewerNote: "రివ్యూయర్ నోట్: మీరు పైన ఉన్న ఏదైనా ఔషధం కోసం 'Trigger Step' బటన్‌ను క్లిక్ చేయడం ద్వారా దాని స్థితిని వెంటనే పెంచవచ్చు. ఇది నిజ సమయం కోసం వేచి ఉండకుండా నోటిఫికేషన్‌లను పరీక్షించడానికి మిమ్మల్ని అనుమతిస్తుంది!",
    triggerStep: "దశను పెంచండి",
    addManual: "మాన్యువల్‌గా షెడ్యూల్‌ను జోడించండి",
    registerSchedule: "షెడ్యూల్‌ను నమోదు చేయండి",
    drugName: "ఔషధం పేరు",
    dosage: "మోతాదు",
    scheduleTime: "షెడ్యూల్ సమయం",
    condition: "లక్ష్య వ్యాధి/స్థితి",
    seniorInstructions: "వృద్ధుల సురక్షిత సూచనలు",

    goodMorning: "శుభోదయం, ఆర్థర్",
    goodAfternoon: "శుభ మధ్యాహ్నం, ఆర్థర్",
    goodEvening: "శుభ సాయంత్రం, ఆర్థర్",
    timeIsNow: "ప్రస్తుత సమయం",
    overdue: "ఔషధం ఆలస్యమైంది!",
    nextScheduled: "తదుపరి షెడ్యూల్ చేసిన ఔషధం",
    instructionsForArthur: "ఆర్థర్ కోసం సూచనలు",
    treatingCondition: "చికిత్స చేస్తున్న వ్యాధి",
    readAloud: "గట్టిగా చదవండి 🔊",
    stopVoice: "వాయిస్ ఆపండి",
    yesITookIt: "అవును, నేను తీసుకున్నాను!",
    allMedsTakenTitle: "అన్ని మందులు తీసుకోబడ్డాయి!",
    allMedsTakenDesc: "చాలా మంచిది, ఆర్థర్! ప్రస్తుతానికి షెడ్యూల్ చేసిన మందులన్నీ పూర్తయ్యాయి. విశ్రాంతి తీసుకోండి!",
    remainingSchedule: "ఈ రోజు మిగిలిన షెడ్యూల్",
    done: "✓ పూర్తయింది",

    clinicalIntelTitle: "క్లినికల్ వ్యాధి & డేటాసెట్ ఇంటెలిజెన్స్",
    clinicalIntelDesc: "WHO-సమలేఖన నిబంధనలు, RxNorm కాన్సెప్ట్ IDలు, DrugBank సూచనలను శోధించండి మరియు నిజ-సమయంలో భద్రతా పరస్పర చర్యలను అంచనా వేయండి.",
    searchDisease: "1. వ్యాధికి సంబంధించిన నిబంధనలను శోధించండి",
    analyzeBtn: "విశ్లేషించు",
    quickSearch: "త్వరిత శోధన",
    evalDrugSafety: "2. ఔషధాల పరస్పర చర్యలను అంచనా వేయండి",
    evalDescription: "ఆర్థర్ యొక్క ప్రస్తుత నిబంధనలతో కొత్త ఔషధాన్ని జోడించే ముందు సంభావ్య పరస్పర చర్యలు లేదా హెచ్చరికలను తనిఖీ చేయండి:",
    checkSafetyBtn: "భద్రతను తనిఖీ చేయి",
    quickCheck: "త్వరిత తనిఖీ",
    addMedToArthur: "ఆర్థర్‌కు జోడించు",
    analysisComplete: "విశ్లేషణ పూర్తయింది",
    recommendedMeds: "సిఫార్సు చేయబడిన మందులు",
    clinicalRationale: "క్లినికల్ హేతువు",
    rxnormCode: "RxNorm కోడ్",
    drugbankId: "DrugBank ID",
    safetyPrecautions: "వృద్ధుల కోసం జాగ్రత్తలు & హెచ్చరికలు",
    drugSafetyTitle: "ఔషధ భద్రతా విశ్లేషణ",
    safetyRecommendation: "క్లినికల్ సేఫ్టీ సిఫార్సు",
    speakHello: "నమస్కారం ఆర్థర్, మీ {medName} వేసుకునే సమయం అయింది.",
    speakDose: "మీ మోతాదు పరిమాణం {dosage}.",
    speakInstruction: "సూచన: {instructions}.",
    speakPressButton: "మందు వేసుకున్న తర్వాత దయచేసి క్రింద ఉన్న పెద్ద ఆకుపచ్చ బటన్‌ను నొక్కండి.",

    // Chat
    chatMode: "నేరుగా చాట్ 💬",
    goToChat: "చాట్ విండో తెరవండి",
    medicationsTab: "మందులు & షెడ్యూల్",
    chatTab: "కేర్‌గివర్ & సీనియర్ చాట్",
    caregiverChatTitle: "కేర్‌గివర్ & సీనియర్ నేరుగా చాట్",
    caregiverChatSubtitle: "జేన్ (కేర్‌గివర్) మరియు ఆర్థర్ మధ్య తక్షణ సందేశాలు",
    elderlyChatTitle: "జేన్ (కేర్‌గివర్) తో చాట్ చేయండి 💬",
    elderlyChatSubtitle: "మీ కేర్‌గివర్‌కి వేగవంతమైన సందేశాలు, ప్రశ్నలు పంపండి",
    chatPlaceholder: "ఇక్కడ మీ సందేశాన్ని టైప్ చేయండి...",
    sendMessage: "పంపు",
    quickCheckIn: "త్వరిత పరిశీలన సూచనలు",
    quickRepliesElderly: "వృద్ధుల తక్షణ ప్రత్యుత్తరాలు",
    caregiverQuickMsg1: "మీరు ఉదయం మందు తీసుకున్నారా?",
    caregiverQuickMsg2: "ఆర్థర్, ఇప్పుడు మీరు ఎలా అనుభవిస్తున్నారు?",
    caregiverQuickMsg3: "దయచేసి మందులతో పాటు ఒక గ్లాసు నీరు తాగడం గుర్తుంచుకోండి.",
    caregiverQuickMsg4: "ఈ రోజు సమయానికి మందులు వేసుకున్నందుకు చాలా సంతోషం! ❤️",
    elderlyQuickMsg1: "నేను నా మందులు వేసుకున్నాను! 👍",
    elderlyQuickMsg2: "నేను ఈ రోజు బాగానే ఉన్నాను 😊",
    elderlyQuickMsg3: "దయచేసి నాకు కాల్ చేయగలరా? 📞",
    elderlyQuickMsg4: "నాకు సహాయం కావాలి / బాగుండలేదు 🚨",
    readAloudChat: "గట్టిగా చదవండి 🔊",
    unreadCount: "చదవని సందేశాలు",

    connectionCodeTitle: "శాశ్వత కేర్‌గివర్ కనెక్షన్ కోడ్",
    copyCode: "కోడ్ కాపీ చేయండి",
    codeCopied: "కాపీ చేయబడింది!",
    resetCode: "కోడ్‌ని మళ్లీ సృష్టించండి",
    connectedSeniors: "కనెక్ట్ చేయబడిన వృద్ధులు",
    connectToCaregiver: "కేర్‌గివర్‌కి కనెక్ట్ చేయండి",
    enterConnectionCode: "కేర్‌గివర్ కోడ్‌ని నమోదు చేయండి (ఉదా. CG-A8K3X9)",
    verifyAndConnect: "తనిఖీ చేసి కనెక్ట్ చేయండి",
    connectionActive: "కేర్‌గివర్‌కి కనెక్ట్ చేయబడింది",
    disconnect: "డిస్‌కనెక్ట్ చేయండి",
    medicalReportsAndFiles: "భాగస్వామ్య వైద్య నివేదికలు & ప్రిస్క్రిప్షన్‌లు",
    uploadReport: "ఫైల్ / రిపోర్ట్ అప్‌లోడ్ చేయండి",
    prescriptions: "ప్రిస్క్రిప్షన్లు",
    medicationConfirmations: "ఔషధ నిర్ధారణలు",
    switchPatient: "రోగిని మార్చండి",
    activePatient: "క్రియాశీల రోగి"
  }
};

function translateDisease(disease: string, lang: Language): string {
  const dLower = disease.toLowerCase();
  if (dLower.includes("diabetes")) {
    if (lang === "te") return "మధుమేహం (టైప్ 2)";
    if (lang === "hi") return "मधुमेह (टाइप 2)";
    if (lang === "es") return "Diabetes Tipo 2";
    if (lang === "zh") return "2型糖尿病";
  }
  if (dLower.includes("hypertension") || dLower.includes("high blood pressure")) {
    if (lang === "te") return "రక్తపోటు (హైపర్‌టెన్షన్)";
    if (lang === "hi") return "उच्च रक्तचाप";
    if (lang === "es") return "Hipertensión";
    if (lang === "zh") return "高血压";
  }
  if (dLower.includes("hypercholesterolemia") || dLower.includes("cholesterol")) {
    if (lang === "te") return "అధిక కొలెస్ట్రాల్";
    if (lang === "hi") return "उच्च कोलेस्ट्रॉल";
    if (lang === "es") return "Hipercolesterolemia";
    if (lang === "zh") return "高胆固醇";
  }
  if (dLower.includes("asthma")) {
    if (lang === "te") return "ఆస్తమా";
    if (lang === "hi") return "अस्थमा";
    if (lang === "es") return "Asma";
    if (lang === "zh") return "哮喘";
  }
  if (dLower.includes("alzheimer")) {
    if (lang === "te") return "అల్జీమర్స్ వ్యాధి";
    if (lang === "hi") return "अल्जाइमर रोग";
    if (lang === "es") return "Enfermedad de Alzheimer";
    if (lang === "zh") return "阿尔茨海默病";
  }
  if (dLower.includes("parkinson")) {
    if (lang === "te") return "పార్కిన్సన్ వ్యాధి";
    if (lang === "hi") return "पार्किसंस रोग";
    if (lang === "es") return "Enfermedad de Parkinson";
    if (lang === "zh") return "帕金森病";
  }
  return disease;
}

export function translateNotificationLog(message: string, lang: Language): string {
  if (lang === "en") return message;

  // Extract common variables safely
  let med = "Metformin";
  let dosage = "500mg";
  let disease = "Type 2 Diabetes";
  let time = "08:00";
  let schedTime = "08:00";

  // System Initialized
  if (message.includes("System initialized")) {
    if (lang === "te") return "సిస్టమ్ ప్రారంభించబడింది. స్వాగతం, ఆర్థర్.";
    if (lang === "hi") return "सिस्टम शुरू किया गया। वापस स्वागत है, आर्थर।";
    if (lang === "es") return "Sistema inicializado. Bienvenido de nuevo, Arthur.";
    if (lang === "zh") return "系统已初始化。欢迎回来，阿瑟。";
  }

  // Simulation reset
  if (message.includes("Simulation state reset")) {
    if (lang === "te") return `సిమ్యులేషన్ రీసెట్ చేయబడింది. ఆర్థర్ ఉదయం 07:30 గంటలకు తన రోజును ప్రారంభిస్తున్నారు.`;
    if (lang === "hi") return `सिमुलेशन स्थिति रीसेट। आर्थर सुबह 07:30 बजे अपना दिन शुरू कर रहा है।`;
    if (lang === "es") return `Estado de simulación restablecido. Arthur comienza su día a las 07:30 AM.`;
    if (lang === "zh") return `模拟状态已重置。阿瑟在上午 07:30 开始他的一天。`;
  }

  // Medication removed
  if (message.includes("Medication removed")) {
    if (lang === "te") return `🗑️ క్రియాశీల షెడ్యూల్ నుండి ఔషధం తొలగించబడింది.`;
    if (lang === "hi") return `🗑️ सक्रिय कार्यक्रम से दवा हटा दी गई।`;
    if (lang === "es") return `🗑️ Medicamento eliminado del horario activo.`;
    if (lang === "zh") return `🗑️ 已将该药物从服药日程表中移除。`;
  }

  // Reminder pattern
  if (message.includes("time to take your")) {
    const parts = message.split("take your ");
    if (parts.length > 1) {
      const sub = parts[1];
      med = sub.split(" (")[0];
      dosage = sub.includes("(") && sub.includes(")") ? sub.substring(sub.indexOf("(") + 1, sub.indexOf(")")) : "500mg";
      const diseasePart = sub.split("for your ");
      if (diseasePart.length > 1) {
        disease = diseasePart[1].split(".")[0];
      }
    }
    const transDisease = translateDisease(disease, lang);
    if (lang === "te") return `⏰ రిమైండర్: ఆర్థర్, మీ ${transDisease} కొరకు మీ ${med} (${dosage}) వేసుకోవడానికి సమయమయింది. దయచేసి స్క్రీన్‌పై ఉన్న ఆకుపచ్చ 'Taken' బటన్‌ను నొక్కండి.`;
    if (lang === "hi") return `⏰ अनुस्मारक: आर्थर, आपके ${transDisease} के लिए आपकी ${med} (${dosage}) लेने का समय हो गया है। कृपया अपनी स्क्रीन पर हरे रंग का 'Taken' बटन दबाएं।`;
    if (lang === "es") return `⏰ Recordatorio: Arthur, es hora de tomar tu ${med} (${dosage}) para tu ${transDisease}. Por favor, presiona el botón verde 'Taken' en tu pantalla.`;
    if (lang === "zh") return `⏰ 提醒：阿瑟，该服用治疗${transDisease}的${med}（${dosage}）了。请点击屏幕上的绿色 'Taken' 按钮。`;
  }

  // Automated Voice Call pattern
  if (message.includes("Automated Voice Call")) {
    if (message.includes("take your ")) {
      med = message.split("take your ")[1].replace(/['\.]/g, "").trim();
    }
    if (lang === "te") return `📞 [ఆటోమేటెడ్ వాయిస్ కాల్]: 'నమస్కారం ఆర్థర్, ఇది మీ ఆరోగ్య సహాయకుడు. దయచేసి మీ ${med} ఇప్పుడు వేసుకోవాలని గుర్తుంచుకోండి.'`;
    if (lang === "hi") return `📞 [स्वचालित वॉयस कॉल]: 'नमस्ते आर्थर, यह आपका स्वास्थ्य सहायक है। कृपया अपनी ${med} अभी लेना याद रखें।'`;
    if (lang === "es") return `📞 [Llamada de Voz Automatizada]: 'Hola Arthur, este es tu asistente de salud. Por favor, recuerda tomar tu ${med} ahora.'`;
    if (lang === "zh") return `📞 [自动语音电话]：'你好阿瑟，我是你的健康助手。请记得现在服用${med}。'`;
  }

  // Missed Alert pattern
  if (message.includes("missed his") && !message.includes("Critical Escalation")) {
    const parts = message.split("missed his ");
    if (parts.length > 1) {
      const sub = parts[1];
      med = sub.split(" (")[0];
      dosage = sub.includes("(") && sub.includes(")") ? sub.substring(sub.indexOf("(") + 1, sub.indexOf(")")) : "500mg";
      if (sub.includes("scheduled for ")) {
        time = sub.split("scheduled for ")[1].split(".")[0].replace("!", "").trim();
      }
    }
    if (lang === "te") return `⚠️ అలర్ట్: ${time} కు షెడ్యూల్ చేయబడిన తన ${med} (${dosage}) ను ఆర్థర్ మిస్ చేసారు. దయచేసి అతనిని సంప్రదించండి.`;
    if (lang === "hi") return `⚠️ अलर्ट: आर्थर ${time} बजे निर्धारित अपनी ${med} (${dosage}) लेना भूल गया। कृपया उससे संपर्क करें।`;
    if (lang === "es") return `⚠️ Alerta: Arthur omitió su ${med} (${dosage}) programada para las ${time}. Por favor, verifícalo.`;
    if (lang === "zh") return `⚠️ 警告：阿瑟错过了原定于${time}服用的${med}（${dosage}）。请与他联系。`;
  }

  // Critical Escalation pattern
  if (message.includes("Critical Escalation")) {
    if (message.includes("take his ")) {
      const sub = message.split("take his ")[1];
      med = sub.split(" (")[0];
      dosage = sub.includes("(") && sub.includes(")") ? sub.substring(sub.indexOf("(") + 1, sub.indexOf(")")) : "500mg";
    } else if (message.includes("missed his ")) {
      const sub = message.split("missed his ")[1];
      med = sub.split(" (")[0];
      dosage = sub.includes("(") && sub.includes(")") ? sub.substring(sub.indexOf("(") + 1, sub.indexOf(")")) : "500mg";
    }
    if (lang === "te") return `🚨 క్లిష్టమైన ఎస్కలేషన్: ఆర్థర్ తన ${med} (${dosage}) వేసుకోలేదు. రోగి గానీ కేర్‌గివర్ జేన్ గానీ స్పందించలేదు. దయచేసి ప్రోటోకాల్ ప్రారంభించండి.`;
    if (lang === "hi") return `🚨 महत्वपूर्ण वृद्धि: आर्थर अपनी ${med} (${dosage}) लेने में विफल रहा है। न तो मरीज और न ही देखभालकर्ता जेन ने जवाब दिया है। कृपया प्रोटोकॉल शुरू करें।`;
    if (lang === "es") return `🚨 Escalada Crítica: Arthur no ha tomado su ${med} (${dosage}). Ni el paciente ni la cuidadora Jane han respondido. Por favor, inicie el protocolo.`;
    if (lang === "zh") return `🚨 紧急升级：阿瑟仍未服用${med}（${dosage}）。患者和看护人 Jane 均未回应。请启动应急流程。`;
  }

  // Took his medication pattern
  if (message.includes("took his")) {
    const parts = message.split("took his ");
    if (parts.length > 1) {
      const sub = parts[1];
      med = sub.split(" (")[0];
      dosage = sub.includes("(") && sub.includes(")") ? sub.substring(sub.indexOf("(") + 1, sub.indexOf(")")) : "500mg";
      if (sub.includes(" at ")) {
        time = sub.split(" at ")[1].split(" ")[0].trim();
      }
      if (sub.includes("scheduled: ")) {
        schedTime = sub.split("scheduled: ")[1].split(")")[0].trim();
      }
    }
    if (lang === "te") return `✅ ఆర్థర్ తన ${med} (${dosage}) ను ${time} కు తీసుకున్నారు (షెడ్యూల్: ${schedTime}). స్థితి గ్రీన్ గా ఉంది.`;
    if (lang === "hi") return `✅ आर्थर ने ${time} बजे अपनी ${med} (${dosage}) ली (निर्धारित समय: ${schedTime})। स्थिति सामान्य (ग्रीन) है।`;
    if (lang === "es") return `✅ Arthur tomó su ${med} (${dosage}) a las ${time} (programado: ${schedTime}). El estado es verde.`;
    if (lang === "zh") return `✅ 阿瑟已在${time}服用${med}（${dosage}）（原定：${schedTime}）。健康状态为绿色。`;
  }

  // Vibrates pattern (Manual trigger)
  if (message.includes("phone vibrates")) {
    if (message.includes("take your ")) {
      const sub = message.split("take your ")[1];
      med = sub.split(" (")[0];
      dosage = sub.includes("(") && sub.includes(")") ? sub.substring(sub.indexOf("(") + 1, sub.indexOf(")")) : "500mg";
    }
    if (lang === "te") return `[మాన్యువల్ ట్రిగ్గర్] ⏰ ఆర్థర్ ఫోన్ వైబ్రేట్ అవుతోంది: మీ ${med} (${dosage}) వేసుకునే సమయం అయింది!`;
    if (lang === "hi") return `[मैनुअल ट्रिगर] ⏰ आर्थर का फोन कंपन करता है: आपकी ${med} (${dosage}) लेने का समय हो गया है!`;
    if (lang === "es") return `[Disparador Manual] ⏰ El teléfono de Arthur vibra: ¡Hora de tomar tu ${med} (${dosage})!`;
    if (lang === "zh") return `[手动触发] ⏰ 阿瑟的手机振动：该服用你的${med}（${dosage}）了！`;
  }

  // Caregiver Jane receives SMS pattern
  if (message.includes("Caregiver Jane receives SMS") || (message.includes("Jane") && message.includes("SMS"))) {
    if (message.includes("omitted his ")) {
      med = message.split("omitted his ")[1].split(" ")[0];
    } else if (message.includes("missed his ")) {
      med = message.split("missed his ")[1].split(" ")[0];
    }
    if (lang === "te") return `⚠️ కేర్‌గివర్ జేన్ SMS అందుకున్నారు: ఆర్థర్ తన ${med} వేసుకోలేదు. దయచేసి తనిఖీ చేయండి.`;
    if (lang === "hi") return `⚠️ देखभालकर्ता जेन को एसएमएस मिला: आर्थर अपनी ${med} लेना भूल गया। कृपया जांच करें।`;
    if (lang === "es") return `⚠️ La cuidadora Jane recibe un SMS: Arthur omitió su ${med}. Por favor, verifícalo.`;
    if (lang === "zh") return `⚠️ 看护人 Jane 收到短信：阿瑟错过了他的${med}。请前往核实。`;
  }

  // Health Worker Dr. Smith receives dispatch
  if (message.includes("Health Worker Dr. Smith receives dispatch") || (message.includes("Smith") && message.includes("dispatch"))) {
    if (message.includes("dose of ")) {
      med = message.split("dose of ")[1].split(" ")[0];
    }
    if (lang === "te") return `🚨 హెల్త్ వర్కర్ డాక్టర్ స్మిత్ డిస్పాచ్ అందుకున్నారు: ఆర్థర్ యొక్క ${med} డోస్ తీవ్రమైనదిగా మార్చబడింది.`;
    if (lang === "hi") return `🚨 स्वास्थ्य कार्यकर्ता डॉ. स्मिथ को प्रेषण मिला: आर्थर की ${med} खुराक महत्वपूर्ण स्तर पर पहुंच गई है।`;
    if (lang === "es") return `🚨 El trabajador de salud Dr. Smith recibe un despacho: La dosis de ${med} de Arthur escaló a Crítica.`;
    if (lang === "zh") return `🚨 医生 Dr. Smith 收到调度：阿瑟的${med}剂量已升级为紧急状态。`;
  }

  // New Medication Added pattern
  if (message.includes("New Medication Added")) {
    const parts = message.split("New Medication Added: ");
    if (parts.length > 1) {
      const sub = parts[1];
      med = sub.split(" (")[0];
      dosage = sub.includes("(") && sub.includes(")") ? sub.substring(sub.indexOf("(") + 1, sub.indexOf(")")) : "500mg";
      if (sub.includes("scheduled at ")) {
        time = sub.split("scheduled at ")[1].split(" ")[0].trim();
      }
      if (sub.includes("for ")) {
        disease = sub.split("for ")[1].replace(/\.$/, "").trim();
      }
    }
    const transDisease = translateDisease(disease, lang);
    if (lang === "te") return `➕ కొత్త ఔషధం జోడించబడింది: ${med} (${dosage}) ${time} గంటలకు, చికిత్స: ${transDisease}.`;
    if (lang === "hi") return `➕ नई दवा जोड़ी गई: ${med} (${dosage}) निर्धारित समय: ${time}, उपचार: ${transDisease}.`;
    if (lang === "es") return `➕ Nuevo medicamento agregado: ${med} (${dosage}) a las ${time} para ${transDisease}.`;
    if (lang === "zh") return `➕ 已成功添加新药：${med}（${dosage}），定于 ${time} 服用以治疗 ${transDisease}。`;
  }

  // Voice notification system online
  if (message.includes("Voice notification system online")) {
    if (lang === "te") return "వాయిస్ నోటిఫికేషన్ సిస్టమ్ ఆన్‌లైన్‌లో ఉంది. ఆర్థర్ యొక్క క్రమబద్ధత షెడ్యూల్‌ను ప్రకటించడానికి సిద్ధంగా ఉంది.";
    if (lang === "hi") return "वॉयस नोटिफिकेशन सिस्टम ऑनलाइन है। आर्थर के दवा अनुसूची की घोषणा करने के लिए तैयार है।";
    if (lang === "es") return "Sistema de notificación por voz en línea. Listo para anunciar la programación de Arthur.";
    if (lang === "zh") return "语音通知系统已上线。准备播放阿瑟的服药日程表。";
  }

  return message;
}

export const speechLangCodes: Record<Language, string> = {
  en: "en-US",
  es: "es-ES",
  hi: "hi-IN",
  zh: "zh-CN",
  te: "te-IN"
};
