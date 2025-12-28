import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

type RequestType = 'report_error' | 'access' | 'rectification' | 'deletion' | 'other';

export default function Rectification() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    requestType: 'report_error' as RequestType,
    companyName: '',
    companyCif: '',
    message: '',
    agreed: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/rectification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          requestType: 'report_error',
          companyName: '',
          companyCif: '',
          message: '',
          agreed: false,
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestTypeLabels: Record<RequestType, string> = {
    report_error: 'Raportare Eroare în Date',
    access: 'Acces la Datele Mele Personale (GDPR)',
    rectification: 'Rectificare Date Incorecte (GDPR)',
    deletion: 'Ștergere Date Personale (GDPR)',
    other: 'Alta Cerere',
  };

  if (submitted) {
    return (
      <>
        <Head>
          <title>Cerere Trimisă - Director Firme</title>
        </Head>
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Cerere Trimisă cu Succes!</h2>
                <p className="text-gray-600 mb-6">
                  Mulțumim pentru cererea ta. Voi fi contactat în curând la adresa de email furnizată.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Pentru cereri GDPR, vom răspunde în termen de 30 de zile calendaristice, conform legislației.
                </p>
                <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                  Înapoi la Căutare
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Rectificare Date - Director Firme</title>
        <meta name="description" content="Formular pentru rectificarea datelor și cererile GDPR" />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Înapoi la căutare
            </Link>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Rectificare Date</h1>
              <p className="text-gray-600 mb-8">
                Folosește acest formular pentru a raporta erori în date, sau pentru a exercita drepturile GDPR.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Drepturile Tale GDPR</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ <strong>Acces</strong> - să aflii ce date avem despre tine</li>
                  <li>✓ <strong>Rectificare</strong> - să corectezi date incorecte</li>
                  <li>✓ <strong>Ștergere</strong> - să soliciti ștergerea datelor (cu excepții legale)</li>
                  <li>✓ <strong>Opoziție</strong> - să te opui prelucrării datelor</li>
                </ul>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tip Cerere */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipul Cererii *
                  </label>
                  <select
                    name="requestType"
                    value={formData.requestType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(requestTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nume */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nume Complet *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ion Popescu"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ion@example.com"
                  />
                </div>

                {/* Companie (dacă e relevant) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nume Companie
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Exemplu SRL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      CIF/CUI
                    </label>
                    <input
                      type="text"
                      name="companyCif"
                      value={formData.companyCif}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="RO12345678"
                    />
                  </div>
                </div>

                {/* Detalii Cererii */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Detalii și Mesaj *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descrie detaliat ceea ce vrei să raportezi sau să soliciti. Cât mai de detaliu, cu atât mai bine."
                  ></textarea>
                </div>

                {/* Checkbox GDPR */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="agreed"
                      checked={formData.agreed}
                      onChange={handleChange}
                      required
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Sunt de acord ca Director Firme să prelucreze cererea mea conform GDPR și Privacy Policy.
                      Datele vor fi folosite doar pentru a răspunde la cererea mea.
                    </span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !formData.agreed}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Se Trimite...' : 'Trimite Cererea'}
                </button>
              </form>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p className="font-semibold text-gray-700 mb-2">⏱️ Timp de Răspuns</p>
                <ul className="space-y-1">
                  <li>• <strong>Raportare Eroare:</strong> 3-5 zile lucrătoare</li>
                  <li>• <strong>Cereri GDPR:</strong> 30 zile calendaristice (conform legii)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
