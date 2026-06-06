import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MapPin, Phone, Navigation, Star } from 'lucide-react'

function Table({ children }) {
  return (
    <div className="markdown-table-wrapper">
      <table className="markdown-table">{children}</table>
    </div>
  )
}

function ThematicBreak() {
  return <hr className="markdown-hr" />
}

function PharmacyCardsList({ pharmacies }) {
  if (!Array.isArray(pharmacies)) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '16px 0', width: '100%' }}>
      {pharmacies.map((item, index) => {
        const isPharmacy = item.name?.toLowerCase().includes('pharmacy') || !item.name?.toLowerCase().includes('hospital');
        const defaultImage = isPharmacy 
          ? "https://images.unsplash.com/photo-1607619056574-7b8d304f3b24?auto=format&fit=crop&q=80&w=600" 
          : "https://images.unsplash.com/photo-1586773860418-d37222d8fce2?auto=format&fit=crop&q=80&w=600";
        const imageSrc = item.image || defaultImage;

        return (
          <div 
            key={index}
            style={{
              background: 'var(--surface-2, #1f2937)',
              border: '1px solid var(--border, #374151)',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              width: '100%',
              maxWidth: '480px'
            }}
          >
            <div style={{ width: '100%', height: '150px', overflow: 'hidden', position: 'relative' }}>
              <img 
                src={imageSrc} 
                alt={item.name} 
                onError={(e) => { e.currentTarget.src = defaultImage; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {item.rating && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(4px)',
                  padding: '4px 8px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#fbbf24',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  <Star size={12} fill="#fbbf24" stroke="#fbbf24" />
                  <span>{item.rating}</span>
                </div>
              )}
            </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text, #ffffff)' }}>
              {item.name}
            </h4>

            {item.distance && (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '12px', 
                fontWeight: '700', 
                color: 'var(--accent, #6366f1)',
                background: 'var(--surface-hover, rgba(255, 255, 255, 0.05))',
                border: '1px solid var(--border)',
                padding: '3px 8px',
                borderRadius: '8px',
                alignSelf: 'flex-start'
              }}>
                🚗 <span>{item.distance}</span>
              </div>
            )}

            {item.address && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-muted, #9ca3af)' }}>
                <MapPin size={15} style={{ color: 'var(--accent, #6366f1)', flexShrink: 0, marginTop: '2px' }} />
                <span>{item.address}</span>
              </div>
            )}

            {item.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted, #9ca3af)' }}>
                <Phone size={15} style={{ color: 'var(--accent, #6366f1)', flexShrink: 0 }} />
                <a href={`tel:${item.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{item.phone}</a>
              </div>
            )}

            {item.directionsUrl && (
              <button
                onClick={() => window.open(item.directionsUrl, '_blank')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'var(--accent, #6366f1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '4px',
                  boxShadow: 'var(--glow-accent, 0 0 10px rgba(99, 102, 241, 0.3))',
                  transition: 'background 0.2s, transform 0.1s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Navigation size={16} fill="#ffffff" />
                <span>Start Navigation (Google Maps)</span>
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>
  );
}

function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: Table,
        thematicBreak: ThematicBreak,
        code({ className, children, ...props }) {
          const match = /language-([\w-]+)/.exec(className || '')
          if (match && match[1] === 'pharmacy-list') {
            try {
              const data = JSON.parse(String(children).trim());
              return <PharmacyCardsList pharmacies={data} />;
            } catch (e) {
              console.error("Failed to parse pharmacy list JSON", e);
            }
          }
          return <code className={className} {...props}>{children}</code>;
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export default MarkdownRenderer
