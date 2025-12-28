/**
 * Pagină SEO: Firme Active din România
 */

import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { db } from '@/server/db';
import { companies } from '@/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

interface FirmeActiveProps {
  companies: any[];
  total: number;
  page: number;
  totalPages: number;
}

export default function FirmeActivePage({ companies, total, page, totalPages }: FirmeActiveProps) {
  return (
    <>
      <Head>
        <title>Firme Active din România - Lista Completă cu CIF și Date</title>
        <meta name="description" content="Lista completă a firmelor active din România. Verifică statusul, CIF-ul și datele financiare ale companiilor active. Date oficiale ONRC și ANAF." />
        <meta name="keywords" content="firme active, companii active romania, firma activa, status firma activa, firme functionale" />
        <link rel="canonical" href="https://director-firme.ro/firme-active" />
      </Head>

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold">DF</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Director Firme</span>
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-blue-600 transition">← Înapoi</Link>
        </div>
      </nav>

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Firme Active din România</h1>
            <p className="text-lg text-gray-700 mb-6">
              Lista completă a firmelor active din România. O firmă activă este o companie care funcționează normal, îndeplinește obligațiile fiscale și este înregistrată la ONRC. Verifică statusul, CIF-ul și datele financiare ale companiilor active.
            </p>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="text-green-900 font-semibold">📊 Total firme active: {total.toLocaleString('ro-RO')}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Lista Firme Active</h2>
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
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">ACTIVĂ</span>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {page > 1 && (
                  <Link href={`/firme-active?page=${page - 1}`} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                    ← Anterior
                  </Link>
                )}
                <span className="px-4 py-2">Pagina {page} din {totalPages}</span>
                {page < totalPages && (
                  <Link href={`/firme-active?page=${page + 1}`} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
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
        .where(eq(companies.status, 'activ'))
        .orderBy(desc(companies.lastUpdated))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(companies)
        .where(eq(companies.status, 'activ')),
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
    console.error('Error:', error);
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

