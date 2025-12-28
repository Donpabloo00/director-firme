/**
 * Pagină SEO pentru "lista firme" - Target keyword principal
 */

import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { db } from '@/server/db';
import { companies } from '@/server/db/schema';
import { getBaseUrl } from '@/lib/seo-utils';
import { desc, eq, sql } from 'drizzle-orm';

interface ListaFirmeProps {
  companies: any[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ListaFirmePage({ companies, total, page, totalPages }: ListaFirmeProps) {
  return (
    <>
      <Head>
        <title>Lista Firme din România - Director Complet cu CIF și Date Financiare</title>
        <meta name="description" content="Lista completă a firmelor din România. Caută companii după nume, CIF, județ sau CAEN. Verificare firmă online cu date oficiale ONRC și ANAF." />
        <meta name="keywords" content="lista firme, firme romania, companii romania, verificare firma, date firma, cif firma" />
        {/* CRITICAL SEO: Each page canonicalizes to itself */}
        {/* Page 1: index,follow | Page 2+: noindex,follow */}
        {/* This prevents infinite pagination URLs from being indexed */}
        <link rel="canonical" href={`${getBaseUrl()}/lista-firme${page > 1 ? `?page=${page}` : ''}`} />
        {/* SEO Pagination: rel=prev/next for page > 1 */}
        {page > 1 && page <= totalPages && (
          <>
            {page > 1 && (
              <link rel="prev" href={`${getBaseUrl()}/lista-firme?page=${page - 1}`} />
            )}
            {page < totalPages && (
              <link rel="next" href={`${getBaseUrl()}/lista-firme?page=${page + 1}`} />
            )}
          </>
        )}
        {/* Meta robots: noindex for paginated pages (page > 1) */}
        {/* Only page 1 is indexed - pagination is for UX, not SEO */}
        <meta name="robots" content={page === 1 ? "index, follow" : "noindex, follow"} />
        
        {/* Structured Data - CollectionPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: 'Lista Firme din România',
              description: 'Lista completă a firmelor din România cu date oficiale',
              url: 'https://director-firme.ro/lista-firme',
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
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* SEO Content */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Lista Firme din România – Verificare CUI, Date Financiare și Statut
            </h1>
            
            <div className="prose prose-lg max-w-none text-gray-700 mb-6">
              <p className="text-lg leading-relaxed">
                Bine ai venit pe cea mai completă listă de firme din România. Aici poți găsi informații oficiale despre sute de mii de companii românești, incluzând date despre CUI (Cod Unic de Înregistrare), status fiscal, date financiare și informații de contact.
              </p>
              
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Cum funcționează lista de firme?</h2>
              <p>
                Lista noastră de firme este actualizată periodic cu date oficiale din surse autorizate precum ONRC (Oficiul Național al Registrului Comerțului) și ANAF (Agenția Națională de Administrare Fiscală). Fiecare firmă din listă include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>CUI (Cod Unic de Înregistrare)</strong> - identificatorul unic al firmei</li>
                <li><strong>Denumire completă</strong> - numele oficial al companiei</li>
                <li><strong>Status</strong> - activă sau inactivă</li>
                <li><strong>Județ și localitate</strong> - locația firmei</li>
                <li><strong>Formă juridică</strong> - SRL, SA, PFA, etc.</li>
                <li><strong>Date financiare</strong> - cifră de afaceri, profit, angajați (dacă disponibile)</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Cum verifici o firmă?</h2>
              <p>
                Verificarea unei firme este simplă: caută după nume sau CUI în bara de căutare de mai sus, sau navighează prin listă. Poți filtra firmele după județ, status sau activitate principală (cod CAEN).
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">De unde provin datele?</h2>
              <p>
                Toate datele provin din surse oficiale românești: ONRC pentru datele de înregistrare și ANAF pentru statusul fiscal. Informațiile sunt actualizate periodic pentru a asigura acuratețea maximă.
              </p>
            </div>
          </div>

          {/* Companies List */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Firme ({total.toLocaleString('ro-RO')} total)
            </h2>
            
            <div className="space-y-4">
              {companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/firma/${company.slug || company.cif}`}
                  className="block bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition border-2 border-transparent hover:border-blue-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{company.name}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span><strong>CIF:</strong> {company.cif}</span>
                        {company.city && <span><strong>Oraș:</strong> {company.city}</span>}
                        {company.county && <span><strong>Județ:</strong> {company.county}</span>}
                        {company.status && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            company.status === 'activ' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {company.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/lista-firme?page=${page - 1}`}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    ← Anterior
                  </Link>
                )}
                <span className="px-4 py-2">
                  Pagina {page} din {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/lista-firme?page=${page + 1}`}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Următor →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const page = parseInt(context.query.page as string) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  try {
    if (!db) {
      throw new Error('Database connection not available');
    }

    const [companyList, totalResult] = await Promise.all([
      db
        .select()
        .from(companies)
        .orderBy(desc(companies.lastUpdated))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(companies),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    return {
      props: {
        companies: companyList.map(c => ({
          ...c,
          registrationDate: c.registrationDate ? new Date(c.registrationDate).toISOString() : null,
        })),
        total,
        page,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching companies:', error);
    return {
      props: {
        companies: [],
        total: 0,
        page: 1,
        totalPages: 0,
      },
    };
  }
};

