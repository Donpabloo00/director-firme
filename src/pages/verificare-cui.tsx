/**
 * Pagină SEO pentru "verificare CUI" - Target keyword principal
 */

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';

export default function VerificareCUIPage() {
  const [cui, setCui] = useState('');
  const [searchCui, setSearchCui] = useState('');

  const { data: company, isLoading } = trpc.companies.getByCif.useQuery(
    { cif: searchCui },
    { enabled: searchCui.length > 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (cui.trim()) {
      setSearchCui(cui.trim().replace(/^RO/i, ''));
    }
  };

  return (
    <>
      <Head>
        <title>Verificare CUI Online - Verifică CIF Firma în România Gratuit</title>
        <meta name="description" content="Verificare CUI online gratuită. Verifică CIF-ul unei firme din România folosind Codul Unic de Înregistrare. Date oficiale ONRC și ANAF." />
        <meta name="keywords" content="verificare CUI, verificare CIF, verificare firma online, CUI firma, cif firma" />
        <link rel="canonical" href="https://director-firme.ro/verificare-cui" />
        
        {/* Structured Data - WebPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: 'Verificare CUI Online',
              description: 'Verificare CUI gratuită pentru firmele din România',
              url: 'https://director-firme.ro/verificare-cui',
            }),
          }}
        />
      </Head>

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold">DF</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Director Firme</span>
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-blue-600 transition">
            ← Înapoi
          </Link>
        </div>
      </nav>

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* SEO Content */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Verificare CUI Online – Verifică CIF Firma în România Gratuit
            </h1>
            
            <div className="prose prose-lg max-w-none text-gray-700 mb-6">
              <p className="text-lg leading-relaxed">
                Verifică CUI-ul (Cod Unic de Înregistrare) sau CIF-ul unei firme din România folosind platforma noastră gratuită. Obține informații oficiale despre orice companie românească în câteva secunde.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Ce este CUI-ul?</h2>
              <p>
                CUI (Cod Unic de Înregistrare) sau CIF (Cod de Înregistrare Fiscală) este un identificator unic atribuit fiecărei firme în România. Formatul standard este <strong>RO</strong> urmat de 2-10 cifre (ex: RO12345678).
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Cum verifici CUI-ul unei firme?</h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Introdu CUI-ul sau CIF-ul firmei în câmpul de mai jos</li>
                <li>Apasă butonul "Verifică"</li>
                <li>Vezi toate datele oficiale despre firmă</li>
              </ol>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Ce informații vei primi?</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Denumirea completă a firmei</li>
                <li>Statusul firmei (activă/inactivă)</li>
                <li>Adresa și locația</li>
                <li>Forma juridică</li>
                <li>Date financiare (dacă disponibile)</li>
                <li>Informații de contact</li>
              </ul>
            </div>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <label htmlFor="cui" className="block text-sm font-semibold text-gray-700 mb-2">
                Introdu CUI-ul sau CIF-ul firmei:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="cui"
                  value={cui}
                  onChange={(e) => setCui(e.target.value)}
                  placeholder="RO12345678 sau 12345678"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Verifică
                </button>
              </div>
            </form>

            {/* Results */}
            {isLoading && (
              <div className="mt-6 text-center text-gray-600">
                Se verifică...
              </div>
            )}

            {company && (
              <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-green-900 mb-4">✓ Firma găsită</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Nume:</strong> {company.name}</p>
                  <p><strong>CUI:</strong> {company.cif}</p>
                  {company.city && <p><strong>Oraș:</strong> {company.city}</p>}
                  {company.status && <p><strong>Status:</strong> {company.status}</p>}
                </div>
                <Link
                  href={`/firma/${company.slug || company.cif}`}
                  className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Vezi detalii complete →
                </Link>
              </div>
            )}

            {searchCui && !isLoading && !company && (
              <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <p className="text-red-900">Firma cu CUI {searchCui} nu a fost găsită.</p>
              </div>
            )}
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Întrebări Frecvente</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Este gratuită verificarea CUI?</h3>
                <p className="text-gray-700">Da, verificarea CUI-ului este complet gratuită pe platforma noastră.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">De unde provin datele?</h3>
                <p className="text-gray-700">Datele provin din surse oficiale: ONRC (Oficiul Național al Registrului Comerțului) și ANAF.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Cât de actualizate sunt datele?</h3>
                <p className="text-gray-700">Datele sunt actualizate periodic din sursele oficiale pentru a asigura acuratețea maximă.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

