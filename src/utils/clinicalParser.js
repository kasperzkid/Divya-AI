export const parseClinicalReport = (text) => {
  if (!text) return null;

  const sections = {
    opening: '',
    assessment: '',
    relief: [],
    tests: [],
    warningSigns: [],
    disclaimer: '',
    keyTerms: [],
    references: []
  };

  const lines = text.split('\n');
  let currentSection = 'opening';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for section transitions
    if (/ASSESSMENT:/i.test(trimmed)) {
      currentSection = 'assessment';
      continue;
    } else if (/TEMPORARY\s+RELIEF:/i.test(trimmed)) {
      currentSection = 'relief';
      continue;
    } else if (/RECOMMENDED\s+TESTS:/i.test(trimmed)) {
      currentSection = 'tests';
      continue;
    } else if (/SEE\s+A\s+DOCTOR\s+IF:/i.test(trimmed)) {
      currentSection = 'warningSigns';
      continue;
    } else if (/DISCLAIMER:/i.test(trimmed)) {
      currentSection = 'disclaimer';
      continue;
    } else if (/Key\s+Terms:/i.test(trimmed)) {
      currentSection = 'keyTerms';
      continue;
    } else if (/References:/i.test(trimmed)) {
      currentSection = 'references';
      continue;
    } else if (trimmed === '---') {
      continue;
    }

    // Append to current section
    if (currentSection === 'opening') {
      if (trimmed) sections.opening += (sections.opening ? '\n' : '') + line;
    } else if (currentSection === 'assessment') {
      if (trimmed) sections.assessment += (sections.assessment ? '\n' : '') + line;
    } else if (currentSection === 'relief') {
      if (trimmed && (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed) || trimmed.startsWith('!['))) {
        sections.relief.push(line);
      } else if (trimmed && sections.relief.length > 0) {
        sections.relief[sections.relief.length - 1] += '\n' + line;
      }
    } else if (currentSection === 'tests') {
      if (trimmed && (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed) || trimmed.startsWith('!['))) {
        sections.tests.push(line);
      } else if (trimmed && sections.tests.length > 0) {
        sections.tests[sections.tests.length - 1] += '\n' + line;
      }
    } else if (currentSection === 'warningSigns') {
      if (trimmed && (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed) || trimmed.startsWith('!['))) {
        sections.warningSigns.push(line);
      } else if (trimmed && sections.warningSigns.length > 0) {
        sections.warningSigns[sections.warningSigns.length - 1] += '\n' + line;
      }
    } else if (currentSection === 'disclaimer') {
      if (trimmed) sections.disclaimer += (sections.disclaimer ? '\n' : '') + line;
    } else if (currentSection === 'keyTerms') {
      if (trimmed && trimmed.includes('|') && !trimmed.includes('---') && !trimmed.includes('Term | Definition')) {
        sections.keyTerms.push(line);
      }
    } else if (currentSection === 'references') {
      if (trimmed) {
        sections.references.push(line);
      }
    }
  }

  return sections;
};

export const cleanItemText = (raw) => {
  if (!raw) return '';
  return raw.replace(/^[\s*\-\d\.\•]+\s*/, '').replace(/\*\//g, '').replace(/\*\*/g, '');
};

export const getDiagnosticReportData = (report, appLanguage) => {
  if (!report || !report.messages) return null;
  const conclusion = report.messages.find(m => m.role === 'ai' && (m.text.includes('ASSESSMENT:') || m.text.includes('TEMPORARY RELIEF:')));
  if (!conclusion) return null;
  
  const text = conclusion.text;
  const data = parseClinicalReport(text);
  if (!data) return null;

  let probableDisease = appLanguage === 'English' ? 'Inconclusive' : 'ግልጽ ያልሆነ';
  if (data.assessment) {
    const diseaseMatch = data.assessment.match(/(?:Probable Condition|Disease|ሊሆን የሚችል የጤና ሁኔታ|የጤና ሁኔታ):\s*([^\n.]+)/i);
    if (diseaseMatch) {
      probableDisease = diseaseMatch[1].trim();
    } else {
      const firstSentence = data.assessment.split(/[.\n]/)[0];
      probableDisease = firstSentence.substring(0, 60).trim();
    }
  }

  let probableCause = appLanguage === 'English' ? 'Awaiting further diagnostics' : 'ተጨማሪ ምርመራዎች ያስፈልጋሉ';
  if (data.assessment) {
    const causeMatch = data.assessment.match(/(?:Primary Cause|Cause|ዋነኛ መንስኤ|መንስኤ):\s*([^\n.]+)/i);
    if (causeMatch) {
      probableCause = causeMatch[1].trim();
    } else {
      probableCause = data.assessment.split(/[.\n]/).slice(1).join('. ').substring(0, 100).trim() || probableCause;
    }
  }

  let severity = 5;
  const severityMatch = text.match(/(?:Severity|የህመም ደረጃ|የህመም ከባድነት):\s*(\d+)/i);
  if (severityMatch) {
    severity = Math.min(10, Math.max(1, parseInt(severityMatch[1], 10)));
  } else if (/urgent|ከባድ|አስቸኳይ/i.test(text)) {
    severity = 8;
  } else if (/mild|ቀላል/i.test(text)) {
    severity = 3;
  }

  const finalWellness = Math.max(10, Math.min(100, 100 - severity * 10 + Math.floor(Math.random() * 10)));
  const mapScoreToY = (score) => 90 - (score / 100) * 80;

  const yToday = mapScoreToY(finalWellness);
  const y3 = Math.min(90, Math.max(10, yToday + (Math.random() * 10 + 2)));
  const y2 = Math.min(90, Math.max(10, y3 + (Math.random() * 10 + 2)));
  const y1 = Math.min(90, Math.max(10, y2 + (Math.random() * 10 + 5)));

  return {
    severity,
    finalWellness,
    probableDisease,
    probableCause,
    y1,
    y2,
    y3,
    yToday
  };
};
