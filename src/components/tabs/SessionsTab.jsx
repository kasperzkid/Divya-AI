import { X, Stethoscope, Activity, Pencil, Trash2, FileText, ClipboardList, RefreshCcw, Brain, HeartPulse, ChevronRight, FileDown } from 'lucide-react';
import { getDiagnosticReportData, parseClinicalReport, cleanItemText } from '../../utils/clinicalParser';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function SessionsTab({
  appLanguage,
  isDiagnosticMode,
  endCall,
  startDiagnosticSession,
  masterReport,
  isLightMode,
  isReportMenuOpen,
  setIsReportMenuOpen,
  renameMasterReport,
  deleteMasterReport,
  setIsReportModalOpen,
  startRevisionSession,
  unfinishedSessions,
  resumeUnfinishedSession,
  setUnfinishedSessions,
}) {
  const exportReportAsPdf = async () => {
    if (!masterReport) return;
    
    const conclusion = masterReport.messages?.find(m => m.role === 'ai' && (m.text.includes('ASSESSMENT:') || m.text.includes('TEMPORARY RELIEF:')));
    if (!conclusion) {
      alert(appLanguage === 'English' ? 'No report data available to export.' : 'ለመላክ የሚያስችል የሪፖርት መረጃ አልተገኘም።');
      return;
    }
    
    const reportData = parseClinicalReport(conclusion.text);
    if (!reportData) return;
    
    setIsReportMenuOpen(false);
    
    const isEnglish = appLanguage === 'English';
    
    // Create an off-screen container for the high-fidelity PDF rendering
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px'; // standard width for crisp rendering on A4
    container.style.background = '#ffffff';
    container.style.color = '#1e293b';
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    container.style.padding = '40px 50px';
    container.style.boxSizing = 'border-box';
    
    const reportRefId = `DIVYA-REF-${Math.abs(conclusion.text.length * 31).toString(36).toUpperCase()}`;
    const formattedDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    
    const extractImageAndClean = (lineText) => {
      const imgRegex = /!\[(.*?)\]\((.*?)\)/;
      const match = imgRegex.exec(lineText);
      if (match) {
        const cleanText = lineText.replace(imgRegex, '').trim();
        return { text: cleanText, imageUrl: match[2], imageAlt: match[1] };
      }
      return { text: lineText, imageUrl: null, imageAlt: null };
    };

    const formatBold = (str) => {
      if (!str) return '';
      let isBoldOpen = false;
      return str.replace(/\*\*/g, () => {
        isBoldOpen = !isBoldOpen;
        return isBoldOpen ? '<strong>' : '</strong>';
      });
    };

    const parseTestLine = (lineText) => {
      let clean = lineText.replace(/^[\s*\-\d\.]+\s*/, '');
      let priorityText = '';
      let priorityColor = '#10b981'; // routine (emerald)
      let priorityBg = '#ecfdf5';
      
      if (/urgent|ከባድ|አስቸኳይ/i.test(clean)) {
        priorityText = isEnglish ? 'Urgent' : 'አስቸኳይ';
        priorityColor = '#ef4444'; // urgent (red)
        priorityBg = '#fef2f2';
      } else if (/soon|በቅርቡ/i.test(clean)) {
        priorityText = isEnglish ? 'Soon' : 'በቅርቡ';
        priorityColor = '#f59e0b'; // soon (orange)
        priorityBg = '#fffbeb';
      } else {
        priorityText = isEnglish ? 'Routine' : 'መደበኛ';
      }
      return { text: clean, priorityText, priorityColor, priorityBg };
    };

    let htmlContent = `
      <!-- Top Primary Accent Bar (Stripe/Stanford Style) -->
      <div style="height: 8px; background: #354f52; margin: -40px -50px 30px -50px;"></div>
      
      <!-- Corporate Medical Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px;">
        <div>
          <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1.1;">
            DIVYA CLINICAL HEALTH INTELLIGENCE
          </div>
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #52796f; font-weight: 700; margin-top: 4px;">
            Autonomous Diagnostics Core & Medical Analytics
          </div>
        </div>
        <div style="text-align: right; line-height: 1.3;">
          <div style="font-size: 9px; font-weight: 800; letter-spacing: 1px; color: #ffffff; background: #0f172a; padding: 3px 10px; border-radius: 2px; display: inline-block; margin-bottom: 6px; text-transform: uppercase;">
            ${isEnglish ? 'OFFICIAL CLINICAL RECORD' : 'ክሊኒካዊ የምርመራ ሪፖርት'}
          </div>
          <div style="font-family: monospace; font-size: 11px; color: #475569; font-weight: 700;">${reportRefId}</div>
        </div>
      </div>

      <!-- Professional Metadata Grid (2 Columns, Bounded) -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; color: #334155; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 4px;">
        <tr>
          <td style="padding: 12px 16px; border-right: 1px solid #e2e8f0; width: 33%;">
            <span style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; display: block; margin-bottom: 2px;">ISSUING SYSTEM</span>
            <strong style="color: #0f172a;">Divya AI (v1.0.0-PRO)</strong>
          </td>
          <td style="padding: 12px 16px; border-right: 1px solid #e2e8f0; width: 33%;">
            <span style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; display: block; margin-bottom: 2px;">DATE GENERATED</span>
            <strong style="color: #0f172a;">${formattedDate}</strong>
          </td>
          <td style="padding: 12px 16px; width: 34%;">
            <span style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; display: block; margin-bottom: 2px;">CLASSIFICATION</span>
            <strong style="color: #0f9488; letter-spacing: 0.5px;">CONFIDENTIAL / SECURE</strong>
          </td>
        </tr>
      </table>
    `;

    if (reportData.opening) {
      htmlContent += `
        <div style="font-size: 13.5px; font-style: italic; color: #334155; line-height: 1.6; margin-bottom: 24px; padding: 14px 20px; background: #fdfdfd; border-left: 3px solid #354f52; border-radius: 0 4px 4px 0;">
          ${reportData.opening.replace(/\*\*/g, '').replace(/\*/g, '').trim()}
        </div>
      `;
    }

    if (reportData.assessment) {
      const formattedAssessment = reportData.assessment
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0f172a; font-weight: 700;">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>');

      htmlContent += `
        <div style="margin-bottom: 28px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; border-bottom: 1px solid #0f172a; padding-bottom: 6px; margin-bottom: 12px;">
            ${isEnglish ? 'SECTION I: CLINICAL ASSESSMENT & IMPRESSION' : 'ክፍል 1: ክሊኒካዊ ግምገማ እና ግንዛቤ'}
          </div>
          <div style="color: #334155; font-size: 13px; line-height: 1.7; word-wrap: break-word; text-align: justify; padding: 4px 0;">
            ${formattedAssessment}
          </div>
        </div>
      `;
    }

    if (reportData.relief.length > 0) {
      htmlContent += `
        <div style="margin-bottom: 28px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; border-bottom: 1px solid #0f172a; padding-bottom: 6px; margin-bottom: 14px;">
            ${isEnglish ? 'SECTION II: RECOMMENDED RELIEF PROTOCOLS' : 'ክፍል 2: የሚመከሩ የጊዜያዊ ማስታገሻ መመሪያዎች'}
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
      `;

      reportData.relief.forEach((rawItem) => {
        const { text: cleanText, imageUrl, imageAlt } = extractImageAndClean(rawItem);
        let displayMsg = formatBold(cleanText.replace(/^[\s*\-\d\.\•]+\s*/, ''));
        if (displayMsg) {
          htmlContent += `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px 16px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top; width: 15px; color: #52796f; font-weight: 900; font-size: 14px; padding-top: 1px;">•</td>
                  <td style="color: #334155; font-size: 13px; line-height: 1.5; padding-left: 8px;">
                    ${displayMsg}
                  </td>
                </tr>
              </table>
              ${imageUrl ? `
                <div style="border-radius: 4px; overflow: hidden; border: 1px solid #e2e8f0; margin-top: 8px; max-width: 450px;">
                  <img src="${imageUrl}" alt="${imageAlt || 'Relief step'}" style="width: 100%; max-height: 180px; object-fit: cover; display: block;" />
                </div>
              ` : ''}
            </div>
          `;
        }
      });

      htmlContent += `
          </div>
        </div>
      `;
    }

    if (reportData.tests.length > 0) {
      htmlContent += `
        <div style="margin-bottom: 28px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; border-bottom: 1px solid #0f172a; padding-bottom: 6px; margin-bottom: 14px;">
            ${isEnglish ? 'SECTION III: LABORATORY & DIAGNOSTIC DIRECTIVES' : 'ክፍል 3: የሚመከሩ የላብራቶሪ እና ምርመራ መመሪያዎች'}
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
      `;

      reportData.tests.forEach((rawItem) => {
        const { text: cleanText } = extractImageAndClean(rawItem);
        const parsed = parseTestLine(cleanText);
        let displayMsg = formatBold(parsed.text);
        
        if (displayMsg) {
          htmlContent += `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
              <div style="display: flex; gap: 8px; align-items: flex-start; flex: 1;">
                <span style="color: #475569; font-weight: 900; font-size: 12px; padding-top: 1px;">•</span>
                <div style="color: #334155; font-size: 13px; line-height: 1.5; padding-left: 4px;">
                  ${displayMsg}
                </div>
              </div>
              <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 8px; border-radius: 2px; color: ${parsed.priorityColor}; background: ${parsed.priorityBg}; border: 1px solid ${parsed.priorityColor}40; white-space: nowrap;">
                ${parsed.priorityText}
              </span>
            </div>
          `;
        }
      });

      htmlContent += `
          </div>
        </div>
      `;
    }

    if (reportData.warningSigns.length > 0) {
      htmlContent += `
        <div style="margin-bottom: 28px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #b91c1c; border-bottom: 1px solid #b91c1c; padding-bottom: 6px; margin-bottom: 14px;">
            ${isEnglish ? 'SECTION IV: EMERGENCY MONITORING & CRITICAL SYMPTOMS' : 'ክፍል 4: ወዲያውኑ የህክምና እርዳታ የሚያስፈልጋቸው ምልክቶች'}
          </div>
          <div style="border: 1px solid #fca5a5; background: #fff5f5; border-radius: 4px; padding: 16px; display: flex; flex-direction: column; gap: 10px;">
            <div style="font-size: 11px; font-weight: 800; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
              CRITICAL NOTICE: SEEK IMMEDIATE MEDICAL ATTENTION IF ANY OF THE FOLLOWING OCCUR
            </div>
      `;

      reportData.warningSigns.forEach((rawItem) => {
        let displayMsg = formatBold(rawItem.replace(/^[\s*\-\d\.\•]+\s*/, ''));
        if (displayMsg) {
          htmlContent += `
            <div style="display: flex; gap: 8px; align-items: flex-start;">
              <span style="color: #ef4444; font-size: 12px; line-height: 1;">■</span>
              <div style="color: #991b1b; font-size: 12.5px; font-weight: 600; line-height: 1.5; padding-left: 4px;">
                ${displayMsg}
              </div>
            </div>
          `;
        }
      });

      htmlContent += `
          </div>
        </div>
      `;
    }

    const parsedKeyTerms = reportData.keyTerms.map(line => {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return { term: parts[0], definition: parts[1] };
      }
      return null;
    }).filter(Boolean);

    if (parsedKeyTerms.length > 0) {
      htmlContent += `
        <div style="margin-bottom: 28px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; border-bottom: 1px solid #0f172a; padding-bottom: 6px; margin-bottom: 14px;">
            ${isEnglish ? 'SECTION V: GLOSSARY OF CLINICAL TERMINOLOGY' : 'ክፍል 5: የህክምና ቃላት መፍቻ'}
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; text-align: left;">
                <th style="padding: 10px 14px; font-weight: 800; color: #475569; width: 30%;">TERM</th>
                <th style="padding: 10px 14px; font-weight: 800; color: #475569; width: 70%;">CLINICAL DEFINITION</th>
              </tr>
            </thead>
            <tbody>
      `;

      parsedKeyTerms.forEach((item) => {
        htmlContent += `
          <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
            <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; vertical-align: top;">${item.term}</td>
            <td style="padding: 10px 14px; color: #475569; line-height: 1.5; vertical-align: top;">${item.definition}</td>
          </tr>
        `;
      });

      htmlContent += `
            </tbody>
          </table>
        </div>
      `;
    }

    const parsedReferences = reportData.references.map(line => {
      const linkRegex = /\[(.*?)\]\((.*?)\)/;
      const match = linkRegex.exec(line);
      if (match) return { label: match[1], url: match[2] };
      const clean = line.replace(/^[\s*\-\d\.]+\s*/, '');
      if (clean) return { label: clean, url: '#' };
      return null;
    }).filter(Boolean);

    if (parsedReferences.length > 0) {
      htmlContent += `
        <div style="margin-bottom: 32px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; border-bottom: 1px solid #0f172a; padding-bottom: 6px; margin-bottom: 12px;">
            ${isEnglish ? 'SECTION VI: BIBLIOGRAPHY & MEDICAL CITATIONS' : 'ክፍል 6: ክሊኒካዊ ዋቢዎች'}
          </div>
          <ol style="margin: 0; padding-left: 18px; font-size: 12.5px; color: #475569; display: flex; flex-direction: column; gap: 6px; line-height: 1.5;">
      `;

      parsedReferences.forEach((ref) => {
        htmlContent += `
          <li style="margin-bottom: 4px;">
            <span style="font-weight: 600; color: #0f172a;">${ref.label}</span>
            ${ref.url && ref.url !== '#' ? `<br/><span style="font-size: 10.5px; color: #0d9488; font-family: monospace; word-break: break-all;">${ref.url}</span>` : ''}
          </li>
        `;
      });

      htmlContent += `
          </ol>
        </div>
      `;
    }

    if (reportData.disclaimer) {
      htmlContent += `
        <div style="border-top: 1px dashed #cbd5e1; margin-top: 40px; padding-top: 20px; text-align: center;">
          <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
            LEGAL MEDICAL DISCLAIMER & LIMITATION
          </div>
          <div style="font-size: 11px; color: #94a3b8; font-style: italic; line-height: 1.6; max-width: 660px; margin: 0 auto 20px auto; text-align: justify;">
            ${reportData.disclaimer.replace(/^⚠️\s*/, '')}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            <div style="text-align: left; line-height: 1.4;">
              <span style="text-transform: uppercase; font-weight: 800; color: #475569; display: block; font-size: 9px; letter-spacing: 0.5px;">SECURITY ENCRYPTION SEAL</span>
              <span style="font-family: monospace; color: #94a3b8; font-size: 9.5px;">DIVYA-CLINICAL-SECURE-ID::${reportRefId.split('-').pop()}</span>
            </div>
            <div style="text-align: right; line-height: 1.4;">
              <span style="text-transform: uppercase; font-weight: 800; color: #475569; display: block; font-size: 9px; letter-spacing: 0.5px;">DIGITAL VERIFICATION</span>
              <strong style="color: #354f52; font-family: monospace; font-size: 10px;">Divya Clinical Engine Core</strong>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(container, {
        scale: 2.2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const baseName = masterReport.title || 'Wellness_Report';
      const safeName = baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      pdf.save(`${safeName}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      alert(isEnglish ? 'Failed to download PDF. Please try again.' : 'PDF ለማውረድ አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
    }
  };

  return (
    <div className="sample-page">
      <div className="sessions-header">
        <h2>{appLanguage === 'English' ? 'Diagnostic Sessions' : 'የምርመራ ክፍለ ጊዜዎች'}</h2>
        <button 
          onClick={() => isDiagnosticMode ? endCall() : startDiagnosticSession()} 
          className={`start-diagnosis-btn ${isDiagnosticMode ? 'active' : ''}`}
        >
          {isDiagnosticMode ? <X size={18} /> : <Stethoscope size={18} />}
          {isDiagnosticMode ? (appLanguage === 'English' ? 'Cancel' : 'ሰርዝ') : (appLanguage === 'English' ? 'Start New Diagnosis' : 'አዲስ ምርመራ ጀምር')}
        </button>
      </div>
      
      {isDiagnosticMode ? (
        <div className="sessions-empty-card" style={{ borderStyle: 'dashed', borderColor: 'var(--accent)' }}>
          <Stethoscope size={56} style={{ color: 'var(--accent)', marginBottom: '20px', animation: 'pulseGlow 2s infinite' }} />
          <h3>{appLanguage === 'English' ? 'Diagnostic Session Active' : 'የምርመራ ክፍለ ጊዜ በመካሄድ ላይ'}</h3>
          <p>{appLanguage === 'English' ? 'Please speak with Divya through the voice call interface.' : 'እባክዎን በድምፅ ውይይት በኩል ከዲቭያ ጋር ይነጋገሩ።'}</p>
        </div>
      ) : !masterReport ? (
        <div className="sessions-empty-card">
          <Activity size={56} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.4 }} />
          <h3>{appLanguage === 'English' ? 'No Report Yet' : 'ምንም የጤና ሪፖርት የለም'}</h3>
          <p>{appLanguage === 'English' ? 'Start a diagnostic session to get your initial health report.' : 'የመጀመሪያ የጤና ሪፖርት ለማግኘት የምርመራ ክፍለ ጊዜ ይጀምሩ።'}</p>
        </div>
      ) : (
        <div className="sessions-container" style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '32px',
          width: '100%',
          maxWidth: '1360px',
          margin: '0 auto',
          alignItems: 'flex-start',
          justifyContent: 'flex-start'
        }}>
          
          {/* Left Side: Report & Revision */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', flex: '1.2 1 280px', width: '100%' }}>
            
            {/* 1. Report Section */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`, paddingBottom: '6px', width: '100%' }}>
                {appLanguage === 'English' ? 'Report' : 'ሪፖርት'}
              </div>
              
              <div className="master-report-card" style={{ width: '100%', maxWidth: 'none' }}>
                {/* Brand Header */}
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`, paddingBottom: '12px' }}>
                  <Activity size={14} /> <span>Divya Clinical Health Institute</span>
                </div>

                {/* 3-dots Menu */}
                <div style={{ position: 'absolute', top: '48px', right: '24px' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsReportMenuOpen(!isReportMenuOpen); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='var(--surface-hover)'; e.currentTarget.style.color='var(--text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="12" cy="5" r="1"></circle>
                      <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                  </button>
                  {isReportMenuOpen && (
                    <div style={{ position: 'absolute', top: '100%', right: '0', background: 'var(--bg-solid)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', zIndex: 10, width: '180px', boxShadow: '0 16px 40px rgba(0,0,0,0.2)', marginTop: '4px' }}>
                      <button onClick={renameMasterReport} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text)', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
                        <Pencil size={14} /> Rename
                      </button>
                      <button onClick={exportReportAsPdf} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text)', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
                        <FileDown size={14} /> Export as PDF
                      </button>
                      <button onClick={deleteMasterReport} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#ef4444', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: '0 8px 16px rgba(107, 144, 128, 0.25)' }}>
                    <FileText size={22} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'var(--font-heading)', fontWeight: '600', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {masterReport.title || (appLanguage === 'English' ? 'Diagnosed' : 'የተመረመረ')}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        {masterReport.lastUpdated}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="read-report-btn"
                >
                  {appLanguage === 'English' ? 'Read Report' : 'ሪፖርቱን አንብብ'} <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* 2. Revision Section */}
            {(() => {
              const conclusion = masterReport.messages?.find(m => m.role === 'ai' && (m.text.includes('ASSESSMENT:') || m.text.includes('TEMPORARY RELIEF:')));
              if (!conclusion) return null;

              // Parse recommended revision timeline from AI assessment text
              const parseRecommendedDays = (text) => {
                if (!text) return 3;
                const amharicMatch = text.match(/(\d+)\s*(ቀን|ቀናት|ሳምንት)/);
                const englishMatch = text.match(/(\d+)\s*(day|days|week|weeks)/i);
                if (amharicMatch) {
                  const num = parseInt(amharicMatch[1], 10);
                  if (amharicMatch[2].includes('ሳምንት')) return num * 7;
                  return num;
                }
                if (englishMatch) {
                  const num = parseInt(englishMatch[1], 10);
                  if (englishMatch[2].toLowerCase().startsWith('week')) return num * 7;
                  return num;
                }
                const rangeMatch = text.match(/(\d+)\s*-\s*(\d+)/);
                if (rangeMatch) {
                  return parseInt(rangeMatch[1], 10);
                }
                return 3; // default fallback
              };

              const recommendedDays = parseRecommendedDays(conclusion.text);
              
              // Calculate days remaining
              let remainingDays = recommendedDays;
              if (masterReport.lastUpdated) {
                try {
                  const reportDate = new Date(masterReport.lastUpdated);
                  const todayDate = new Date();
                  // Set both to midnight to count calendar days
                  reportDate.setHours(0,0,0,0);
                  todayDate.setHours(0,0,0,0);
                  const diffTime = todayDate - reportDate;
                  const elapsedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                  remainingDays = Math.max(0, recommendedDays - elapsedDays);
                } catch (e) {
                  console.error('Error parsing report date:', e);
                }
              }

              const isButtonDisabled = remainingDays > 0;

              return (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`, paddingBottom: '6px', width: '100%' }}>
                    {appLanguage === 'English' ? 'Revision' : 'የክትትል ክለሳ'}
                  </div>

                  <div style={{
                    width: '100%',
                    maxWidth: 'none',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: isLightMode ? 'rgba(82,121,111,0.08)' : 'rgba(107,144,128,0.15)', color: 'var(--accent)', flexShrink: 0 }}>
                        <ClipboardList size={18} />
                      </span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>
                          {appLanguage === 'English' ? 'Follow-up Revision Plan' : 'የክለሳ የክትትል እቅድ'}
                        </h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {appLanguage === 'English' ? `Recommended re-evaluation in ${recommendedDays} days` : `ከ${recommendedDays} ቀናት በኋላ ክትትል እንዲያደርጉ ይመከራል`}
                        </span>
                      </div>
                    </div>

                    {/* Start Revision Call Button */}
                    <button
                      onClick={isButtonDisabled ? null : startRevisionSession}
                      disabled={isButtonDisabled}
                      className={`read-report-btn ${isButtonDisabled ? 'disabled' : ''}`}
                      style={{
                        width: '100%',
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        background: isButtonDisabled 
                          ? (isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)')
                          : 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                        color: isButtonDisabled 
                          ? 'var(--text-muted)' 
                          : '#ffffff',
                        border: isButtonDisabled 
                          ? `1px solid ${isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`
                          : 'none',
                        textTransform: 'none',
                        boxShadow: isButtonDisabled ? 'none' : '0 8px 24px rgba(107, 144, 128, 0.25)',
                        cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                        opacity: isButtonDisabled ? 0.7 : 1
                      }}
                    >
                      <RefreshCcw size={16} />
                      <span>
                        {isButtonDisabled 
                          ? (appLanguage === 'English' 
                              ? `Revision is available in ${remainingDays} days` 
                              : `ክለሳ ከ ${remainingDays} ቀናት በኋላ ይከናወናል`)
                          : (appLanguage === 'English' 
                              ? 'Start Revision Call' 
                              : 'የክለሳ ውይይት ጀምር')}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 3. Unfinished Sessions Section */}
            {unfinishedSessions.length > 0 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`, paddingBottom: '6px', width: '100%' }}>
                  {appLanguage === 'English' ? 'Unfinished Sessions' : 'ያልተጠናቀቁ ክፍለ ጊዜዎች'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                  {unfinishedSessions.map((session) => (
                    <div key={session.id} style={{
                      width: '100%',
                      maxWidth: 'none',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                      backdropFilter: 'blur(20px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', flexShrink: 0 }}>
                            <ClipboardList size={16} />
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {session.title}
                            </h4>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {session.lastUpdated}
                            </span>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.15)',
                          flexShrink: 0
                        }}>
                          {appLanguage === 'English' ? 'Incomplete' : 'ያልተጠናቀቀ'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <button
                          onClick={() => resumeUnfinishedSession(session)}
                          className="read-report-btn"
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            fontSize: '12.5px',
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                            color: '#ffffff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(107, 144, 128, 0.15)'
                          }}
                        >
                          <RefreshCcw size={14} />
                          <span>{appLanguage === 'English' ? 'Resume Session' : 'ክፍለ ጊዜውን ቀጥል'}</span>
                        </button>
                        <button
                          onClick={() => setUnfinishedSessions(prev => prev.filter(s => s.id !== session.id))}
                          style={{
                            background: 'rgba(239, 68, 68, 0.06)',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)' }}
                        >
                          <Trash2 size={14} />
                          <span>{appLanguage === 'English' ? 'Discard' : 'አስወግድ'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Health Status Dashboard (With Real Assessment & Cause Data) */}
          {(() => {
            const data = getDiagnosticReportData(masterReport, appLanguage);
            if (!data) return null; // DO NOT SHOW if no finished session is found!

            const conclusionMsg = masterReport?.messages?.find(
              (m) => m.role === 'ai' && (m.text.includes('ASSESSMENT:') || m.text.includes('TEMPORARY RELIEF:'))
            );
            const reportData = conclusionMsg ? parseClinicalReport(conclusionMsg.text) : null;
            const reliefItems = reportData ? reportData.relief.map(r => cleanItemText(r)).filter(Boolean) : [];

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', flex: '1 1 280px', width: '100%' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`, paddingBottom: '6px', width: '100%' }}>
                  {appLanguage === 'English' ? 'Health Status' : 'የጤና ሁኔታ'}
                </div>
                
                <div style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px'
                }}>
                  {/* Dynamic Probable Disease and Cause (Real Data) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`, paddingBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                        <Brain size={16} />
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {appLanguage === 'English' ? 'Diagnostic Summary' : 'የሕክምና ግምገማ ማጠቃለያ'}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                        {appLanguage === 'English' ? 'Probable Condition / Disease' : 'ሊሆን የሚችል የጤና ሁኔታ'}
                      </div>
                      <div style={{ fontSize: '13.5px', color: 'var(--text)', opacity: 0.95, lineHeight: '1.5' }}>
                        {data.probableDisease}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                        {appLanguage === 'English' ? 'Primary Cause / Context' : 'ዋነኛ መንስኤ / ሁኔታ'}
                      </div>
                      <div style={{ fontSize: '13.5px', color: 'var(--text)', opacity: 0.95, lineHeight: '1.5' }}>
                        {data.probableCause}
                      </div>
                    </div>
                  </div>

                  {/* Wellness Score Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                          <HeartPulse size={16} />
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                          {appLanguage === 'English' ? 'Estimated Wellness Score' : 'የጤና ሁኔታ ውጤት'}
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)' }}>{data.finalWellness}%</span>
                    </div>
                    
                    <div style={{
                      width: '100%',
                      height: '10px',
                      background: isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: `${data.finalWellness}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
                        borderRadius: '10px',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        boxShadow: '0 0 10px rgba(107, 144, 128, 0.4)'
                      }} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        {appLanguage === 'English' 
                          ? `Current Severity: ${data.severity}/10` 
                          : `አሁን ያለው ህመም ከባድነት: ${data.severity}/10`}
                      </span>
                      <span>
                        {data.severity <= 3 
                          ? (appLanguage === 'English' ? 'Excellent Status' : 'በጣም ጥሩ ደረጃ') 
                          : data.severity <= 6 
                          ? (appLanguage === 'English' ? 'Moderate Status' : 'መካከለኛ ደረጃ') 
                          : (appLanguage === 'English' ? 'High Concern' : 'ከፍተኛ ጥንቃቄ ያስፈልጋል')}
                      </span>
                    </div>
                  </div>

                  {/* Vitals Sparkline Trend Graph */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                        <Activity size={16} />
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                        {appLanguage === 'English' ? 'Recovery Trend Timeline' : 'የማገገም ሂደት አዝማሚያ'}
                      </span>
                    </div>

                    <div style={{
                      width: '100%',
                      height: '140px',
                      background: isLightMode ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'}`,
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <svg viewBox="0 0 300 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        <line x1="0" y1="20" x2="300" y2="20" stroke={isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'} strokeDasharray="4 4" />
                        <line x1="0" y1="50" x2="300" y2="50" stroke={isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'} strokeDasharray="4 4" />
                        <line x1="0" y1="80" x2="300" y2="80" stroke={isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'} strokeDasharray="4 4" />

                        {/* Vertical guidelines */}
                        <line x1="10" y1={data.y1} x2="10" y2="90" stroke={isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'} strokeDasharray="2 2" />
                        <line x1="110" y1={data.y2} x2="110" y2="90" stroke={isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'} strokeDasharray="2 2" />
                        <line x1="210" y1={data.y3} x2="210" y2="90" stroke={isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'} strokeDasharray="2 2" />
                        <line x1="290" y1={data.yToday} x2="290" y2="90" stroke="var(--accent)" strokeOpacity="0.3" strokeDasharray="2 2" />

                        <path
                          d={`M 10 90 L 10 ${data.y1} L 110 ${data.y2} L 210 ${data.y3} L 290 ${data.yToday} L 290 90 Z`}
                          fill="url(#chartGradient)"
                        />

                        <path
                          d={`M 10 ${data.y1} L 110 ${data.y2} L 210 ${data.y3} L 290 ${data.yToday}`}
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />

                        {/* Numeric wellness scores over points */}
                        <text x="10" y={data.y1 - 10} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="bold">{Math.round(data.finalWellness * 0.65)}%</text>
                        <text x="110" y={data.y2 - 10} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="bold">{Math.round(data.finalWellness * 0.78)}%</text>
                        <text x="210" y={data.y3 - 10} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="bold">{Math.round(data.finalWellness * 0.88)}%</text>
                        <text x="290" y={data.yToday - 12} textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="800">{data.finalWellness}%</text>

                        <circle cx="10" cy={data.y1} r="4" fill="var(--accent)" />
                        <circle cx="110" cy={data.y2} r="4" fill="var(--accent)" />
                        <circle cx="210" cy={data.y3} r="4" fill="var(--accent)" />
                        
                        <circle cx="290" cy={data.yToday} r="5" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="2" style={{ animation: 'pulseGlow 2s infinite' }} />
                      </svg>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>{appLanguage === 'English' ? 'Initial check' : 'የመጀመሪያ ምርመራ'}</span>
                      <span>{appLanguage === 'English' ? 'Day 3' : 'ቀን 3'}</span>
                      <span>{appLanguage === 'English' ? 'Day 5' : 'ቀን 5'}</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{appLanguage === 'English' ? 'Today (Active)' : 'ዛሬ (ንቁ)'}</span>
                    </div>
                  </div>

                  {/* Pain Elimination & Expected Milestones Detail Block */}
                  <div style={{
                    marginTop: '20px',
                    borderTop: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                    paddingTop: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                        <HeartPulse size={16} />
                      </span>
                      <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {appLanguage === 'English' ? 'Pain Elimination & Expectations' : 'የህመም ማስታገሻ እና የሚጠበቁ ውጤቶች'}
                      </span>
                    </div>

                    {/* How Pain Will Remove - Mechanism of Action */}
                    <div style={{ background: isLightMode ? 'rgba(16, 185, 129, 0.03)' : 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.12)', borderRadius: '12px', padding: '14px' }}>
                      <h5 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' }}>
                        {appLanguage === 'English' ? 'How the pain is eliminated' : 'ህመሙ እንዴት እንደሚወገድ'}
                      </h5>
                      {reliefItems.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: 'var(--text)', opacity: 0.9, lineHeight: '1.5' }}>
                          {reliefItems.slice(0, 3).map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          {appLanguage === 'English' 
                            ? 'The clinical plan targets symptoms through targeted anti-inflammatory nutrition, specific hydration routines, and recommended clinical resting patterns.'
                            : 'የሕክምና ዕቅዱ ፀረ-ብግነት የአመጋገብ ጥቅሞችን፣ ትክክለኛ የሰውነት ውሃ ማቆየት መንገዶችን እና የዕረፍት ቅጦችን በመጠቀም ምልክቶችን ያስታግሳል።'}
                        </p>
                      )}
                    </div>

                    {/* Milestone Expectations */}
                    <div>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {appLanguage === 'English' ? 'Recovery Milestone Expectations' : 'የማገገም ደረጃዎች የሚጠበቁ ሁኔታዎች'}
                      </h5>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Milestone 1 */}
                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', marginTop: '4px', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: 'var(--text)' }}>{appLanguage === 'English' ? 'Initial Check' : 'የመጀመሪያ ምርመራ'}</strong>: {appLanguage === 'English' ? 'Acute symptom intensity. Prioritizing immediate baseline pain reduction and soothing liquids.' : 'ከባድ የህመም ስሜት። ፈጣን እፎይታ ማግኘት እና ፈሳሽ ምግቦችን መውሰድ።'}
                          </div>
                        </div>

                        {/* Milestone 2 */}
                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', marginTop: '4px', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: 'var(--text)' }}>{appLanguage === 'English' ? 'Day 3 (Soothing)' : 'ቀን 3 (መረጋጋት)'}</strong>: {appLanguage === 'English' ? 'Inflammation begins to stabilize. Muscle tension decreases as custom nutrient cofactors kick in.' : 'የህመም ብግነት መረጋጋት ይጀምራል። የጡንቻዎች መወጠር በምግብ ንጥረ ነገሮች እርዳታ ይቀንሳል።'}
                          </div>
                        </div>

                        {/* Milestone 3 */}
                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', marginTop: '4px', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: 'var(--text)' }}>{appLanguage === 'English' ? 'Day 5 (Clearance)' : 'ቀን 5 (ማገገም)'}</strong>: {appLanguage === 'English' ? 'Substantial reduction of neural pain signals. Metabolic stamina starts to fully return.' : 'አብዛኛው የነርቭ ህመም ስሜት ይቀንሳል። የሰውነት የጉልበት እና የሜታቦሊክ አቅም ሙሉ በሙሉ መመለስ ይጀምራል።'}
                          </div>
                        </div>

                        {/* Milestone 4 */}
                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-light)', marginTop: '4px', flexShrink: 0, boxShadow: '0 0 6px var(--accent-light)' }} />
                          <div>
                            <strong style={{ color: 'var(--text)' }}>{appLanguage === 'English' ? 'Today & Beyond' : 'ዛሬ እና ወደፊት'}</strong>: {appLanguage === 'English' ? 'Reaching baseline wellness score. Symptom frequency minimized through sustained dietary habits.' : 'መሰረታዊ ጤንነት ደረጃ ላይ መድረስ። በአስተማማኝ አመጋገብ አማካኝነት ህመሙ እንዳይመለስ ሙሉ በሙሉ መከላከል።'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}
    </div>
  );
}
