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

  // Enforce nearest one only (first element)
  const nearest = pharmacies[0];
  const isPharmacy = nearest.name?.toLowerCase().includes('pharmacy') || !nearest.name?.toLowerCase().includes('hospital');
  const defaultImage = isPharmacy 
    ? "https://images.unsplash.com/photo-1607619056574-7b8d304f3b24?auto=format&fit=crop&q=80&w=600" 
    : "https://images.unsplash.com/photo-1586773860418-d37222d8fce2?auto=format&fit=crop&q=80&w=600";
  const imageSrc = nearest.image || defaultImage;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0', width: '100%' }}>
      <div 
        style={{
          background: 'var(--surface-2, #1f2937)',
          border: '1.5px solid var(--accent, #6366f1)',
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(99, 102, 241, 0.15), 0 1px 3px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100%',
          maxWidth: '440px',
          position: 'relative'
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 15px 35px rgba(99, 102, 241, 0.25), 0 2px 5px rgba(0, 0, 0, 0.05)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(99, 102, 241, 0.15), 0 1px 3px rgba(0, 0, 0, 0.05)';
        }}
      >
        {/* Header Badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          padding: '5px 12px',
          borderRadius: '30px',
          fontSize: '11px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          zIndex: 10,
          boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#fff', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
          Nearest / ምርጥ ምርጫ
        </div>

        {/* Rating Badge */}
        {nearest.rating && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            padding: '5px 10px',
            borderRadius: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#fbbf24',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 10
          }}>
            <Star size={12} fill="#fbbf24" stroke="#fbbf24" />
            <span>{nearest.rating}</span>
          </div>
        )}

        {/* Banner Image */}
        <div style={{ width: '100%', height: '170px', overflow: 'hidden', position: 'relative' }}>
          <img 
            src={imageSrc} 
            alt={nearest.name} 
            onError={(e) => { e.currentTarget.src = defaultImage; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Subtle bottom fade */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: 'linear-gradient(to top, var(--surface-2, #1f2937), transparent)'
          }} />
        </div>

        {/* Card Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '800', color: 'var(--text, #ffffff)', fontFamily: 'var(--font-heading)' }}>
              {nearest.name}
            </h4>
            {nearest.distance && (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '12px', 
                fontWeight: '700', 
                color: '#ffffff',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                padding: '4px 10px',
                borderRadius: '10px',
                boxShadow: '0 2px 6px rgba(99, 102, 241, 0.2)'
              }}>
                🚗 <span>{nearest.distance}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            {nearest.address && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: 'var(--text-muted, #9ca3af)', lineHeight: '1.4' }}>
                <MapPin size={16} style={{ color: 'var(--accent, #6366f1)', flexShrink: 0, marginTop: '2px' }} />
                <span>{nearest.address}</span>
              </div>
            )}

            {nearest.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--text-muted, #9ca3af)' }}>
                <Phone size={16} style={{ color: 'var(--accent, #6366f1)', flexShrink: 0 }} />
                <a href={`tel:${nearest.phone}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: '500' }}>{nearest.phone}</a>
              </div>
            )}
          </div>

          {nearest.directionsUrl && (
            <button
              onClick={() => window.open(nearest.directionsUrl, '_blank')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                padding: '14px 20px',
                fontSize: '14.5px',
                fontWeight: '800',
                cursor: 'pointer',
                marginTop: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.filter = 'brightness(1.08)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.35)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Navigation size={16} fill="#ffffff" />
              <span>Start Navigation / Google Maps Navigation</span>
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
