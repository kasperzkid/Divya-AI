function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

function ReferencesList({ references }) {
  if (!references || references.length === 0) return null;

  return (
    <div className="references-list">
      <span className="references-label">References</span>
      <div className="references-items">
        {references.map((ref, i) => {
          const domain = getDomain(ref.url);
          return (
            <a
              key={i}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="reference-icon-link"
              title={ref.text}
            >
              <img
                className="ref-favicon"
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                alt={domain}
                width="18"
                height="18"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default ReferencesList;
