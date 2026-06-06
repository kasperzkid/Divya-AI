import { X, ExternalLink } from 'lucide-react'

function SourceSidebar({ references, isOpen, onClose, appLanguage }) {
  return (
    <>
      {isOpen && <div className="source-sidebar-overlay" onClick={onClose} />}
      <div className={`source-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="source-sidebar-header">
          <h2>{appLanguage === 'English' ? 'Sources' : 'ምንጮች'}</h2>
          <button className="source-sidebar-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="source-sidebar-list">
          {references.length === 0 ? (
            <p className="source-sidebar-empty">
              {appLanguage === 'English' ? 'No sources available.' : 'ምንም ምንጮች የሉም።'}
            </p>
          ) : (
            references.map((ref, i) => (
              <div key={i} className="source-card">
                <div className="source-card-header">
                  <img
                    className="source-card-favicon"
                    src={`https://www.google.com/s2/favicons?domain=${ref.domain}&sz=32`}
                    alt=""
                    width="20"
                    height="20"
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                  <div className="source-card-meta">
                    <span className="source-card-site">{ref.site}</span>
                    <span className="source-card-domain">{ref.domain}</span>
                  </div>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-card-link"
                    title="Open source"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div className="source-card-detail" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4', opacity: 0.85 }}>
                  {ref.site === 'Mayo Clinic' && 'Comprehensive clinical guidance covering symptoms, diagnoses, and treatment options verified by medical experts.'}
                  {ref.site === 'WebMD' && 'Patient-centered health information, symptoms tracking, and daily medical news updates.'}
                  {ref.site === 'WHO' && 'Global health guidelines, disease prevention protocols, and international medical safety updates.'}
                  {ref.site === 'CDC' && 'Public health recommendations, clinical symptom checklists, and scientific research findings.'}
                  {ref.site === 'NHS' && 'National health service guidance, verified symptom checkers, and local clinical standards.'}
                  {ref.site === 'Healthline' && 'Accessible health education, nutritional facts, and consumer wellness resources.'}
                  {ref.site === 'Medscape' && 'Professional medical journals, clinical reference libraries, and drug interaction databases.'}
                  {ref.site === 'PubMed' && 'Peer-reviewed clinical trial databases, biomedical literature index, and academic research papers.'}
                  {ref.site === 'NIH' && 'National institutes of health biomedical research, patient education materials, and clinical trial indexes.'}
                  {ref.site === 'Cleveland Clinic' && 'Top-tier multispecialty academic medical center research, procedures, and health articles.'}
                  {ref.site === 'Johns Hopkins' && 'Renowned medical research insights, diagnosis breakthroughs, and health libraries.'}
                  {!['Mayo Clinic', 'WebMD', 'WHO', 'CDC', 'NHS', 'Healthline', 'Medscape', 'PubMed', 'NIH', 'Cleveland Clinic', 'Johns Hopkins'].includes(ref.site) && `Trusted medical reference from ${ref.domain} covering clinical research and symptom analysis.`}
                </div>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-card-snippet"
                  title="View Source Document"
                >
                  <blockquote>
                    "{ref.text}"
                  </blockquote>
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default SourceSidebar;
