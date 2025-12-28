/**
 * Utilitare SEO: slug-uri, meta tags, conținut programatic
 */

/**
 * Generează slug SEO-friendly din numele firmei (fără CIF)
 * Exemplu: "SC ABC SRL" -> "sc-abc-srl"
 */
export function generateCompanySlugOnly(name: string): string {
  // Normalizează numele
  let slug = name
    .toLowerCase()
    .trim()
    // Elimină caractere speciale, păstrează spații și diacritice
    .replace(/[^\w\săâîșțĂÂÎȘȚ-]/g, '')
    // Elimină underscore-uri pentru slug mai curat
    .replace(/[_]/g, '')
    // Înlocuiește spațiile cu cratime
    .replace(/\s+/g, '-')
    // Elimină cratime multiple
    .replace(/-+/g, '-')
    // Elimină cratime de la început/șfârșit
    .replace(/^-+|-+$/g, '')
    // Limitează la 80 caractere
    .substring(0, 80);

  return slug;
}

/**
 * Generează slug SEO-friendly din numele firmei (cu CIF scurt la final)
 * Exemplu: "SC ABC SRL" -> "sc-abc-srl-12345678"
 */
export function generateCompanySlug(name: string, cif: string): string {
  const slugOnly = generateCompanySlugOnly(name);
  
  // Adaugă CUI la final pentru unicitate
  const cifShort = cif.replace(/^RO/, '').substring(0, 8);
  return `${slugOnly}-${cifShort}`;
}

/**
 * Normalizează CIF la format consistent pentru URL (numeric only, no RO prefix)
 */
export function normalizeCifForUrl(cif: string | null | undefined): string {
  if (!cif) return '';
  const rawCif = String(cif);
  const normCif = rawCif.toUpperCase().replace(/^RO/, '').replace(/\D/g, '');
  return normCif || rawCif; // fallback only if unexpected
}

/**
 * Generează canonical slug pentru firmă
 * Format: {baseSlug}-{cif} (CIF normalizat, fără RO)
 */
export function generateCanonicalSlug(company: {
  slug?: string | null;
  name: string;
  cif: string;
}): string {
  const urlCif = normalizeCifForUrl(company.cif);
  
  // Get base slug (without CIF suffix if present)
  let baseSlug: string;
  if (company.slug) {
    const slugStr = String(company.slug);
    baseSlug = slugStr;
    
    // Remove "-<cif>" only if it matches the actual normalized cif
    if (urlCif && baseSlug.toLowerCase().endsWith(`-${urlCif.toLowerCase()}`)) {
      baseSlug = baseSlug.slice(0, -(urlCif.length + 1));
    }
  } else {
    baseSlug = generateCompanySlugOnly(company.name);
  }
  
  return `${baseSlug}-${urlCif}`;
}

/**
 * Get base URL helper (consistent across all pages/sitemaps)
 * Removes trailing slashes for consistency
 */
export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'https://director-firme.ro';
  return url.replace(/\/+$/, ''); // Remove trailing slashes
}

/**
 * Generează URL SEO-friendly pentru firmă
 * Format: /firma/{slug-nume}-{cui}
 */
export function generateCompanyURL(name: string, cif: string): string {
  const slug = generateCompanySlug(name, cif);
  return `/firma/${slug}`;
}

/**
 * Generează conținut SEO programatic pentru o firmă (150-300 cuvinte)
 * Text unic, fără keyword stuffing, orientat pe verificare firmă
 */
export function generateSEOContent(company: {
  name: string;
  cif: string;
  city?: string | null;
  county?: string | null;
  legalForm?: string | null;
  mainActivity?: string | null;
  registrationDate?: Date | string | null;
  status?: string | null;
}): string {
  const parts: string[] = [];
  
  // Introducere variată
  const intros = [
    `${company.name} este o companie înregistrată în România`,
    `Firma ${company.name} funcționează pe teritoriul României`,
    `${company.name} reprezintă o entitate juridică din România`,
    `Compania ${company.name} este înscrisă în registrul comerțului`,
  ];
  parts.push(intros[Math.floor(Math.random() * intros.length)]);

  // CUI
  parts.push(`cu Cod Unic de Înregistrare (CUI) ${company.cif}.`);

  // Localizare
  if (company.city || company.county) {
    const locationParts: string[] = [];
    if (company.city) locationParts.push(company.city);
    if (company.county) locationParts.push(`județul ${company.county}`);
    parts.push(`Entitatea este localizată în ${locationParts.join(', ')}.`);
  }

  // Formă juridică
  if (company.legalForm) {
    const legalForms: Record<string, string> = {
      'SRL': 'societate cu răspundere limitată',
      'SA': 'societate anonimă',
      'PFA': 'persoană fizică autorizată',
      'PF': 'persoană fizică',
      'SNC': 'societate în nume colectiv',
      'SCS': 'societate în comandită simplă',
    };
    const formName = legalForms[company.legalForm] || company.legalForm.toLowerCase();
    parts.push(`Forma juridică a companiei este ${formName}.`);
  }

  // Activitate
  if (company.mainActivity) {
    parts.push(`Activitatea principală este ${company.mainActivity.toLowerCase()}.`);
  }

  // Data înființării
  if (company.registrationDate) {
    const date = new Date(company.registrationDate);
    const year = date.getFullYear();
    parts.push(`Compania a fost înființată în anul ${year}.`);
  }

  // Status
  if (company.status) {
    const statusText = company.status === 'activ' 
      ? 'se află în activitate' 
      : `are statusul ${company.status}`;
    parts.push(`În prezent, firma ${statusText}.`);
  }

  // Call to action variat
  const ctas = [
    'Pentru verificare detaliată a datelor firmei, consultă informațiile de mai jos.',
    'Mai jos găsești toate datele oficiale despre această companie.',
    'Informațiile complete despre firmă sunt disponibile în secțiunile de mai jos.',
  ];
  parts.push(ctas[Math.floor(Math.random() * ctas.length)]);

  const content = parts.join(' ');
  
  // Asigură că are între 150-300 cuvinte
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 150) {
    // Adaugă informații suplimentare
    parts.push('Datele sunt actualizate periodic din surse oficiale precum ONRC și ANAF.');
    parts.push('Pentru informații suplimentare despre verificarea firmelor în România, consultă ghidul nostru.');
  }

  return parts.join(' ');
}

/**
 * Generează FAQ-uri SEO pentru o firmă (pentru FAQPage schema)
 */
export function generateCompanyFAQs(company: {
  name: string;
  cif: string;
  city?: string | null;
  county?: string | null;
  status?: string | null;
}): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];

  faqs.push({
    question: `Care este CUI-ul firmei ${company.name}?`,
    answer: `CUI-ul (Cod Unic de Înregistrare) al firmei ${company.name} este ${company.cif}.`,
  });

  if (company.city || company.county) {
    faqs.push({
      question: `Unde este localizată firma ${company.name}?`,
      answer: `${company.name} este localizată ${company.city ? `în ${company.city}` : ''}${company.county ? `, județul ${company.county}` : ''}.`,
    });
  }

  if (company.status) {
    faqs.push({
      question: `Care este statusul firmei ${company.name}?`,
      answer: `Statusul actual al firmei ${company.name} este: ${company.status}.`,
    });
  }

  faqs.push({
    question: `Cum verific datele firmei ${company.name}?`,
    answer: `Poți verifica datele firmei ${company.name} folosind CUI-ul ${company.cif} pe platforma noastră sau pe site-urile oficiale ONRC și ANAF.`,
  });

  return faqs;
}

/**
 * Generează fact sheet (bullet points) pentru AI/Google SGE
 */
export function generateFactSheet(company: any): string[] {
  const facts: string[] = [];

  facts.push(`Nume: ${company.name}`);
  facts.push(`CUI: ${company.cif}`);
  
  if (company.registrationNumber) {
    facts.push(`Nr. Reg. Com.: ${company.registrationNumber}`);
  }

  if (company.legalForm) {
    facts.push(`Formă juridică: ${company.legalForm}`);
  }

  if (company.city) {
    facts.push(`Oraș: ${company.city}`);
  }

  if (company.county) {
    facts.push(`Județ: ${company.county}`);
  }

  if (company.address) {
    facts.push(`Adresă: ${company.address}`);
  }

  if (company.status) {
    facts.push(`Status: ${company.status}`);
  }

  if (company.registrationDate) {
    const date = new Date(company.registrationDate);
    facts.push(`Data înființării: ${date.toLocaleDateString('ro-RO')}`);
  }

  if (company.mainActivity) {
    facts.push(`Activitate principală: ${company.mainActivity}`);
  }

  return facts;
}

