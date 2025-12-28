import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Director Firme</title>
        <meta name="description" content="Politica de confidențialitate a Director Firme" />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Înapoi la căutare
            </Link>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Politica de Confidențialitate</h1>
              <p className="text-sm text-gray-600 mb-8">
                Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}
              </p>

              <div className="space-y-8 text-gray-700">
                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introducere</h2>
                  <p className="mb-4">
                    Director Firme (în continuare "noi", "site-ul") se angajează să protejeze confidențialitatea
                    dumneavoastră. Această politică de confidențialitate explică cum colectăm, folosim, dezvăluim și
                    protejez informațiile dumneavoastră.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Informații pe Care le Colectăm</h2>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">Date despre Companii (Publice)</h3>
                      <p className="text-sm mt-1">
                        Colectăm date publice despre companiile din România din următoarele surse oficiale:
                      </p>
                      <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                        <li>ONRC (Oficiul Național al Registrului Comerțului)</li>
                        <li>ANAF (Agenția Națională de Administrare Fiscală)</li>
                        <li>data.gov.ro (Dataseturi Open Data)</li>
                        <li>Portalul Instanțelor de Judecată</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800">Date despre Utilizatori</h3>
                      <p className="text-sm mt-1">La vizitarea site-ului, colectăm:</p>
                      <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                        <li><strong>IP Address</strong> - pentru securitate și analitică</li>
                        <li><strong>User Agent</strong> - tip dispozitiv/browser</li>
                        <li><strong>Cookies</strong> - de la Google Analytics și Google AdSense</li>
                        <li><strong>Search queries</strong> - companii căutate (pentru a îmbunătăți serviciul)</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Baza Legală pentru Prelucrare</h2>
                  <p className="mb-4">
                    Prelucrăm datele pe baza următoarelor baze legale:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Interes Legitim</strong> (Art. 6 (1) (f) GDPR) - pentru furnizarea serviciilor și
                      îmbunătățirea platformei</li>
                    <li><strong>Consimțământ</strong> - pentru cookies și Google AdSense</li>
                    <li><strong>Obligație legală</strong> - pentru audit logs și compliance</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Google Analytics și Google AdSense</h2>
                  <p className="mb-4">
                    Site-ul folosește Google Analytics și Google AdSense. Acestea instalează cookies care pot transmite
                    date către Google. Datele sunt utilizate pentru:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Analytics</strong> - urmărirea vizitelor și comportamentului utilizatorilor</li>
                    <li><strong>Reclame Personalizate</strong> - google AdSense adaptează anunțuri la interesele tale</li>
                  </ul>
                  <p className="text-sm mt-4">
                    Poți opri colectarea datelor de Analytics:
                    <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"> Google Analytics Opt-out Browser Add-on</a>
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Retenția Datelor</h2>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Date despre Companii</strong> - păstrate atât timp cât sunt relevante</li>
                    <li><strong>Audit Logs</strong> - 1 an (pentru compliance legal)</li>
                    <li><strong>Cookies Analytics</strong> - până la 2 ani</li>
                    <li><strong>IP Address din logs</strong> - 90 zile</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Drepturi ale Utilizatorilor (GDPR)</h2>
                  <p className="mb-4">Ai dreptul să:</p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Acces</strong> - cereri informații despre ce date deținnem despre tine</li>
                    <li><strong>Rectificare</strong> - să corectezi date incorecte</li>
                    <li><strong>Ștergere</strong> - să soliciti ștergerea datelor personale (cu excepția obligațiilor legale)</li>
                    <li><strong>Restricție</strong> - să limitezi procesarea datelor</li>
                    <li><strong>Opoziție</strong> - să te opui prelucrării datelor</li>
                    <li><strong>Portabilitate</strong> - să primești datele în format structurat</li>
                  </ul>
                  <p className="text-sm mt-4">
                    Pentru a exercita aceste drepturi, folosește formularul din pagina <Link href="/rectification"
                      className="text-blue-600 hover:underline">Rectificare Date</Link>.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Securitatea Datelor</h2>
                  <p className="mb-4">
                    Folosim măsuri de securitate adecvate:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>HTTPS encryption pentru toate conexiunile</li>
                    <li>Database pe Supabase (compliant ISO 27001)</li>
                    <li>Rate limiting pentru prevenirea abuse</li>
                    <li>Audit logs pentru tracking accesului</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Partajarea Datelor</h2>
                  <p className="text-sm">
                    <strong>NU partajăm datele personale cu terți</strong>, cu excepția:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm mt-2">
                    <li>Google Analytics și Google AdSense (sub termenii lor de confidențialitate)</li>
                    <li>Furnizori de hosting și server (Vercel, Supabase)</li>
                    <li>Dacă e necesar din motive legale (ordin de curs, etc.)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Modificări la Această Politică</h2>
                  <p className="text-sm">
                    Putem actualiza această politică oricând. Vei fi notificat de schimbări majore. Continuarea utilizării
                    site-ului înseamnă acceptarea noilor termeni.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Contact</h2>
                  <p className="text-sm">
                    Pentru orice întrebări despre confidențialitate, contactează-ne folosind formularul din pagina
                    <Link href="/rectification" className="text-blue-600 hover:underline"> Rectificare Date</Link>.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
