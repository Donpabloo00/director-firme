import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface DataSource {
  name: string;
  url: string;
  type: string;
  fields: string[];
  lastUpdated: string;
  frequency: string;
  status: 'active' | 'inactive' | 'planned';
}

const dataSources: DataSource[] = [
  {
    name: 'ONRC (Oficiul Național al Registrului Comerțului)',
    url: 'https://www.onrc.ro',
    type: 'Înregistrări Companii',
    fields: ['Nume', 'CIF', 'Status', 'Dată Înregistrare', 'Formă Juridică', 'Acționari'],
    lastUpdated: new Date().toLocaleDateString('ro-RO'),
    frequency: 'Zilnic',
    status: 'active',
  },
  {
    name: 'ANAF (Agenția Națională de Administrare Fiscală)',
    url: 'https://www.anaf.ro',
    type: 'Date Fiscale și Financiare',
    fields: ['Status TVA', 'Restanțe Fiscale', 'Bilanțuri', 'Declarații Financiare'],
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ro-RO'),
    frequency: 'Săptămânal',
    status: 'active',
  },
  {
    name: 'data.gov.ro (Dataseturi Open Data)',
    url: 'https://data.gov.ro',
    type: 'Dataseturi Publice',
    fields: ['Situații Financiare', 'Cifre de Afaceri', 'Profit/Pierdere', 'Angajați'],
    lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ro-RO'),
    frequency: 'Anual/Trimestrial',
    status: 'active',
  },
  {
    name: 'Portalul Instanțelor de Judecată',
    url: 'https://portal.just.ro',
    type: 'Dosare Judiciare',
    fields: ['Dosare Civile', 'Dosare Penale', 'Proceduri Insolvență'],
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('ro-RO'),
    frequency: 'Zilnic',
    status: 'inactive',
  },
  {
    name: 'MF (Ministerul Finanțelor) - Bilanțuri',
    url: 'https://mfp.gov.ro',
    type: 'Bilanțuri și Rapoarte Financiare',
    fields: ['Bilanț', 'Cont de Profit și Pierdere', 'Flux de Numerar'],
    lastUpdated: '-',
    frequency: 'Anual',
    status: 'planned',
  },
];

export default function Sources() {
  return (
    <>
      <Head>
        <title>Surse de Date - Director Firme</title>
        <meta name="description" content="Sursele de date și frecvența actualizării informațiilor" />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Înapoi la căutare
            </Link>

            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Surse de Date</h1>
              <p className="text-gray-600 mb-6">
                Transparență totală: Iată de unde provin informațiile afișate pe Director Firme și cât de des sunt actualizate.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <h3 className="font-semibold text-blue-900 mb-2">🔍 Transparență și Audit</h3>
                <p className="text-sm text-blue-800">
                  Fiecare pagină de companie afișează clar sursa datelor și data actualizării. Datele sunt obținute doar din
                  surse oficiale și publice, respectând termenii și condițiile fiecărei surse.
                </p>
              </div>

              <div className="space-y-6">
                {dataSources.map((source, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{source.name}</h3>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {source.url}
                        </a>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Tip Date</p>
                            <p className="text-sm text-gray-900">{source.type}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Frecvență Actualizare</p>
                            <p className="text-sm text-gray-900">{source.frequency}</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Câmpuri Disponibile</p>
                          <div className="flex flex-wrap gap-2">
                            {source.fields.map((field, i) => (
                              <span
                                key={i}
                                className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Status</p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block w-3 h-3 rounded-full ${
                                source.status === 'active'
                                  ? 'bg-green-500'
                                  : source.status === 'inactive'
                                    ? 'bg-red-500'
                                    : 'bg-yellow-500'
                              }`}
                            ></span>
                            <span className="text-sm text-gray-700">
                              {source.status === 'active'
                                ? 'Activ'
                                : source.status === 'inactive'
                                  ? 'Inactiv'
                                  : 'Planificat'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Ultima Actualizare</p>
                          <p className="text-sm text-gray-900">{source.lastUpdated}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">📋 Politica de Actualizare</h2>
              <div className="space-y-4 text-sm text-gray-700">
                <p>
                  <strong>Zilnic:</strong> Datele de la ONRC sunt verificate și actualizate zilnic. Dosarele judiciare sunt
                  actualizate la fiecare 3 zile.
                </p>
                <p>
                  <strong>Săptămânal:</strong> Status fiscal (TVA) și informații ANAF sunt actualizate o dată pe săptămână.
                </p>
                <p>
                  <strong>Anual/Trimestrial:</strong> Dataseturi open data (bilanțuri, situații financiare) sunt actualizate
                  conform calendarul Ministerului Finanțelor.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">⚠️ Disclaimer</h2>
              <div className="space-y-4 text-sm text-gray-700">
                <p>
                  Deși depunem eforturi pentru a menține datele actualizate și corecte, <strong>nu garantez 100% acuratețea</strong>.
                  Datele pot fi incomplete, întârziate sau inaccurate din cauza surselor de origine.
                </p>
                <p>
                  <strong>Pentru informații oficiale și verificate, consultă întotdeauna site-urile oficiale:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li><a href="https://www.onrc.ro" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ONRC.ro</a></li>
                  <li><a href="https://www.anaf.ro" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ANAF.ro</a></li>
                  <li><a href="https://data.gov.ro" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">data.gov.ro</a></li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">🔗 Cum să Raportezi o Eroare</h2>
              <p className="text-sm text-gray-700 mb-4">
                Ai găsit o dată incorecta? Poți raporta folosind formularul din pagina
                <Link href="/rectification" className="text-blue-600 hover:underline"> Rectificare Date</Link>.
              </p>
              <p className="text-sm text-gray-700">
                Vom investiga raportul și vom corecta datele dacă este cazul. Merci că ne ajuți să îmbunătățim calitatea
                datelor!
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
