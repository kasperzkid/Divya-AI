import { useState, useEffect } from 'react';

export default function HowItWorksTab({ appLanguage }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="sample-page" style={{ padding: isMobile ? '16px' : '32px 40px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 'none', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>
            {appLanguage === 'English' ? 'How It Works — Divya AI Guide' : 'እንዴት እንደሚሰራ — የዲቭያ AI መመሪያ'}
          </h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            {appLanguage === 'English' 
              ? 'Welcome to Divya AI! Our platform serves as your bilingual personal health assistant and clinical companion. It evaluates symptoms, tracks traditional nutrition, sets reminders, and maps local medical clinics.'
              : 'ወደ ዲቭያ AI እንኳን ደህና መጡ! ይህ መድረክ እንደ ግል የጤና ረዳትዎ እና ክሊኒካዊ ባለሙያዎ ሆኖ ያገለግላል። ምልክቶችን ይገመግማል፣ አመጋገብን ይከታተላል፣ አስታዋሾችን ያዘጋጃል እንዲሁም የህክምና ተቋማትን ይጠቁማል።'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {/* Part 1: Plan Mode & Session Mode */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '32px', alignItems: 'stretch' }}>
            
            {/* Plan Mode (Left Column) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <img src="https://i.postimg.cc/mr2gwnBB/plan-mode.png" alt="Plan Mode" style={{ width: '100%', height: isMobile ? '200px' : '260px', objectFit: 'cover', borderRadius: '16px' }} />
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800', color: 'var(--text)' }}>
                  {appLanguage === 'English' ? '📋 1. Plan Mode — Organizing Daily Recovery Routines' : '📋 1. የእቅድ ሁኔታ (Plan Mode) — የእለት ተእለት ማገገሚያ ተግባራትን ማደራጀት'}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  {appLanguage === 'English' 
                    ? 'Plan Mode builds customized daily recovery guidelines. It tracks clinical tasks (such as hospital diagnostic tests, prescribed pill dosages, and specialized stretching exercises) and syncs physical checkup routines to ensure a consistent, highly disciplined, and health-conscious lifestyle.'
                    : 'የእቅድ ሁኔታ (Plan Mode) በየቀኑ የሚከናወኑ ተግባራትን ያዘጋጃል። ክሊኒካዊ ቀጠሮዎችን፣ የታዘዙ መድሃኒቶችን እና ልምምዶችን በመከታተል የተስተካከለ፣ የተገደበ እና ጤናማ የኑሮ ዘይቤ እንዲኖርዎት ይረዳል።'}
                </p>
              </div>
            </div>

            {/* Session Mode (Right Column) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <img src="https://i.postimg.cc/1t3sGV0S/session-mode.png" alt="Session Mode" style={{ width: '100%', height: isMobile ? '200px' : '260px', objectFit: 'cover', borderRadius: '16px' }} />
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800', color: 'var(--text)' }}>
                  {appLanguage === 'English' ? '💬 2. Diagnostic Session — Evaluating Symptoms Step-by-Step' : '💬 2. የምርመራ ውይይት (Session Mode) — ምልክቶችን ደረጃ በደረጃ መገምገም'}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  {appLanguage === 'English' 
                    ? 'Divya asks step-by-step clinical questions during each diagnostic session. She investigates pain locations (Head, Chest, Stomach, Back, Joints, or Other), checks pain types, duration, severity, and associated health history to compile an assessment.'
                    : 'ዲቭያ በእያንዳንዱ የምርመራ ውይይት ወቅት ደረጃ በደረጃ ጥያቄዎችን ትጠይቃለች። የህመሙን ቦታ (ራስ፣ ደረት፣ ሆድ፣ ጀርባ፣ መገጣጠሚያዎች ወይም ሌላ)፣ የህመሙን አይነት፣ የቆይታ ጊዜን፣ የህመም ደረጃን እና የቀደመ የጤና ታሪክዎን ትገመግማለች።'}
                </p>
              </div>
            </div>

          </div>

          {/* Part 2: Food & Nutrition (Full Width) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <img src="https://i.postimg.cc/9QX25qST/food-nutriton.png" alt="Food & Nutrition" style={{ width: '100%', height: isMobile ? '220px' : '300px', objectFit: 'cover', borderRadius: '16px' }} />
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800', color: 'var(--text)' }}>
                {appLanguage === 'English' ? '🥗 3. Food & Nutrition — Customizing Your Eating Style' : '🥗 3. የአመጋገብ እና ስነ-ምግብ ክፍል — የአመጋገብ ዘይቤዎን ማሻሻል'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {appLanguage === 'English' 
                  ? 'Customizes your macros and micronutrients to optimize daily recovery. It guides you toward healthy, affordable, traditional Ethiopian meal alternatives (like Injera, Shiro Wot, Kik Alicha, and Misir Wot) to improve your eating style, vitamin balance, and mineral intake.'
                  : 'የእለት ተእለት ምግብዎን በማስተካከል የስነ-ምግብ እቅድ ያዘጋጃል። ጤናማ፣ ተመጣጣኝ እና ባህላዊ የኢትዮጵያ ምግቦችን (እንደ እንጀራ፣ ሺሮ፣ ምስር ወጥ) በመጠቆም የአመጋገብ ዘይቤዎን፣ በሰውነትዎ ውስጥ ያሉ ቪታሚኖች እና ማዕድናት መጠንን ያሻሽላል።'}
              </p>
            </div>
          </div>

          {/* Part 3: Analytics (Full Width) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <img src="https://i.postimg.cc/C1GrxcnT/Analytics.png" alt="Analytics" style={{ width: '100%', height: isMobile ? '220px' : '300px', objectFit: 'cover', borderRadius: '16px' }} />
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800', color: 'var(--text)' }}>
                {appLanguage === 'English' ? '📈 4. Diagnostics Analytics — Evaluating Progress Over Time' : '📈 4. የጤና ትንታኔ እና አሃዞች — በጊዜ ሂደት ያለውን ሂደት መገምገም'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {appLanguage === 'English' 
                  ? 'The Analytics dashboard tracks critical metrics, recovery completion rates, and symptom intensity over time. This makes it easy for you and your healthcare professional to evaluate your physical progress and treatment response.'
                  : 'የጤና ትንታኔ ሰሌዳው (Analytics) በጊዜ ሂደት የእርስዎን የፈውስ ሂደት፣ የማገገም መጠን እና የህመም ስሜት ደረጃዎችን ይከታተላል። ይህም እርስዎ እና ሀኪምዎ የህክምና ውጤታማነትን በቀላሉ ለመገምገም ያስችላል።'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
