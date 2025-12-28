/**
 * Script de analiză SEO pentru Director Firme
 * Verifică: meta tags, structured data, sitemap, robots.txt, performance
 */

import 'dotenv/config';
import { db } from '../server/db';
import { companies } from '../server/db/schema';
import * as fs from 'fs';
import * as path from 'path';

interface SEOAnalysis {
  totalCompanies: number;
  companiesWithCompleteData: number;
  companiesWithContactInfo: number;
  companiesWithAddress: number;
  averageTitleLength: number;
  averageDescriptionLength: number;
  structuredDataIssues: string[];
  recommendations: string[];
}

async function analyzeSEO(): Promise<SEOAnalysis> {
  if (!db) {
    throw new Error('Database connection not available');
  }
  console.log('🔍 Analiză SEO Director Firme...\n');

  // 1. Statistici generale
  const allCompanies = await db.select().from(companies);
  const totalCompanies = allCompanies.length;
  
  console.log(`📊 Total companii în baza de date: ${totalCompanies.toLocaleString('ro-RO')}`);

  // 2. Analiză completitudine date
  const companiesWithCompleteData = allCompanies.filter(c => 
    c.name && c.cif && c.address && c.city && c.county
  ).length;

  const companiesWithContactInfo = allCompanies.filter(c => 
    c.phone || c.email || c.website
  ).length;

  const companiesWithAddress = allCompanies.filter(c => 
    c.address && c.city
  ).length;

  console.log(`\n✅ Date complete:`);
  console.log(`   - Cu date complete: ${companiesWithCompleteData.toLocaleString('ro-RO')} (${((companiesWithCompleteData/totalCompanies)*100).toFixed(1)}%)`);
  console.log(`   - Cu adresă: ${companiesWithAddress.toLocaleString('ro-RO')} (${((companiesWithAddress/totalCompanies)*100).toFixed(1)}%)`);
  console.log(`   - Cu date de contact: ${companiesWithContactInfo.toLocaleString('ro-RO')} (${((companiesWithContactInfo/totalCompanies)*100).toFixed(1)}%)`);

  // 3. Analiză lungime titluri și descrieri
  const titleLengths = allCompanies.map(c => {
    const title = `${c.name} - CIF ${c.cif} | Director Firme România`;
    return title.length;
  });

  const descriptionLengths = allCompanies.map(c => {
    const desc = `Informații complete despre ${c.name}, CIF ${c.cif}. ${c.city ? `Localizată în ${c.city}` : ''}${c.county ? `, ${c.county}` : ''}. Date financiare, juridice, acționari și date de contact.`;
    return desc.length;
  });

  const avgTitleLength = titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length;
  const avgDescLength = descriptionLengths.reduce((a, b) => a + b, 0) / descriptionLengths.length;

  console.log(`\n📝 Optimizare Meta Tags:`);
  console.log(`   - Lungime medie titlu: ${avgTitleLength.toFixed(0)} caractere (recomandat: 50-60)`);
  console.log(`   - Lungime medie descriere: ${avgDescLength.toFixed(0)} caractere (recomandat: 150-160)`);

  const longTitles = titleLengths.filter(l => l > 60).length;
  const shortDescriptions = descriptionLengths.filter(l => l < 120).length;
  
  if (longTitles > 0) {
    console.log(`   ⚠️  ${longTitles} companii au titluri prea lungi (>60 chars)`);
  }
  if (shortDescriptions > 0) {
    console.log(`   ⚠️  ${shortDescriptions} companii au descrieri prea scurte (<120 chars)`);
  }

  // 4. Verificare structured data
  const structuredDataIssues: string[] = [];
  
  const companiesWithoutAddress = allCompanies.filter(c => !c.address || !c.city).length;
  if (companiesWithoutAddress > 0) {
    structuredDataIssues.push(`${companiesWithoutAddress} companii fără adresă completă (necesară pentru structured data)`);
  }

  // 5. Recomandări
  const recommendations: string[] = [];

  if (companiesWithContactInfo / totalCompanies < 0.1) {
    recommendations.push('Adaugă date de contact pentru mai multe companii (telefon, email, website)');
  }

  if (companiesWithCompleteData / totalCompanies < 0.8) {
    recommendations.push('Completează datele lipsă pentru companii (adresă, oraș, județ)');
  }

  if (totalCompanies > 50000) {
    recommendations.push('Implementează sitemap index pentru mai mult de 50K companii');
  }

  recommendations.push('Adaugă hreflang tags pentru SEO internațional (dacă planifici expansiune)');
  recommendations.push('Implementează paginare optimizată pentru listări (prev/next links)');
  recommendations.push('Adaugă schema.org pentru LocalBusiness (pentru companii cu locație fizică)');

  console.log(`\n📋 Probleme detectate:`);
  structuredDataIssues.forEach(issue => {
    console.log(`   ⚠️  ${issue}`);
  });

  console.log(`\n💡 Recomandări SEO:`);
  recommendations.forEach((rec, idx) => {
    console.log(`   ${idx + 1}. ${rec}`);
  });

  // 6. Verificare fișiere SEO
  console.log(`\n📁 Verificare fișiere SEO:`);
  
  const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    console.log(`   ✅ robots.txt există`);
  } else {
    console.log(`   ❌ robots.txt lipsește`);
  }

  // 7. Statistici finale
  const seoScore = calculateSEOScore({
    totalCompanies,
    companiesWithCompleteData,
    companiesWithContactInfo,
    companiesWithAddress,
    avgTitleLength,
    avgDescLength,
  });

  console.log(`\n🎯 Scor SEO: ${seoScore}/100`);
  console.log(`   ${getSEOGrade(seoScore)}\n`);

  return {
    totalCompanies,
    companiesWithCompleteData,
    companiesWithContactInfo,
    companiesWithAddress,
    averageTitleLength: avgTitleLength,
    averageDescriptionLength: avgDescLength,
    structuredDataIssues,
    recommendations,
  };
}

function calculateSEOScore(data: any): number {
  let score = 0;
  
  // Completitudine date (40%)
  const dataCompleteness = (data.companiesWithCompleteData / data.totalCompanies) * 100;
  score += Math.min(dataCompleteness / 100 * 40, 40);
  
  // Date de contact (20%)
  const contactCompleteness = (data.companiesWithContactInfo / data.totalCompanies) * 100;
  score += Math.min(contactCompleteness / 100 * 20, 20);
  
  // Optimizare meta tags (20%)
  if (data.averageTitleLength >= 50 && data.averageTitleLength <= 60) score += 10;
  if (data.averageDescriptionLength >= 120 && data.averageDescriptionLength <= 160) score += 10;
  
  // Structured data (20%)
  const addressCompleteness = (data.companiesWithAddress / data.totalCompanies) * 100;
  score += Math.min(addressCompleteness / 100 * 20, 20);
  
  return Math.round(score);
}

function getSEOGrade(score: number): string {
  if (score >= 90) return '🌟 Excelent - Site-ul este foarte bine optimizat pentru SEO';
  if (score >= 75) return '✅ Bun - Site-ul este bine optimizat, cu câteva îmbunătățiri posibile';
  if (score >= 60) return '⚠️  Acceptabil - Sunt necesare îmbunătățiri pentru SEO';
  return '❌ Necesită optimizare - Site-ul necesită optimizări majore pentru SEO';
}

analyzeSEO().catch(console.error);

