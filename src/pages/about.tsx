import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <Head>
        <title>Despre Noi - Director Firme România</title>
        <meta name="description" content="Află mai multe despre Director Firme România, misiunea noastră și sursele de date utilizate pentru a oferi informații transparente despre companii." />
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
            ← Înapoi la căutare
          </Link>
        </div>
      </nav>

      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Despre Director Firme România</h1>
            
            <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-gray-900">Misiunea Noastră</h2>
                <p>
                  Director Firme România este o platformă dedicată transparenței mediului de afaceri românesc. Misiunea noastră este să oferim acces rapid, simplu și gratuit la informații oficiale despre companiile înregistrate în România.
                </p>
                <p>
                  Într-o economie modernă, accesul la date corecte despre partenerii de afaceri, concurenți sau potențiali angajatori este esențial pentru luarea unor decizii informate.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900">Sursele Noastre de Date</h2>
                <p>
                  Informațiile prezentate pe platforma noastră sunt colectate și agregate din surse oficiale publice și date deschise (Open Data), incluzând:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>ONRC</strong> (Oficiul Național al Registrului Comerțului) - pentru date de identificare și status juridic.</li>
                  <li><strong>ANAF</strong> (Agenția Națională de Administrare Fiscală) - pentru indicatori financiari și obligații fiscale.</li>
                  <li><strong>Data.gov.ro</strong> - portalul oficial de date deschise al Guvernului României.</li>
                </ul>
                <p className="text-sm italic">
                  Notă: Deși depunem eforturi constante pentru a asigura acuratețea datelor, informațiile sunt oferite "așa cum sunt" și trebuie verificate întotdeauna cu sursele oficiale pentru decizii juridice sau financiare critice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900">Tehnologie și Inovare</h2>
                <p>
                  Platforma este construită folosind cele mai noi tehnologii web pentru a asigura o viteză de încărcare superioară și o experiență de utilizare optimă pe orice dispozitiv. Utilizăm algoritmi avansați pentru indexare și structurarea datelor, facilitând găsirea informațiilor dorite în câteva secunde.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900">Contact</h2>
                <p>
                  Suntem mereu deschiși la feedback și sugestii. Dacă ai întrebări despre platformă sau ai observat informații care necesită actualizare, te rugăm să ne contactezi prin intermediul paginilor noastre oficiale.
                </p>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 flex justify-center gap-6">
              <Link href="/terms" className="text-sm text-gray-500 hover:text-blue-600">Termeni și Condiții</Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-blue-600">Politica de Confidențialitate</Link>
              <Link href="/sources" className="text-sm text-gray-500 hover:text-blue-600">Surse Date</Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Director Firme România. Toate drepturile rezervate.
          </p>
        </div>
      </footer>
    </>
  );
}
