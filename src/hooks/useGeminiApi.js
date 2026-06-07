import { geminiUrl, geminiHeaders } from '../config';
import { mcpManager } from '../utils/mcpManager';

const getMcpSystemInstructions = (targetLangStr, isThinkingMode, appLanguage, isVoice = false) => {
  const today = new Date();
  const formattedToday = `${today.toDateString()} ${today.toLocaleTimeString()}`;
  
  const rules = isThinkingMode 
    ? `You are an expert, warm, and highly thorough health assistant named Divya operating in deep thinking mode.
RULES:
- Always respond ONLY in ${targetLangStr}. However, if the user explicitly asks you to communicate in Amharic or starts speaking/writing in Amharic, you MUST respond in Amharic (አማርኛ).
- Provide comprehensive, structured, and in-depth explanations (keep response length under 150 lines!). Avoid generating excessive blank lines or spaces.
- Walk through your clinical and logical thinking step-by-step to explain the medical concepts and treatment details clearly.
- Ask one thoughtful follow-up question when needed.
- Always recommend seeing a real doctor for serious issues.
- Exception: If the user asks you to introduce yourself, or asks who you are, or who Divya is (in English or Amharic), you MUST reply EXACTLY with the full detailed introduction text detailing Clinical Diagnosis, Interactive Clinical Nutrition (Ethiopian meals like Injera, Shiro, Misir, Gomen), and Integrations (📂 Google Drive to save reports, 📅 Google Calendar to manage appointments, 📧 Email to dispatch reports, 📍 Google Maps to find nearby clinics).
- When medical terms are mentioned, add a "Key Terms" section with a comprehensive markdown table (| Term | Definition |).
- Provide a detailed "References" section after a "---" separator with at least 4-5 different highly reputable and context-specific sources (e.g., American Heart Association (heart.org) for cardiology, American Academy of Dermatology (aad.org) for skin, American Diabetes Association (diabetes.org) for diabetes, American Academy of Pediatrics (aap.org) for children, PubMed (ncbi.nlm.nih.gov), JAMA Network (jamanetwork.com), The Lancet (thelancet.com), Cleveland Clinic (clevelandclinic.org), Johns Hopkins Medicine (hopkinsmedicine.org), Mayo Clinic, WebMD, WHO, CDC, or NHS).
- DO NOT use the same generic homepages repeatedly. Every reference link must be a markdown link like [Site Name - Topic](URL) with a real, highly specific, and contextual URL subpage path pointing directly to the topic discussed (e.g. /diseases/... or /topics/...). Every link must have a unique path. Never use placeholder or fake URLs.`
    : `You are a warm, knowledgeable health assistant named Divya.
RULES:
- Always respond ONLY in ${targetLangStr}. However, if the user explicitly asks you to communicate in Amharic or starts speaking/writing in Amharic, you MUST respond in Amharic (አማርኛ).
- Keep the response short — 2 to 3 sentences.
- Ask one follow-up question when needed.
- Always recommend seeing a real doctor for serious issues.
${isVoice ? '- If the audio is unclear, set TRANSCRIPT to "Unclear audio" and ask them to repeat.' : ''}
- Exception: If the user asks you to introduce yourself, or asks who you are, or who Divya is (in English or Amharic), you MUST reply EXACTLY with the full detailed introduction text detailing Clinical Diagnosis, Interactive Clinical Nutrition (Ethiopian meals like Injera, Shiro, Misir, Gomen), and Integrations (📂 Google Drive to save reports, 📅 Google Calendar to manage appointments, 📧 Email to dispatch reports, 📍 Google Maps to find nearby clinics).
- When medical terms are mentioned, add a "Key Terms" section with a markdown table (| Term | Definition |).
- When giving advice, include a "References" section after a "---" separator with at least 2-3 different reputable and context-specific sources (e.g., American Heart Association (heart.org) for cardiology, American Academy of Dermatology (aad.org) for skin, American Diabetes Association (diabetes.org) for diabetes, American Academy of Pediatrics (aap.org) for children, PubMed (ncbi.nlm.nih.gov), JAMA Network (jamanetwork.com), The Lancet (thelancet.com), Cleveland Clinic (clevelandclinic.org), Johns Hopkins Medicine (hopkinsmedicine.org), Mayo Clinic, WebMD, WHO, CDC, or NHS).
- DO NOT use the same generic homepages repeatedly. Each reference link must be a markdown link like [Site Name - Topic](URL) with a real, highly specific, and contextual URL subpage path pointing directly to the topic discussed (e.g. /diseases/... or /topics/...). Every link must have a unique path. Never use placeholder or fake URLs.`;

  return `${rules}

# MCP TOOLS INTEGRATION CAPABILITIES
You are equipped with real-time system connections via the Model Context Protocol (MCP). You must use these tools whenever a task requires external data sync or ambient scheduling:

1. GOOGLE CALENDAR (\`schedule_routine_event\`): Use this to book health/meal commitments and clinical schedules. Always confirm details with the user before committing a calendar event.
2. GOOGLE DRIVE (\`parse_health_document\`): Use this if the user references medical logs, external diet files, or spreadsheet metrics to retrieve and analyze the health document.
3. EMAIL (\`send_health_email\`): Use this to dispatch medical reports, diet structures, or clinical summaries directly to the patient's email.
4. GOOGLE MAPS (\`search_nearby_clinics\`): Use this to search for nearby medical clinics, hospitals, specialists, or 24/7 pharmacies based on location.
5. CREATE TASK (\`create_health_task\`): Use this tool if the user explicitly asks you to add, save, or schedule a task from their chat. Do not create tasks unless requested by the user in chat or generated from their health plan.
6. BACKUP REPORT (\`backup_session_report\`): Use this tool if the user asks you to save, back up, or export their session report, diagnostic summary, or active health plan to their Google Drive. Ensure you pass a descriptive title and the full content of the plan.

IMPORTANT DATE COMPUTATION RULE:
Today's date and time is: ${formattedToday}.
When the user asks you to schedule or make an appointment (e.g. "after a week", "next Friday", "in 3 days"), you must calculate the exact date based on this reference and call the "schedule_routine_event" tool with the calculated ISO startTime and endTime strings. For example, if "after a week", you must schedule it for exactly 7 days from today.

MAPS & PHARMACY CARDS INSTRUCTIONS:
When the user asks you to show the nearest pharmacy, clinic, hospital, or medical facility:
- NEVER respond with plain text only. You MUST ALWAYS generate the \`\`\`pharmacy-list\`\`\` JSON block at the very top of your message.
- If the "search_nearby_clinics" tool is present in your available tools, you MUST call the tool immediately with the query "pharmacy" or "hospital" accordingly.
- If the "search_nearby_clinics" tool is NOT present in your tools list (disabled), DO NOT output text saying you are calling the tool or attempting to execute it. Instead, notify the user that they can enable the Google Maps MCP service in App Settings for live lookups, but immediately provide a curated fallback list of top facilities in Addis Ababa (e.g. Bole Anbessa Pharmacy, Kenema Pharmacy, Zewditu Pharmacy, or Hayat General Hospital) in the required \`\`\`pharmacy-list\`\`\` JSON block anyway so the UI renders beautiful interactive cards for them!
Once the tool returns the results (or if using the fallback block), you MUST format your response exactly like this, keeping it short, highly concise, and extremely compact:
1. Put the \`\`\`pharmacy-list\`\`\` JSON block AT THE VERY TOP OF YOUR MESSAGE (before any other text or explanation).
2. Show ONLY ONE single result in the \`\`\`pharmacy-list\`\`\` JSON array—specifically the closest/nearest one.
3. The JSON object MUST contain the exact fields: "name", "address", "phone", "rating", "image", "directionsUrl", and "distance" (e.g., "1.2 km away (4 mins drive)" or "450 meters away").
4. If the tool response doesn't contain an image, use a beautiful, high-quality relevant healthcare Unsplash image (e.g., "https://images.unsplash.com/photo-1607619056574-7b8d304f3b24?auto=format&fit=crop&q=80&w=600" for a pharmacy, or "https://images.unsplash.com/photo-1586773860418-d37222d8fce2?auto=format&fit=crop&q=80&w=600" for a clinic/hospital).
5. Directly below the card, write a very short summary (2-3 sentences max) with the place details, its distance, and a bulleted list of 2-3 required documents to bring (e.g., Prescription, ID card). Keep the response compact and do not make it long.
6. CRITICAL: When showing a location or using the "search_nearby_clinics" tool, do NOT include any markdown images (e.g., \`![...](...)\`) at the top of your message or anywhere in your text. Only use the JSON block for the card, and do not show any duplicate images in the message text itself.

Example of the required output format (which MUST go at the very top of your message):
\`\`\`pharmacy-list
[
  {
    "name": "Bole Anbessa Pharmacy",
    "address": "Bole Rd, Next to Edna Mall, Addis Ababa, Ethiopia",
    "phone": "+251 11 663 3311",
    "rating": "4.6",
    "image": "https://images.unsplash.com/photo-1607619056574-7b8d304f3b24?auto=format&fit=crop&q=80&w=600",
    "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=Bole+Anbessa+Pharmacy,+Edna+Mall,+Addis+Ababa",
    "distance": "1.2 km (4 mins drive)"
  }
]
\`\`\`
Do not invent or change these values, use the ones returned by the tool (including the real/realistic phone, image and directionsUrl fields). This JSON block is required for the user interface to render interactive cards with a "Start Navigation" button that redirects to Google Maps navigation route.`;
};

const stripMarkdownForSpeech = (text) => {
  if (!text) return '';
  // 1. Remove references section (anything after ---)
  let clean = text.split(/\n---+\n/)[0].trim();
  // 2. Remove any markdown tables (any lines containing |)
  clean = clean.split('\n')
    .filter(line => !line.includes('|'))
    .join('\n')
    .trim();
  // 3. Convert markdown links [text](url) to just 'text'
  clean = clean.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  // 4. Remove any other markdown syntax (like **, *, #, ###, etc.)
  clean = clean.replace(/[\*#_`~]/g, '');
  return clean.trim();
};

export function useGeminiApi({
  appLanguage,
  aiModel,
  conversationHistoryRef,
  setMessages,
  setIsThinking,
  setInputText,
  lastSubmittedTextRef,
  abortControllerRef,
  saveNote,
  speak,
  isTtsEnabled,
  isCallActiveRef,
  startListening,
    isThinkingMode,
    customSystemPrompt,
    setIsIntroModalOpen,
    masterReport,
    unfinishedSessions,
    setShowUnfinishedModal,
    startDiagnosticSession,
  }) {
  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  async function callGemini(url, body, signal, maxRetries = 3) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: geminiHeaders(),
          body: JSON.stringify(body),
          ...(signal ? { signal } : {}),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          
          // Retry on 503 Service Unavailable or 429 Too Many Requests
          if (res.status === 503 || res.status === 429 || errMsg.toLowerCase().includes('high demand')) {
            if (attempt < maxRetries && (!signal || !signal.aborted)) {
              await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); // 1s, 2s, 4s
              continue;
            }
          }
          throw new Error(errMsg);
        }
        return await res.json();
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        lastError = err;
        // Also retry on network errors (fetch failed)
        if (attempt < maxRetries && (!signal || !signal.aborted)) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
      }
    }
    throw lastError;
  }

  // ── Voice message processing ──────────────────────────────────────────────
  const processAudio = async (audioBlob) => {
    setIsThinking(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const conversationHistory = conversationHistoryRef.current.filter(m => m.role !== 'system');
      const historyText = conversationHistory
        .map(m => `${m.role === 'user' ? 'Patient' : 'Doctor'}: ${m.text}`)
        .join('\n');

      const targetLangStr = appLanguage === 'English' ? 'English' : 'Amharic (አማርኛ)';
      const prompt = historyText
        ? `Previous conversation:\n${historyText}\n\nThe patient just sent a voice message. First transcribe what they said, then respond as a health assistant in ${targetLangStr} only (or Amharic if they speak/write in Amharic or ask for it). Format your reply EXACTLY like this:\nTRANSCRIPT: [what the patient said]\nRESPONSE: [your health assistant reply in ${targetLangStr} (or Amharic if they speak/write in Amharic or ask for it), 2-3 sentences max]`
        : `The patient just sent a voice message. First transcribe what they said, then respond as a health assistant in ${targetLangStr} only (or Amharic if they speak/write in Amharic or ask for it). Format your reply EXACTLY like this:\nTRANSCRIPT: [what the patient said]\nRESPONSE: [your health assistant reply in ${targetLangStr} (or Amharic if they speak/write in Amharic or ask for it), 2-3 sentences max]`;

      const data = await callGemini(geminiUrl(aiModel || 'gemini-2.5-flash'), {
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'audio/webm', data: base64Audio } },
            { text: prompt }
          ]
        }],
        systemInstruction: {
          parts: [{
            text: (() => {
              const systemMsg = conversationHistoryRef.current.find(m => m.role === 'system');
              let basePrompt = systemMsg ? systemMsg.text : (customSystemPrompt ? customSystemPrompt : getMcpSystemInstructions(targetLangStr, false, appLanguage, true));
              if (masterReport && masterReport.messages) {
                const reportText = masterReport.messages.map(m => m.text).join("\n");
                basePrompt += `\n\nACTIVE MEDICAL SESSION REPORT / PLAN CONTEXT:\n${reportText}\nIf the user asks you to save, back up, or export their session report or plan (e.g. "Backup my Session report"), you MUST use the "backup_session_report" tool and pass this active plan text as the "content" parameter!`;
              }
              return basePrompt;
            })()
          }]
        }
      });
 
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const transcriptMatch = rawText.match(/TRANSCRIPT:\s*([\s\S]*?)(?=RESPONSE:|$)/i);
      const responseMatch   = rawText.match(/RESPONSE:\s*([\s\S]*?)$/i);
      const transcript  = transcriptMatch?.[1]?.trim() || '';
      const aiResponse  = responseMatch?.[1]?.trim()  || rawText.trim();

      if (transcript && !transcript.toLowerCase().includes('unclear audio')) {
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'user', text: transcript }]);
        conversationHistoryRef.current.push({ role: 'user', text: transcript });

        const lowercaseTranscript = transcript.toLowerCase().trim();
        
        // Intercept resume unfinished session command
        if (
          lowercaseTranscript.includes("continue a session") || 
          lowercaseTranscript.includes("didn't finish") || 
          lowercaseTranscript.includes("resume my session") || 
          lowercaseTranscript.includes("continue my session") || 
          lowercaseTranscript.includes("unfinished session")
        ) {
          if (unfinishedSessions && unfinishedSessions.length > 0) {
            setShowUnfinishedModal(true);
            setIsThinking(false);
            if (isCallActiveRef.current) {
              speak(appLanguage === 'English' ? 'Showing your unfinished sessions.' : 'ያልተጠናቀቁ ክፍለ ጊዜዎችዎን በማሳየት ላይ።');
            }
            return;
          }
        }

        // Intercept "new" command to start a brand new diagnostic session immediately
        if (
          lowercaseTranscript === "new" || 
          lowercaseTranscript === "new session" || 
          lowercaseTranscript === "start new" || 
          lowercaseTranscript === "start new diagnosis" || 
          lowercaseTranscript === "start new diagnostic session"
        ) {
          if (startDiagnosticSession) {
            setIsThinking(false);
            startDiagnosticSession(true); // forceNew = true
            return;
          }
        }

        const isIntroSpeech = 
          /introduce\s*your\s*self|introduce\s*yourself|who\s*are\s*you|who\s*is\s*divya|ራስሽን\s*አስተዋውቂ|ማነሽ|ማነህ|አስተዋውቂ/i.test(lowercaseTranscript);

        if (isIntroSpeech) {
          const amharicIntroductionText = `ሰላም! እኔ ዲቭያ (Divya) እባላለሁ - የጤና ረዳትዎ እና ክሊኒካዊ የአመጋገብ ባለሙያ ነኝ። ምልክት-ደጋፊ ክሊኒካዊ ግምገማዎችን፣ የዕለት ተዕለት ተግባራትን እና ብጁ የአመጋገብ እቅዶችን ለእርስዎ ለማዘጋጀት ተዘጋጅቻለሁ። የጤና ሪፖርቶችዎን በ Google Drive ማስቀመጥ፣ ቀጠሮዎችዎን በ Google Calendar ማስተዳደር፣ እና መድሃኒትዎን በ Alarm መውሰጃ ሰዓት ማስተካከል እችላለሁ።`;
          const englishIntroductionText = `Hello! I am Divya, your health assistant and Clinical Nutritionist. I am designed to guide you through clinical health assessments, daily routine plans, and interactive nutrition therapy. 

Here is what I do:
1. **Clinical Health Diagnosis**: Evaluates symptoms, provides relief advice, and recommends tests.
2. **Interactive Clinical Nutrition**: Customizes macros, tracks vitamins/minerals, and suggests middle-class affordable traditional Ethiopian meals (such as Injera, Shiro, and Misir).
3. **Seamless Digital Integrations**:
   - 📂 **Google Drive**: Auto-saves your reports and clinical diagnostics securely.
   - 📅 **Google Calendar**: Manages and schedules your check-up appointments automatically.
   - ⏰ **Alarm App**: Seamlessly syncs medication and supplement reminders.`;

          const introText = appLanguage === 'English' ? englishIntroductionText : amharicIntroductionText;

          setMessages(prev => [...prev, {
            id: Date.now() + 2,
            role: 'ai',
            text: introText,
            isIntroduction: true,
            translatedTo: appLanguage
          }]);
          conversationHistoryRef.current.push({ role: 'ai', text: introText });
          setIsThinking(false);
          if (setIsIntroModalOpen) setIsIntroModalOpen(true);

          if (isTtsEnabled) {
            speak(appLanguage === 'English' ? englishIntroductionText : amharicIntroductionText, Date.now() + 2);
          }
          return;
        }
      }
      const cleanAiResponse = aiResponse.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      setMessages(prev => [...prev, { id: Date.now() + 2, role: 'ai', text: cleanAiResponse, translatedTo: appLanguage }]);
      conversationHistoryRef.current.push({ role: 'ai', text: cleanAiResponse });
      saveNote(cleanAiResponse);
      setIsThinking(false);

      if (isCallActiveRef.current) {
        speak(stripMarkdownForSpeech(cleanAiResponse));
      }
    } catch (err) {
      console.error('Gemini audio error:', err);
      setIsThinking(false);
      if (isCallActiveRef.current) startListening();
    }
  };

  // ── Text message processing ───────────────────────────────────────────────
  const handleTextSubmit = async (text, attachment = null) => {
    setInputText('');
    setIsThinking(true);
    lastSubmittedTextRef.current = text;
    abortControllerRef.current = new AbortController();

    const userMsg = { id: Date.now() + 1, role: 'user', text };
    if (attachment) {
      userMsg.attachment = { url: attachment.url, type: attachment.mimeType.startsWith('image/') ? 'image' : 'file', name: attachment.name };
    }
    setMessages(prev => [...prev, userMsg]);
    conversationHistoryRef.current.push({ role: 'user', text: attachment ? `[Attached ${attachment.name}] ${text}` : text });

    // Check if the user is asking to resume an unfinished session
    const lowercaseText = text.toLowerCase().trim();
    if (
      lowercaseText.includes("continue a session") || 
      lowercaseText.includes("didn't finish") || 
      lowercaseText.includes("resume my session") || 
      lowercaseText.includes("continue my session") || 
      lowercaseText.includes("unfinished session")
    ) {
      if (unfinishedSessions && unfinishedSessions.length > 0) {
        setShowUnfinishedModal(true);
        setIsThinking(false);
        setInputText('');
        return;
      }
    }

    // Check if the user is asking to start a brand new diagnostic session
    if (
      lowercaseText === "new" || 
      lowercaseText === "new session" || 
      lowercaseText === "start new" || 
      lowercaseText === "start new diagnosis" || 
      lowercaseText === "start new diagnostic session"
    ) {
      if (startDiagnosticSession) {
        setIsThinking(false);
        setInputText('');
        startDiagnosticSession(true); // forceNew = true
        return;
      }
    }

    // Check if the user is asking for an introduction
    const isIntroRequest = 
      /introduce\s*your\s*self|introduce\s*yourself|who\s*are\s*you|who\s*is\s*divya|ራስሽን\s*አስተዋውቂ|ማነሽ|ማነህ|አስተዋውቂ/i.test(lowercaseText);

    if (isIntroRequest) {
      setTimeout(() => {
        const amharicIntroductionText = `ሰላም! እኔ ዲቭያ (Divya) እባላለሁ - የጤና ረዳትዎ እና ክሊኒካዊ የአመጋገብ ባለሙያ ነኝ። ምልክት-ደጋፊ ክሊኒካዊ ግምገማዎችን፣ የዕለት ተዕለት ተግባራትን እና ብጁ የአመጋገብ እቅዶችን ለእርስዎ ለማዘጋጀት ተዘጋጅቻለሁ። የጤና ሪፖርቶችዎን በ Google Drive ማስቀመጥ፣ ቀጠሮዎችዎን በ Google Calendar ማስተዳደር፣ እና መድሃኒትዎን በ Alarm መውሰጃ ሰዓት ማስተካከል እችላለሁ።`;
        const englishIntroductionText = `Hello! I am Divya, your health assistant and Clinical Nutritionist. I am designed to guide you through clinical health assessments, daily routine plans, and interactive nutrition therapy. 

Here is what I do:
1. **Clinical Health Diagnosis**: Evaluates symptoms, provides relief advice, and recommends tests.
2. **Interactive Clinical Nutrition**: Customizes macros, tracks vitamins/minerals, and suggests middle-class affordable traditional Ethiopian meals (such as Injera, Shiro, and Misir).
3. **Seamless Digital Integrations**:
   - 📂 **Google Drive**: Auto-saves your reports and clinical diagnostics securely.
   - 📅 **Google Calendar**: Manages and schedules your check-up appointments automatically.
   - ⏰ **Alarm App**: Seamlessly syncs medication and supplement reminders.`;

        const introText = appLanguage === 'English' ? englishIntroductionText : amharicIntroductionText;

        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          role: 'ai',
          text: introText,
          isIntroduction: true,
          translatedTo: appLanguage
        }]);
        conversationHistoryRef.current.push({ role: 'ai', text: introText });
        setIsThinking(false);
        if (setIsIntroModalOpen) setIsIntroModalOpen(true);

        // Automatically speak the audio
        if (isTtsEnabled) {
          if (appLanguage === 'English') {
            speak(englishIntroductionText, Date.now() + 2);
          } else {
            speak(amharicIntroductionText, Date.now() + 2);
          }
        }
      }, 1000);
      return;
    }

    try {
      const conversationHistory = conversationHistoryRef.current.filter(m => m.role !== 'system');
      const historyText = conversationHistory
        .map(m => `${m.role === 'user' ? 'Patient' : 'Doctor'}: ${m.text}`)
        .join('\n');

      const targetLangStr = appLanguage === 'English' ? 'English' : 'Amharic (አማርኛ)';
      const isMobile = window.innerWidth < 768;
      let prompt;
      const isDiagnostic = conversationHistoryRef.current.some(m => m.role === 'system' && (m.text.includes("You are Divya") || m.text.includes("structured conversation") || m.text.includes("DIAGNOSTIC") || m.text.includes("PHASE 1")));

      if (isDiagnostic) {
        prompt = historyText
          ? `Previous conversation:\n${historyText}\n\nThe patient just answered. Respond strictly according to your structured diagnostic flow instruction and system guidelines in ${targetLangStr} only. Ask only one follow-up question, or output the structured clinical report with assessment and nutrition plan JSON if the session has concluded.`
          : `The patient just started the session. Greet them and ask the first diagnostic question as instructed in your system guidelines in ${targetLangStr} only.`;
      } else if (isThinkingMode) {
        if (isMobile) {
          prompt = historyText
            ? `Previous conversation:\n${historyText}\n\nThe patient just sent a message. Provide a concise, clear, and highly focused thinking-mode medical response in ${targetLangStr} only (or Amharic if they speak/write in Amharic or ask for it). Limit response length to be compact and easily readable on a mobile screen (around 150-200 words max), focusing only on the most essential details, direct treatment options, and clear recommendations.`
            : `The patient just sent a message. Provide a concise, clear, and highly focused thinking-mode medical response in ${targetLangStr} only (or Amharic if they speak/write in Amharic or ask for it). Limit response length to be compact and easily readable on a mobile screen (around 150-200 words max), focusing only on the most essential details, direct treatment options, and clear recommendations.`;
        } else {
          prompt = historyText
            ? `Previous conversation:\n${historyText}\n\nThe patient just sent a message. Provide a highly detailed, comprehensive, in-depth thinking-mode response in ${targetLangStr} only (or Amharic if they speak/write in Amharic or ask for it). Do not limit response length; write comprehensive and extensive text explaining details, treatment options, scientific context, and clear recommendations.`
            : `The patient just sent a message. Provide a highly detailed, comprehensive, in-depth thinking-mode response in ${targetLangStr} only (or Amharic if they speak/write in Amharic or ask for it). Do not limit response length; write comprehensive and extensive text explaining details, treatment options, scientific context, and clear recommendations.`;
        }
      } else {
        prompt = historyText
          ? `Previous conversation:\n${historyText}\n\nThe patient just sent a message. Respond as a health assistant in ${targetLangStr} only (or Amharic if they speak/write in Amharic or ask for it). Keep it 2-3 sentences max.`
          : `The patient just sent a message. Respond as a health assistant in ${targetLangStr} only (or Amharic if they speak/write in Amharic or ask for it). Keep it 2-3 sentences max.`;
      }

      const parts = [];
      if (attachment) {
        parts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.data } });
      }
      parts.push({ text: prompt });

      const requestBody = {
        contents: [{ role: 'user', parts }],
        systemInstruction: {
          parts: [{
            text: (() => {
              const systemMsg = conversationHistoryRef.current.find(m => m.role === 'system');
              let basePrompt = systemMsg ? systemMsg.text : (customSystemPrompt ? customSystemPrompt : getMcpSystemInstructions(targetLangStr, isThinkingMode, appLanguage));
              if (masterReport && masterReport.messages) {
                const reportText = masterReport.messages.map(m => m.text).join("\n");
                basePrompt += `\n\nACTIVE MEDICAL SESSION REPORT / PLAN CONTEXT:\n${reportText}\nIf the user asks you to save, back up, or export their session report or plan (e.g. "Backup my Session report"), you MUST use the "backup_session_report" tool and pass this active plan text as the "content" parameter!`;
              }
              return basePrompt;
            })()
          }]
        }
      };

      // Real MCP Tool Discovery & Gemini Function Calling Loop
      const mcpTools = mcpManager.getGeminiTools();
      if (mcpTools) {
        // Strip any $schema keys which cause Gemini API payload rejections
        const sanitizedTools = JSON.parse(JSON.stringify(mcpTools, (key, value) => {
          if (key === '$schema') return undefined;
          return value;
        }));
        requestBody.tools = sanitizedTools;
      }

      let data = await callGemini(
        geminiUrl(aiModel || 'gemini-2.5-flash'),
        requestBody,
        abortControllerRef.current?.signal
      );

      let hasFunctionCalls = true;
      let loopCount = 0;
      const maxLoops = 5;

      while (hasFunctionCalls && loopCount < maxLoops) {
        const candidate = data.candidates?.[0];
        const functionCalls = candidate?.content?.parts?.filter(p => p.functionCall);

        if (functionCalls && functionCalls.length > 0) {
          loopCount++;

          // Append model's response (containing functionCalls) to history
          requestBody.contents.push({
            role: "model",
            parts: candidate.content.parts
          });

          const responseParts = [];
          for (const part of functionCalls) {
            const { name, args } = part.functionCall;
            try {
              const result = await mcpManager.executeTool(name, args);
              responseParts.push({
                functionResponse: {
                  name,
                  response: result
                }
              });
            } catch (err) {
              console.error(`[MCP] Error executing tool ${name}:`, err);
              responseParts.push({
                functionResponse: {
                  name,
                  response: { error: err.message || "Failed to execute tool" }
                }
              });
            }
          }

          // Append user/system's tool output parts to history
          requestBody.contents.push({
            role: "user",
            parts: responseParts
          });

          // Re-call Gemini with updated contents
          data = await callGemini(
            geminiUrl(aiModel || 'gemini-2.5-flash'),
            requestBody,
            abortControllerRef.current?.signal
          );
        } else {
          hasFunctionCalls = false;
        }
      }

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const responseMatch = rawText.includes("TRANSCRIPT:") ? rawText.match(/RESPONSE:\s*([\s\S]*?)$/i) : null;
      const aiResponse = responseMatch ? responseMatch[1].trim() : rawText.trim();

      // Clean up duplicate/excessive vertical spacing (no more than 2 consecutive newlines)
      const cleanAiResponse = aiResponse.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

      setMessages(prev => [...prev, { id: Date.now() + 2, role: 'ai', text: cleanAiResponse, translatedTo: appLanguage }]);
      conversationHistoryRef.current.push({ role: 'ai', text: cleanAiResponse });
      saveNote(cleanAiResponse);
      setIsThinking(false);
      lastSubmittedTextRef.current = '';
      abortControllerRef.current = null;

      if (isCallActiveRef.current) {
        speak(stripMarkdownForSpeech(cleanAiResponse));
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Gemini text error:', err);
      setIsThinking(false);
      lastSubmittedTextRef.current = '';

      setMessages(prev => {
        const newMsgs = [...prev];
        for (let i = newMsgs.length - 1; i >= 0; i--) {
          if (newMsgs[i].role === 'user') {
            newMsgs[i] = { ...newMsgs[i], hasError: true, errorMessage: err.message || 'Failed to send' };
            break;
          }
        }
        return newMsgs;
      });
    }
  };

  // ── Translation ───────────────────────────────────────────────────────────
  const translateMessage = async (msgId, originalText, targetLang, setTranslatingId) => {
    setTranslatingId(msgId);
    try {
      // Split by \n--- to only translate the message body and keep sources intact
      const parts = originalText.split(/\n---+\n/);
      const textToTranslate = parts[0].trim();
      const referencesSection = parts.length > 1 ? '\n---\n' + parts.slice(1).join('\n') : '';

      const prompt = `You are a professional medical translator. Translate the following text to ${targetLang}. Return ONLY the translated text — no explanations, no extra words.\n\nText: ${textToTranslate}`;
      const data = await callGemini(geminiUrl(aiModel || 'gemini-2.5-flash'), {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (translatedText) {
        const finalTranslatedText = translatedText + referencesSection;
        setMessages(prev =>
          prev.map(m => m.id === msgId
            ? { ...m, text: finalTranslatedText, originalText: m.originalText || originalText, translatedTo: targetLang }
            : m
          )
        );
      }
    } catch (err) {
      console.error('Translation error:', err);
      // Show friendly error to user instead of failing silently
      alert(
        err.message.includes('503') || err.message.toLowerCase().includes('high demand')
          ? 'Google Gemini servers are currently experiencing very high demand (503 Service Unavailable). Please try translating again in a few moments.'
          : `Translation failed: ${err.message}`
      );
    } finally {
      setTranslatingId(null);
    }
  };

  return { processAudio, handleTextSubmit, translateMessage };
}
