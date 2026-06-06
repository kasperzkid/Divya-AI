function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

function siteName(domain) {
  const map = {
    'mayoclinic.org': 'Mayo Clinic',
    'webmd.com': 'WebMD',
    'who.int': 'WHO',
    'cdc.gov': 'CDC',
    'nhs.uk': 'NHS',
    'healthline.com': 'Healthline',
    'medscape.com': 'Medscape',
    'pubmed.ncbi.nlm.nih.gov': 'PubMed',
    'nih.gov': 'NIH',
    'clevelandclinic.org': 'Cleveland Clinic',
    'hopkinsmedicine.org': 'Johns Hopkins',
  };
  return map[domain] || domain.charAt(0).toUpperCase() + domain.slice(1);
}

/** Extract markdown images from text body, filtering out tiny/placeholder images */
function extractImages(text) {
  const imgRegex = /!?\[([^\]]*)\]\(([^)]+)\)/g;
  const images = [];
  let match;
  while ((match = imgRegex.exec(text)) !== null) {
    const url = match[2].trim();
    // Skip placeholders, data URIs, tracking pixels, tiny icons
    if (!url || url.startsWith('data:') || url.includes('pixel') || url.includes('tracker') || url.includes('1x1') || url.includes('spacer') || url.includes('icon')) continue;
    
    const alt = match[1] || 'Medical image';
    const isImageHost = url.includes('unsplash.com') || url.includes('loremflickr.com') || url.includes('images.unsplash.com') || /\.(jpeg|jpg|gif|png|webp)/i.test(url);
    const isImageAlt = /\b(image|images|picture|pictures|photo|photos|diagram|diagrams|illustration|illustrations|visual|chart|scan|mri|xray|anatomy)\b/i.test(alt);
    
    if (match[0].startsWith('!') || isImageHost || isImageAlt) {
      images.push({ alt, url });
    }
  }
  return images;
}

function hasExactWord(text, word) {
  const regex = new RegExp(`\\b${word}\\b`, 'i');
  return regex.test(text);
}

/** Get smart contextual fallback images when no images are parsed from text */
function getFallbackImages(text) {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  
  const keywordMap = [
    { keys: ['covid', 'corona', 'coronavirus', 'vaccine', 'virus', 'pandemic'], tag: 'virus,vaccine', alt: 'Viral and Vaccine Research' },
    { keys: ['pill', 'medicin', 'drug', 'prescript', 'tablet', 'antibiotic', 'dose', 'aspirin', 'ibuprofen', 'medication'], tag: 'pills,medication', alt: 'Medication and Pills' },
    { keys: ['heart', 'cardio', 'chest', 'pulse', 'bp', 'blood pressure', 'hypertension'], tag: 'cardiology,heart', alt: 'Cardiology Illustration' },
    { keys: ['anatomy', 'body', 'skeleton', 'muscle', 'organ', 'spine', 'back pain'], tag: 'anatomy,muscle', alt: 'Clinical Diagnostics' },
    { keys: ['brain', 'headache', 'migraine', 'neurolog', 'mind', 'stress', 'stroke', 'dizzy'], tag: 'brain,neurology', alt: 'Brain MRI Scan' },
    { keys: ['lung', 'breath', 'asthma', 'cough', 'pneumonia', 'respiratory', 'oxygen', 'cold', 'flu'], tag: 'lungs,respiratory', alt: 'Lung CT Scan' },
    { keys: ['microscope', 'dna', 'cell', 'lab', 'test', 'blood', 'diagnos', 'infection', 'bacteria'], tag: 'laboratory,microscope', alt: 'Lab Research Microscope' },
    { keys: ['skin', 'rash', 'dermatol', 'allergy', 'itch', 'eczema', 'hives', 'burn'], tag: 'dermatology,skin', alt: 'Dermatology Analysis' },
    { keys: ['xray', 'bone', 'fracture', 'joint', 'injury', 'broken', 'sprain'], tag: 'xray,bone', alt: 'Hospital Clinical Care' },
    { keys: ['surgery', 'surgeon', 'operat', 'procedure', 'incision'], tag: 'surgery,hospital', alt: 'Surgical Procedure' },
    { keys: ['physician', 'steth', 'consultation'], tag: 'doctor,stethoscope', alt: 'Healthcare Doctor Consultation' }
  ];

  const matchedImages = [];
  for (const item of keywordMap) {
    if (item.keys.some(k => hasExactWord(lowerText, k))) {
      const randomId = Math.floor(Math.random() * 1000);
      const url = `https://loremflickr.com/800/600/medical,${item.tag}?random=${randomId}`;
      if (!matchedImages.some(img => img.alt === item.alt)) {
        matchedImages.push({ alt: item.alt, url });
      }
    }
  }

  // General fallback if the user asks for images/pictures but none matched
  if (matchedImages.length === 0 && /\b(image|images|picture|pictures|photo|photos|diagram|diagrams|show|draw|illustration|illustrations)\b/i.test(lowerText)) {
    matchedImages.push(
      { alt: 'Medication Therapy', url: `https://loremflickr.com/800/600/medical,pill?random=1` },
      { alt: 'Healthcare Treatment', url: `https://loremflickr.com/800/600/medical,treatment?random=2` },
      { alt: 'Doctors Clinic', url: `https://loremflickr.com/800/600/medical,clinic?random=3` },
      { alt: 'Clinical Lab Research', url: `https://loremflickr.com/800/600/medical,research?random=4` }
    );
  }

  return matchedImages.slice(0, 4);
}

/** Remove image markdown from body so it doesn't render inline */
function stripImages(text, images) {
  let cleanText = text;
  
  // Clean up any preceding labels like "Image:", "Diagram:", "Photo:", etc.
  cleanText = cleanText.replace(/\b(image|images|picture|pictures|photo|photos|diagram|diagrams|illustration|illustrations|visual|chart|scan|mri|xray|anatomy)\s*:\s*/gi, '');
  
  for (const img of images) {
    const escapedUrl = img.url.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const escapedAlt = img.alt.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    // Match and remove both !?[alt](url) and ?[alt](url)
    const regex = new RegExp(`!?\\[${escapedAlt}\\]\\(${escapedUrl}\\)\\s*`, 'g');
    cleanText = cleanText.replace(regex, '');
  }
  
  return cleanText.trim();
}

export function parseReferences(text) {
  if (!text) return { body: '', references: [], images: [] };

  // First, extract all images from the entire text
  let images = extractImages(text);
  
  // Strip all markdown images from the text so they don't render inline
  const cleanText = stripImages(text, images);

  const parts = cleanText.split(/\n---+\n/);
  const cleanBody = parts[0].trim();

  // If no markdown images are provided by AI, get context fallback images ONLY if requested
  if (images.length === 0) {
    const lowerText = text.toLowerCase();
    const hasImageRequest = /\b(image|images|picture|pictures|photo|photos|diagram|diagrams|show|draw|illustration|illustrations)\b/i.test(lowerText);
    if (hasImageRequest) {
      images = getFallbackImages(cleanBody);
    }
  }

  if (parts.length < 2) {
    return { body: cleanBody, references: [], images };
  }

  const refSection = parts.slice(1).join('\n');

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const references = [];
  let match;
  while ((match = linkRegex.exec(refSection)) !== null) {
    const url = match[2];
    const domain = getDomain(url);
    references.push({ text: match[1], url, domain, site: siteName(domain) });
  }

  return { body: cleanBody, references, images };
}
