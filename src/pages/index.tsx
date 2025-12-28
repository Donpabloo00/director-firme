import React, { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error } = trpc.companies.search.useQuery(
    {
      query: debouncedQuery || '', // Ensure query is never undefined
      limit: 20,
      offset: 0,
    },
    {
      enabled: debouncedQuery.length > 0, // Only run query if debouncedQuery has content
      retry: false,
      refetchOnWindowFocus: false,
      onError: (err) => {
        console.error('Search error:', err);
        console.error('Error details:', {
          message: err.message,
          data: err.data,
          shape: err.shape,
        });
      },
    }
  );

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>Director Firme România - Căutare Companii, CIF, Date Financiare</title>
        <meta name="title" content="Director Firme România - Căutare Companii, CIF, Date Financiare" />
        <meta name="description" content="Director complet al firmelor din România. Caută companii după CIF, nume sau județ. Informații financiare, juridice, acționari și date de contact pentru sute de mii de companii românești." />
        <meta name="keywords" content="director firme, companii romania, cif firma, date firma, onrc, anaf, firma romania, companie romania, date financiare firma" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="Romanian" />
        <meta name="author" content="Director Firme" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://director-firme.ro/" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://director-firme.ro/" />
        <meta property="og:title" content="Director Firme România - Căutare Companii" />
        <meta property="og:description" content="Director complet al firmelor din România. Informații financiare, juridice și date de contact pentru sute de mii de companii." />
        <meta property="og:site_name" content="Director Firme România" />
        <meta property="og:locale" content="ro_RO" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Director Firme România" />
        <meta name="twitter:description" content="Director complet al firmelor din România. Caută companii după CIF, nume sau județ." />
        
        {/* Additional SEO */}
        <meta name="geo.region" content="RO" />
        <meta name="theme-color" content="#2563eb" />
        
        {/* Structured Data - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Director Firme România',
              url: 'https://director-firme.ro',
              description: 'Director complet al firmelor din România. Informații financiare, juridice și date de contact.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://director-firme.ro/?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </Head>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold">DF</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Director Firme</span>
          </div>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/about" className="text-gray-600 hover:text-blue-600 transition">
              Despre noi
            </Link>
            <Link href="/sources" className="text-gray-600 hover:text-blue-600 transition">
              Surse
            </Link>
            <Link href="/privacy" className="text-gray-600 hover:text-blue-600 transition">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-600 hover:text-blue-600 transition">
              Terms
            </Link>
          </div>
        </div>
      </nav>

      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <span className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-md">
                🚀 Powered by AI & Open Data
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight" style={{ fontSize: '52px' }}>
              Lista Firme din România
              <br />
              <span className="text-blue-600" style={{ width: '581px', fontWeight: 700, fontSize: '53px' }}>Verificare CUI, Date Financiare și Statut</span>
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
              Director complet al firmelor din România. Verifică CUI-ul, datele financiare și statusul oricărei companii românești din surse oficiale ONRC și ANAF.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-5 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <span className="text-xl">📊</span>
                <span className="font-medium text-gray-700">100K+ Companii</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <span className="text-xl">⚡</span>
                <span className="font-medium text-gray-700">Instant Search</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <span className="text-xl">🛡️</span>
                <span className="font-medium text-gray-700">GDPR Safe</span>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Caută după CIF (ex: RO12345678) sau nume companie..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      e.preventDefault();
                      setDebouncedQuery(searchQuery.trim());
                    }
                  }}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isLoading && debouncedQuery ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                  ) : (
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
              </div>
              {!debouncedQuery && (
                <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
                  <span className="text-gray-600 font-medium">Încearcă:</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const query = 'ABI';
                      setSearchQuery(query);
                      // Force immediate search
                      setTimeout(() => setDebouncedQuery(query), 50);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    ABI FARRAJ
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const query = 'RO439821';
                      setSearchQuery(query);
                      // Force immediate search
                      setTimeout(() => setDebouncedQuery(query), 50);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    RO439821
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="max-w-4xl mx-auto">
            {isLoading && debouncedQuery && (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-blue-600 border-t-transparent"></div>
                  <p className="text-lg text-gray-600 font-medium">Căutare...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-red-800 font-semibold mb-1">Eroare la căutare</p>
                    <p className="text-red-700 text-sm">{error.message}</p>
                  </div>
                </div>
              </div>
            )}

            {data && data.companies.length > 0 && (
              <div className="mb-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      ✓ {data.total.toLocaleString()} {data.total === 1 ? 'companie găsită' : 'companii găsite'}
                    </p>
                    {debouncedQuery && (
                      <p className="text-sm text-gray-500 mt-1">
                        Rezultate pentru: <span className="font-semibold text-gray-700">"{debouncedQuery}"</span>
                      </p>
                    )}
                  </div>
                  {data.total > 20 && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Șterge căutarea
                    </button>
                  )}
                </div>
                <div className="grid gap-4">
                  {data.companies.map((company: any) => (
                    <div
                      key={company.id}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/firma/${company.cif}`);
                      }}
                      className="block bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all hover:border-blue-300 border-2 border-transparent group cursor-pointer"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h2 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition">
                            {company.name}
                          </h2>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs font-semibold uppercase mb-1">CIF</p>
                              <p className="text-gray-900 font-mono font-semibold">{company.cif}</p>
                            </div>
                            {company.legalForm && (
                              <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Tip</p>
                                <p className="text-gray-900">{company.legalForm}</p>
                              </div>
                            )}
                            {company.city && (
                              <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Locație</p>
                                <p className="text-gray-900">
                                  {company.city}{company.county && `, ${company.county}`}
                                </p>
                              </div>
                            )}
                            {company.status && (
                              <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Status</p>
                                <p>
                                  <span
                                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                      company.status === 'activ'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}
                                  >
                                    {company.status}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-gray-400 group-hover:text-blue-600 transition mt-1 flex-shrink-0">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data && data.companies.length === 0 && debouncedQuery && !isLoading && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xl font-semibold text-gray-900 mb-2">Nu s-au găsit companii</p>
                <p className="text-gray-600 mb-4">
                  Nu există rezultate pentru căutarea: <span className="font-semibold">"{debouncedQuery}"</span>
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedQuery('');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Șterge căutarea
                </button>
              </div>
            )}

            {!debouncedQuery && (
              <>
                {/* SEO Content Section - 1200-1500 cuvinte */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-12 mt-12">
                  <div className="max-w-none">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Lista Firme din România – Ghid Complet pentru Verificare CUI și Date Financiare</h2>
                    
                    <p className="text-base md:text-lg leading-relaxed mb-6 text-gray-700">
                      Bine ai venit pe cea mai completă platformă de verificare și căutare firme din România. Aici poți găsi informații oficiale despre sute de mii de companii românești, incluzând date despre CUI (Cod Unic de Înregistrare), status fiscal, date financiare și informații de contact. Platforma noastră este alimentată cu date oficiale din surse autorizate precum ONRC (Oficiul Național al Registrului Comerțului) și ANAF (Agenția Națională de Administrare Fiscală), asigurând acuratețe și actualitate maximă.
                    </p>

                    <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Ce este CUI-ul și de ce este important?</h3>
                    <p className="text-base md:text-lg leading-relaxed mb-4 text-gray-700">
                      CUI (Cod Unic de Înregistrare) sau CIF (Cod de Înregistrare Fiscală) este un identificator unic atribuit fiecărei firme în România. Formatul standard este <strong>RO</strong> urmat de 2-10 cifre (ex: RO12345678). Acest cod este esențial pentru identificarea unei companii în toate tranzacțiile oficiale, de la înregistrarea la ONRC până la raportarea către ANAF.
                    </p>
                    <p className="text-base md:text-lg leading-relaxed mb-6 text-gray-700">
                      Verificarea CUI-ului unei firme este crucială în mai multe situații: când intenționezi să colaborezi cu o companie nouă, când verifici autenticitatea unui partener de afaceri, sau când ai nevoie de informații oficiale despre statusul unei firme. Platforma noastră oferă verificare CUI gratuită și instantanee, permițându-ți să accesezi toate datele oficiale despre orice companie românească.
                    </p>

                    <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Cum funcționează verificarea firmelor?</h3>
                    <p className="text-base md:text-lg leading-relaxed mb-4 text-gray-700">
                      Procesul de verificare este simplu și rapid. Poți căuta o firmă în mai multe moduri:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-base md:text-lg text-gray-700">
                      <li><strong className="font-semibold text-gray-900">Căutare după CUI/CIF</strong> – Introdu codul unic de înregistrare pentru a găsi instant informațiile despre firmă</li>
                      <li><strong className="font-semibold text-gray-900">Căutare după nume</strong> – Caută compania după denumirea completă sau parțială</li>
                      <li><strong className="font-semibold text-gray-900">Filtrare după județ</strong> – Explorează firmele dintr-un anumit județ sau oraș</li>
                      <li><strong className="font-semibold text-gray-900">Filtrare după cod CAEN</strong> – Găsește companii după activitatea principală</li>
                      <li><strong className="font-semibold text-gray-900">Filtrare după status</strong> – Vezi doar firme active sau inactive</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Ce informații vei găsi despre fiecare firmă?</h3>
                    <p className="text-base md:text-lg leading-relaxed mb-4 text-gray-700">
                      Pentru fiecare companie din baza noastră de date, oferim un set complet de informații oficiale:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-base md:text-lg text-gray-700">
                      <li><strong className="font-semibold text-gray-900">Date de identificare</strong> – Denumire completă, CUI, număr de înregistrare la Registrul Comerțului, formă juridică (SRL, SA, PFA, etc.)</li>
                      <li><strong className="font-semibold text-gray-900">Date de localizare</strong> – Adresă completă, oraș, județ, cod poștal</li>
                      <li><strong className="font-semibold text-gray-900">Status fiscal</strong> – Statusul firmei (activă/inactivă), status TVA, informații ANAF</li>
                      <li><strong className="font-semibold text-gray-900">Date financiare</strong> – Cifră de afaceri, profit net, număr de angajați, active, datorii (dacă disponibile)</li>
                      <li><strong className="font-semibold text-gray-900">Informații de contact</strong> – Telefon, email, website (când sunt disponibile)</li>
                      <li><strong className="font-semibold text-gray-900">Acționari și asociați</strong> – Lista acționarilor cu procente de participare</li>
                      <li><strong className="font-semibold text-gray-900">Activitate principală</strong> – Cod CAEN și descrierea activității</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">De unde provin datele?</h3>
                    <p className="text-base md:text-lg leading-relaxed mb-4 text-gray-700">
                      Toate datele prezentate pe platforma noastră provin din surse oficiale românești, actualizate periodic pentru a asigura acuratețea maximă:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-base md:text-lg text-gray-700">
                      <li><strong className="font-semibold text-gray-900">ONRC (Oficiul Național al Registrului Comerțului)</strong> – Pentru datele de înregistrare, denumire, adresă, formă juridică, acționari</li>
                      <li><strong className="font-semibold text-gray-900">ANAF (Agenția Națională de Administrare Fiscală)</strong> – Pentru statusul fiscal, status TVA, date financiare</li>
                      <li><strong className="font-semibold text-gray-900">Date.gov.ro</strong> – Pentru date publice deschise despre companiile românești</li>
                    </ul>
                    <p className="text-base md:text-lg leading-relaxed mb-6 text-gray-700">
                      Informațiile sunt procesate și prezentate într-un format ușor de înțeles, permițându-ți să accesezi rapid datele de care ai nevoie despre orice firmă din România.
                    </p>

                    <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Cum verifici dacă o firmă este activă?</h3>
                    <p className="text-base md:text-lg leading-relaxed mb-4 text-gray-700">
                      Verificarea statusului unei firme este esențială înainte de a începe orice colaborare comercială. O firmă poate fi:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-base md:text-lg text-gray-700">
                      <li><strong className="font-semibold text-gray-900">Activă</strong> – Firma funcționează normal și îndeplinește obligațiile fiscale</li>
                      <li><strong className="font-semibold text-gray-900">Inactivă</strong> – Firma nu mai funcționează sau a fost suspendată</li>
                      <li><strong className="font-semibold text-gray-900">În lichidare</strong> – Firma este în proces de lichidare</li>
                      <li><strong className="font-semibold text-gray-900">Radiere în curs</strong> – Firma este în proces de radiere din registrul comerțului</li>
                    </ul>
                    <p className="text-base md:text-lg leading-relaxed mb-6 text-gray-700">
                      Pe platforma noastră, poți verifica instant statusul oricărei firme, inclusiv dacă este plătitoare de TVA sau dacă are datorii la bugetul de stat.
                    </p>

                    <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Căutare firmă după nume – funcționalitate avansată</h3>
                    <p className="text-base md:text-lg leading-relaxed mb-4 text-gray-700">
                      Dacă știi doar numele unei firme și nu CUI-ul, poți folosi funcționalitatea noastră de căutare avansată. Sistemul nostru suportă căutare parțială, permițându-ți să găsești firme chiar dacă nu știi numele exact. De exemplu, dacă cauți "SC ABC", vei găsi toate firmele care conțin aceste cuvinte în denumire.
                    </p>
                    <p className="text-base md:text-lg leading-relaxed mb-6 text-gray-700">
                      Căutarea funcționează și pentru long-tail keywords precum "firmă [nume]" sau "companie [nume]", facilitând găsirea rapidă a informațiilor despre companiile pe care le cauți.
                    </p>

                    <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Lista firme pe județe și orașe</h3>
                    <p className="text-base md:text-lg leading-relaxed mb-4 text-gray-700">
                      Platforma noastră oferă posibilitatea de a explora firmele pe județe și orașe, facilitând cercetarea companiilor dintr-o anumită zonă geografică. Acest lucru este util atunci când:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-base md:text-lg text-gray-700">
                      <li>Cauți parteneri de afaceri locali</li>
                      <li>Analizezi piața dintr-un anumit județ</li>
                      <li>Verifici concurența într-o zonă geografică</li>
                      <li>Găsești furnizori sau clienți potențiali</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Date financiare și bilanțuri</h3>
                    <p className="text-base md:text-lg leading-relaxed mb-4 text-gray-700">
                      Pentru multe companii, oferim acces la date financiare oficiale, incluzând:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-base md:text-lg text-gray-700">
                      <li>Cifră de afaceri pe ani</li>
                      <li>Profit sau pierdere netă</li>
                      <li>Număr de angajați</li>
                      <li>Active și datorii</li>
                      <li>Evoluție pe mai mulți ani</li>
                    </ul>
                    <p className="text-base md:text-lg leading-relaxed mb-6 text-gray-700">
                      Aceste informații sunt esențiale pentru analiza performanței unei companii și pentru luarea unor decizii informate despre colaborări comerciale.
                    </p>

                    <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Confidențialitate și securitate</h3>
                    <p className="text-base md:text-lg leading-relaxed mb-4 text-gray-700">
                      Toate datele prezentate pe platforma noastră sunt publice și provin din surse oficiale. Respectăm integral legislația GDPR și oferim utilizatorilor posibilitatea de a solicita rectificarea sau ștergerea datelor, conform drepturilor garantate de Regulamentul General privind Protecția Datelor.
                    </p>
                    <p className="text-base md:text-lg leading-relaxed mb-6 text-gray-700">
                      Platforma noastră este 100% transparentă despre sursele datelor și modul în care sunt procesate informațiile. Nu colectăm date personale suplimentare și nu folosim tracking agresiv.
                    </p>

                    <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Concluzie</h3>
                    <p className="text-base md:text-lg leading-relaxed mb-6 text-gray-700">
                      Director Firme România este platforma ta de încredere pentru verificare CUI, căutare firmă și accesare date financiare oficiale. Cu sute de mii de companii în baza de date, actualizări periodice și interfață ușor de folosit, suntem partenerul tău ideal pentru transparență în mediul de afaceri românesc. Începe să explorezi acum – caută o firmă, verifică CUI-ul sau explorează companiile din județul tău!
                    </p>
                  </div>
                </div>

                {/* 10 Categorii SEO */}
                <div className="mt-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Explorează Categoriile</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Link href="/lista-firme" className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow text-center">
                      <div className="text-4xl mb-3">📊</div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Lista Firme</h3>
                      <p className="text-sm text-gray-600">Toate companiile</p>
                    </Link>
                    <Link href="/verificare-cui" className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow text-center">
                      <div className="text-4xl mb-3">🔍</div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Verificare CUI</h3>
                      <p className="text-sm text-gray-600">Verifică CIF-ul</p>
                    </Link>
                    <Link href="/firme-active" className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow text-center">
                      <div className="text-4xl mb-3">✅</div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Firme Active</h3>
                      <p className="text-sm text-gray-600">Companii funcționale</p>
                    </Link>
                    <Link href="/firme-inactive" className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow text-center">
                      <div className="text-4xl mb-3">⚠️</div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Firme Inactive</h3>
                      <p className="text-sm text-gray-600">Companii inactive</p>
                    </Link>
                    <Link href="/firme-judet/bucuresti" className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow text-center">
                      <div className="text-4xl mb-3">🏙️</div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Firme București</h3>
                      <p className="text-sm text-gray-600">Companii din capitală</p>
                    </Link>
                    <Link href="/firme-judet/cluj" className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow text-center">
                      <div className="text-4xl mb-3">🏛️</div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Firme Cluj</h3>
                      <p className="text-sm text-gray-600">Companii Cluj-Napoca</p>
                    </Link>
                    <Link href="/firme-judet/timis" className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow text-center">
                      <div className="text-4xl mb-3">🌆</div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Firme Timiș</h3>
                      <p className="text-sm text-gray-600">Companii Timișoara</p>
                    </Link>
                    <Link href="/firme-judet/iasi" className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow text-center">
                      <div className="text-4xl mb-3">🏘️</div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Firme Iași</h3>
                      <p className="text-sm text-gray-600">Companii Iași</p>
                    </Link>
                    <Link href="/firme-judet/constanta" className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow text-center">
                      <div className="text-4xl mb-3">🌊</div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Firme Constanța</h3>
                      <p className="text-sm text-gray-600">Companii Constanța</p>
                    </Link>
                    <Link href="/firme-judet/brasov" className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow text-center">
                      <div className="text-4xl mb-3">⛰️</div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Firme Brașov</h3>
                      <p className="text-sm text-gray-600">Companii Brașov</p>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 mt-20 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="font-bold text-white mb-4">Director Firme</h4>
                <p className="text-sm text-gray-400">Transparență totală în mediul de afaceri românesc.</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/privacy" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-blue-400 transition">Terms</Link></li>
                  <li><Link href="/rectification" className="hover:text-blue-400 transition">GDPR</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/sources" className="hover:text-blue-400 transition">Surse Date</Link></li>
                  <li><a href="#" className="hover:text-blue-400 transition">API Docs</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition">Status</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Contact</h4>
                <p className="text-sm text-gray-400">contact@director-firme.ro</p>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
              <p>&copy; {new Date().getFullYear()} Director Firme. Toate drepturile rezervate.</p>
              <p className="mt-2">Made with ❤️ for Romanian businesses</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

