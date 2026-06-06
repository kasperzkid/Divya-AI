function Favicon({ domain, index, total }) {
  return (
    <img
      className="source-favicon"
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt=""
      width="18"
      height="18"
      loading="lazy"
      onError={(e) => { e.target.style.display = 'none' }}
    />
  );
}

function SourcesButton({ references, onClick }) {
  if (!references || references.length === 0) return null;

  const top = references.slice(0, 3);

  return (
    <button className="sources-button" onClick={onClick}>
      <div className="source-favicons">
        {top.map((ref, i) => (
          <div key={i} className="source-favicon-avatar" style={{ zIndex: top.length - i }}>
            <Favicon domain={ref.domain} />
          </div>
        ))}
      </div>
      <span className="sources-label">Sources</span>
      <span className="sources-count">{references.length}</span>
    </button>
  );
}

export default SourcesButton;
