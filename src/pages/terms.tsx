import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms and Conditions - Director Firme</title>
        <meta name="description" content="Termenii și condițiile de utilizare a Director Firme" />
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
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Termenii și Condițiile de Utilizare</h1>
              <p className="text-sm text-gray-600 mb-8">
                Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}
              </p>

              <div className="space-y-8 text-gray-700">
                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptarea Termenilor</h2>
                  <p className="text-sm">
                    Prin accesarea și utilizarea Director Firme, accepți acești termeni. Dacă nu ești de acord cu vreun termen,
                    nu poți folosi site-ul.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Sursa Datelor</h2>
                  <p className="text-sm mb-4">
                    Datele despre companii sunt colectate din următoarele surse oficiale:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>ONRC</strong> (Oficiul Național al Registrului Comerțului) - date de înregistrare</li>
                    <li><strong>ANAF</strong> (Agenția Națională de Administrare Fiscală) - date fiscale și financiare</li>
                    <li><strong>data.gov.ro</strong> - dataseturi open data cu situații financiare</li>
                    <li><strong>Portalul Instanțelor de Judecată</strong> - dosare judiciare (dacă disponibil)</li>
                  </ul>
                  <p className="text-sm mt-4">
                    Fiecare dată este marcată cu sursa și data obținerii. Verifică secțiunea "Surse de Date" din pagina companiei.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Acuratețea Datelor</h2>
                  <p className="text-sm">
                    Deși depunem eforturi pentru a menține datele actualizate și corecte, <strong>nu putem garanta 100% acuratețea</strong>.
                    Datele pot fi incomplete sau întârziate datorită sursei. Pentru informații oficiale, consultă site-urile oficiale:
                    ONRC, ANAF, etc.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Limitări de Utilizare</h2>
                  <p className="text-sm mb-3">Nu este permis:</p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Web scraping sau extragerea automată de date (bots, crawlers)</li>
                    <li>Utilizarea datelor pentru scopuri comerciale fără autorizare</li>
                    <li>Distribuirea datelor persoanelor terțe</li>
                    <li>Accesarea repetată care încarcă serverele (DoS/DDoS)</li>
                    <li>Afisarea site-ului în iframes fără permisiune</li>
                    <li>Reverse engineering sau hacking</li>
                  </ul>
                  <p className="text-sm mt-4">
                    <strong>Rate Limiting</strong>: Maxim 100 interogări pe minut per IP. Depășirea limitei poate rezulta în blocare temporară.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Responsabilitate și Exonerare</h2>
                  <p className="text-sm">
                    Director Firme nu este responsabil pentru:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm mt-2">
                    <li>Daunele rezultate din utilizarea sau nefolosirea datelor</li>
                    <li>Erori, omisiuni sau inexactități în date</li>
                    <li>Întreruperi de serviciu sau downtime</li>
                    <li>Pierderile financiare din decizii luate pe baza datelor noastre</li>
                  </ul>
                  <p className="text-sm mt-4">
                    <strong>Serviciul este oferit "as-is" fără garanții.</strong>
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Reclame și Conținut de Terți</h2>
                  <p className="text-sm">
                    Site-ul afișează reclame din Google AdSense. Reclamele sunt selectate automat și pot fi personalizate
                    pe baza intereselor tale (via cookies). Poți dezactiva cookies personalizate din setările browserului.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Copyright și Proprietate Intelectuală</h2>
                  <p className="text-sm">
                    Conținutul site-ului (layout, interfață, cod) este protejat de copyright. Datele despre companii
                    sunt din surse publice și nu sunt protejate de copyright (sunt date factice).
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Monitorizare și Alerte</h2>
                  <p className="text-sm">
                    Dacă crei un cont pentru a monitoriza companii, ești de acord să primești notificări prin email.
                    Oricând poți dezactiva alertele din contul tău.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Rectificări și Plângeri</h2>
                  <p className="text-sm">
                    Dacă ai informații incorecte despre o companie, poți raporta folosind formularul din pagina
                    <Link href="/rectification" className="text-blue-600 hover:underline"> Rectificare Date</Link>.
                    Vom investiga și corecta datele dacă este cazul.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Legea Aplicabilă</h2>
                  <p className="text-sm">
                    Acești termeni sunt reglementați de legile României. Jurisdicția exclusivă aparține instanțelor din România.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Modificări la Termeni</h2>
                  <p className="text-sm">
                    Putem modifica acești termeni oricând. Vei fi notificat de schimbări majore pe site. Continuarea utilizării
                    înseamnă acceptarea termenilor noi.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Contact și Suport</h2>
                  <p className="text-sm">
                    Pentru întrebări despre acești termeni, folosește formularul din pagina
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
