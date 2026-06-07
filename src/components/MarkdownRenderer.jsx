import { useState, useEffect } from 'react'
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
  if (!Array.isArray(pharmacies) || pharmacies.length === 0) return null;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enforce nearest one only (first element)
  const nearest = pharmacies[0];
  const isPharmacy = nearest.name?.toLowerCase().includes('pharmacy') || !nearest.name?.toLowerCase().includes('hospital');
  const defaultImage = isPharmacy 
    ? "https://images.unsplash.com/photo-1607619056574-7b8d304f3b24?auto=format&fit=crop&q=80&w=400" 
    : "https://images.unsplash.com/photo-1586773860418-d37222d8fce2?auto=format&fit=crop&q=80&w=400";
  const imageSrc = nearest.image || defaultImage;

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '14px 0', width: '100%' }}>
      <div 
        style={{
          background: 'var(--surface-2, #1f2937)',
          border: '1px solid var(--border, #374151)',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.25s ease',
          width: '100%',
          maxWidth: isMobile ? '350px' : '480px',
          position: 'relative'
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.12)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        }}
      >
        {/* Left Side (Image) on desktop, Top on mobile */}
        <div style={{ 
          width: isMobile ? '100%' : '150px', 
          height: isMobile ? '120px' : '150px', 
          position: 'relative',
          flexShrink: 0
        }}>
          {!imgFailed ? (
            <img 
              src={imageSrc} 
              alt={nearest.name} 
              onError={() => setImgFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #52796f 0%, #354f52 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '8px',
              color: '#ffffff'
            }}>
              <span style={{ fontSize: '24px' }}>{isPharmacy ? '💊' : '🏥'}</span>
              <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.9 }}>
                {isPharmacy ? 'Pharmacy' : 'Clinic'}
              </span>
            </div>
          )}
          {/* Rating Badge */}
          {nearest.rating && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              padding: '3px 6px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              color: '#fbbf24',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              <Star size={10} fill="#fbbf24" stroke="#fbbf24" />
              <span>{nearest.rating}</span>
            </div>
          )}
        </div>

        {/* Right Side / Content */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text, #ffffff)', lineHeight: '1.3' }}>
                {nearest.name}
              </h4>
              
              {/* Distance Badge */}
              {nearest.distance && (
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: '700', 
                  color: 'var(--accent, #6366f1)',
                  background: 'var(--surface-hover, rgba(255, 255, 255, 0.04))',
                  border: '1px solid var(--border)',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap'
                }}>
                  {nearest.distance}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {nearest.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: 'var(--text-muted, #9ca3af)', lineHeight: '1.3' }}>
                  <MapPin size={13} style={{ color: 'var(--accent, #6366f1)', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {nearest.address}
                  </span>
                </div>
              )}

              {nearest.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted, #9ca3af)' }}>
                  <Phone size={13} style={{ color: 'var(--accent, #6366f1)', flexShrink: 0 }} />
                  <a href={`tel:${nearest.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{nearest.phone}</a>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          {nearest.directionsUrl && (
            <button
              onClick={() => window.open(nearest.directionsUrl, '_blank')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: 'var(--accent, #6366f1)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '4px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(99, 102, 241, 0.2)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.filter = 'brightness(1.08)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.filter = 'none';
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Navigation size={13} fill="#ffffff" />
              <span>Start Navigation</span>
            </button>
          )}
        </div>
      </div>
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
