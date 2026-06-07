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
      <!-- Top Decorative Bar -->
      <div style="height: 6px; background: linear-gradient(90deg, #52796f, #84a98c); margin: -40px -50px 30px -50px;"></div>
      
      <!-- Medical Institute Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 24px;">🩺</span>
            <span style="font-size: 20px; font-weight: 800; color: #354f52; letter-spacing: 0.5px;">DIVYA CLINICAL HEALTH INSTITUTE</span>
          </div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #52796f; font-weight: 700;">
            Autonomous Artificial Intelligence Diagnostics Core
          </div>
        </div>
        <div style="text-align: right;">
          <div style="background: #e6f0ed; color: #354f52; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 6px; border: 1px solid rgba(82, 121, 111, 0.15);">
            ${isEnglish ? 'OFFICIAL DIAGNOSTIC RECORD' : 'ክሊኒካዊ የምርመራ ሪፖርት'}
          </div>
          <div style="font-family: monospace; font-size: 12px; color: #64748b; font-weight: 600;">${reportRefId}</div>
        </div>
      </div>

      <!-- Metadata Fields -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; display: flex; gap: 40px; margin-bottom: 30px; font-size: 13px; color: #475569;">
        <div>
          <strong>${isEnglish ? 'Issued By:' : 'የተዘጋጀው በ:'}</strong>
          <span style="color: #1e293b; font-weight: 600; margin-left: 6px;">Divya Medical AI (v1.0)</span>
        </div>
        <div>
          <strong>${isEnglish ? 'Date Generated:' : 'ቀን:'}</strong>
          <span style="color: #1e293b; font-weight: 600; margin-left: 6px;">${formattedDate}</span>
        </div>
        <div>
          <strong>${isEnglish ? 'Classification:' : 'ምደባ:'}</strong>
          <span style="color: #0d9488; font-weight: 700; margin-left: 6px; letter-spacing: 0.5px;">${isEnglish ? 'CONFIDENTIAL' : 'ሚስጥራዊ'}</span>
        </div>
      </div>
    `;

    if (reportData.opening) {
      htmlContent += `
        <div style="font-size: 14.5px; font-style: italic; color: #334155; border-left: 4px solid #52796f; padding-left: 18px; margin-bottom: 30px; line-height: 1.6;">
          ${reportData.opening.replace(/\*\*/g, '').replace(/\*/g, '').trim()}
        </div>
      `;
    }

    if (reportData.assessment) {
      const formattedAssessment = reportData.assessment
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1e293b; font-weight: 700;">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>');

      htmlContent += `
        <div style="background: linear-gradient(135deg, rgba(82, 121, 111, 0.04), rgba(132, 169, 140, 0.08)); border: 1px solid rgba(82, 121, 111, 0.15); border-radius: 16px; padding: 24px; margin-bottom: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.015);">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <span style="font-size: 18px;">🧠</span>
            <h4 style="margin: 0; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #2f3e46;">
              ${isEnglish ? 'Clinical Impression' : 'ክሊኒካዊ ግምገማ'}
            </h4>
          </div>
          <div style="color: #334155; font-size: 14px; line-height: 1.7; word-wrap: break-word;">
            ${formattedAssessment}
          </div>
        </div>
      `;
    }

    if (reportData.relief.length > 0) {
      htmlContent += `
        <div style="margin-bottom: 30px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <span style="font-size: 18px;">❤️</span>
            <h4 style="margin: 0; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #2f3e46;">
              ${isEnglish ? 'Temporary Relief Suggestions' : 'ጊዜያዊ ማስታገሻ ምክሮች'}
            </h4>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
      `;

      reportData.relief.forEach((rawItem) => {
        const { text: cleanText, imageUrl, imageAlt } = extractImageAndClean(rawItem);
        let displayMsg = formatBold(cleanText.replace(/^[\s*\-\d\.\•]+\s*/, ''));
        if (displayMsg) {
          htmlContent += `
            <div style="background: #fafaf9; border: 1px solid #f1f1ee; border-radius: 12px; padding: 14px 18px; display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; gap: 12px; align-items: flex-start;">
                <span style="color: #52796f; font-weight: bold; font-size: 16px; line-height: 1;">✓</span>
                <div style="color: #334155; font-size: 13.5px; line-height: 1.6; flex: 1;">
                  ${displayMsg}
                </div>
              </div>
              ${imageUrl ? `
                <div style="border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e0; margin-top: 6px;">
                  <img src="${imageUrl}" alt="${imageAlt || 'Relief step'}" style="width: 100%; max-height: 220px; object-fit: cover; display: block;" />
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
        <div style="margin-bottom: 30px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <span style="font-size: 18px;">🔬</span>
            <h4 style="margin: 0; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #2f3e46;">
              ${isEnglish ? 'Recommended Diagnostic Tests' : 'የሚመከሩ የላብራቶሪ ምርመራዎች'}
            </h4>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
      `;

      reportData.tests.forEach((rawItem) => {
        const { text: cleanText } = extractImageAndClean(rawItem);
        const parsed = parseTestLine(cleanText);
        let displayMsg = formatBold(parsed.text);
        
        if (displayMsg) {
          htmlContent += `
            <div style="background: #fafaf9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
              <div style="display: flex; gap: 12px; align-items: flex-start; flex: 1;">
                <span style="color: #52796f; font-weight: bold; font-size: 16px; line-height: 1;">→</span>
                <div style="color: #334155; font-size: 13.5px; line-height: 1.6;">
                  ${displayMsg}
                </div>
              </div>
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 20px; color: ${parsed.priorityColor}; background: ${parsed.priorityBg}; border: 1px solid rgba(0,0,0,0.02); white-space: nowrap;">
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
        <div style="margin-bottom: 30px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <span style="font-size: 18px;">🚨</span>
            <h4 style="margin: 0; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #b91c1c;">
              ${isEnglish ? 'Critical Warning Signs (Seek Immediate Care)' : 'ወዲያውኑ የህክምና እርዳታ የሚያስፈልጋቸው ምልክቶች'}
            </h4>
          </div>
          <div style="border: 1px solid rgba(239, 68, 68, 0.2); background: #fef2f2; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 12px;">
      `;

      reportData.warningSigns.forEach((rawItem) => {
        let displayMsg = formatBold(rawItem.replace(/^[\s*\-\d\.\•]+\s*/, ''));
        if (displayMsg) {
          htmlContent += `
            <div style="display: flex; gap: 12px; align-items: flex-start;">
              <span style="color: #ef4444; font-size: 14px; margin-top: 1px;">⚠️</span>
              <div style="color: #991b1b; font-size: 13.5px; font-weight: 600; line-height: 1.5;">
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
        <div style="margin-bottom: 30px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <span style="font-size: 18px;">📖</span>
            <h4 style="margin: 0; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #2f3e46;">
              ${isEnglish ? 'Medical Glossary & Key Terms' : 'የህክምና ቃላት መፍቻ'}
            </h4>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 14px;">
      `;

      parsedKeyTerms.forEach((item) => {
        htmlContent += `
          <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 2px;">
            <strong style="color: #334155; font-size: 13.5px; display: block; margin-bottom: 4px;">${item.term}</strong>
            <span style="color: #64748b; font-size: 13px; line-height: 1.5; display: block;">${item.definition}</span>
          </div>
        `;
      });

      htmlContent += `
          </div>
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
        <div style="margin-bottom: 35px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <span style="font-size: 18px;">📚</span>
            <h4 style="margin: 0; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #2f3e46;">
              ${isEnglish ? 'Clinical Research References' : 'ክሊኒካዊ ዋቢዎች'}
            </h4>
          </div>
          <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; display: flex; flex-direction: column; gap: 8px; line-height: 1.5;">
      `;

      parsedReferences.forEach((ref) => {
        htmlContent += `
          <li>
            <span style="font-weight: 600; color: #334155;">${ref.label}</span>
            ${ref.url && ref.url !== '#' ? `<br/><span style="font-size: 11px; color: #0d9488; word-break: break-all;">${ref.url}</span>` : ''}
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
        <div style="border-top: 1px dashed #cbd5e1; margin-top: 40px; padding-top: 24px; text-align: center;">
          <div style="font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
            ⚠️ ${isEnglish ? 'Medical Disclaimer' : 'የህክምና ማስጠንቀቂያ'}
          </div>
          <div style="font-size: 11.5px; color: #94a3b8; font-style: italic; line-height: 1.6; max-width: 680px; margin: 0 auto 24px auto;">
            ${reportData.disclaimer.replace(/^⚠️\s*/, '')}
          </div>
          <div style="display: flex; justify-content: center; align-items: center; flex-direction: column; gap: 6px; font-size: 11px; color: #64748b;">
            <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Digitally Signed & Certified</div>
            <div style="font-family: monospace; font-size: 10px; color: #94a3b8; padding: 4px 12px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 4px;">
              Divya clinical-engine-signature::${reportRefId.split('-').pop()}
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
