/**
 * Script pentru export lista companii
 * Usage: npm run export:list
 */

import 'dotenv/config';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from '../server/db/index';
import { companies } from '../server/db/schema';
import { asc } from 'drizzle-orm';
import * as fs from 'fs';

async function exportCompaniesList() {
  if (!db) {
    throw new Error('Database connection not available');
  }
  console.log('📋 Generare listă companii...\n');

  try {
    // Obține toate companiile
    const allCompanies = await db
      .select({
        cif: companies.cif,
        name: companies.name,
        city: companies.city,
        county: companies.county,
        legalForm: companies.legalForm,
        status: companies.status,
        address: companies.address,
        registrationNumber: companies.registrationNumber,
        registrationDate: companies.registrationDate,
      })
      .from(companies)
      .orderBy(asc(companies.name));

    console.log(`✅ Găsite ${allCompanies.length} companii\n`);

    // Generează lista text
    let textList = '='.repeat(80) + '\n';
    textList += 'LISTA COMPANII - DIRECTOR FIRME ROMÂNIA\n';
    textList += `Total: ${allCompanies.length} companii\n`;
    textList += `Generat: ${new Date().toLocaleString('ro-RO')}\n`;
    textList += '='.repeat(80) + '\n\n';

    allCompanies.forEach((company, index) => {
      textList += `${index + 1}. ${company.name || 'N/A'}\n`;
      textList += `   CIF: ${company.cif || 'N/A'}\n`;
      if (company.registrationNumber) {
        textList += `   Nr. înregistrare: ${company.registrationNumber}\n`;
      }
      if (company.legalForm) {
        textList += `   Formă juridică: ${company.legalForm}\n`;
      }
      if (company.status) {
        textList += `   Status: ${company.status}\n`;
      }
      if (company.city || company.county) {
        textList += `   Locație: ${company.city || ''}${company.city && company.county ? ', ' : ''}${company.county || ''}\n`;
      }
      if (company.address) {
        textList += `   Adresă: ${company.address}\n`;
      }
      if (company.registrationDate) {
        const date = new Date(company.registrationDate).toLocaleDateString('ro-RO');
        textList += `   Data înregistrare: ${date}\n`;
      }
      textList += '\n';
    });

    // Salvează fișier text
    const textPath = 'lista-companii.txt';
    fs.writeFileSync(textPath, textList, 'utf-8');
    console.log(`✅ Listă text salvată: ${textPath}\n`);

    // Generează CSV
    let csvContent = 'Nr.,Denumire,CIF,Nr. Înregistrare,Formă Juridică,Status,Oraș,Județ,Adresă,Data Înregistrare\n';
    
    allCompanies.forEach((company, index) => {
      const row = [
        index + 1,
        `"${(company.name || '').replace(/"/g, '""')}"`,
        company.cif || '',
        company.registrationNumber || '',
        company.legalForm || '',
        company.status || '',
        company.city || '',
        company.county || '',
        `"${(company.address || '').replace(/"/g, '""')}"`,
        company.registrationDate ? new Date(company.registrationDate).toLocaleDateString('ro-RO') : '',
      ];
      csvContent += row.join(',') + '\n';
    });

    const csvPath = 'lista-companii.csv';
    fs.writeFileSync(csvPath, csvContent, 'utf-8');
    console.log(`✅ Listă CSV salvată: ${csvPath}\n`);

    // Generează lista HTML
    let htmlContent = `<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lista Companii - Director Firme România</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 {
            color: #1e40af;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 10px;
        }
        .stats {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .company {
            background: white;
            padding: 20px;
            margin-bottom: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid #3b82f6;
        }
        .company h2 {
            color: #1e293b;
            margin-top: 0;
            font-size: 1.3em;
        }
        .company-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 10px;
            margin-top: 10px;
        }
        .info-item {
            padding: 8px;
            background: #f8fafc;
            border-radius: 4px;
        }
        .info-label {
            font-weight: bold;
            color: #64748b;
            font-size: 0.85em;
            text-transform: uppercase;
        }
        .info-value {
            color: #1e293b;
            margin-top: 4px;
        }
        .status-active {
            color: #059669;
            font-weight: bold;
        }
        .status-inactive {
            color: #dc2626;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>📊 Lista Companii - Director Firme România</h1>
    <div class="stats">
        <strong>Total companii:</strong> ${allCompanies.length}<br>
        <strong>Generat:</strong> ${new Date().toLocaleString('ro-RO')}
    </div>
`;

    allCompanies.forEach((company, index) => {
      htmlContent += `
    <div class="company">
        <h2>${index + 1}. ${company.name || 'N/A'}</h2>
        <div class="company-info">
            <div class="info-item">
                <div class="info-label">CIF</div>
                <div class="info-value">${company.cif || 'N/A'}</div>
            </div>
            ${company.registrationNumber ? `
            <div class="info-item">
                <div class="info-label">Nr. Înregistrare</div>
                <div class="info-value">${company.registrationNumber}</div>
            </div>
            ` : ''}
            ${company.legalForm ? `
            <div class="info-item">
                <div class="info-label">Formă Juridică</div>
                <div class="info-value">${company.legalForm}</div>
            </div>
            ` : ''}
            ${company.status ? `
            <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value ${company.status === 'activ' ? 'status-active' : 'status-inactive'}">${company.status}</div>
            </div>
            ` : ''}
            ${(company.city || company.county) ? `
            <div class="info-item">
                <div class="info-label">Locație</div>
                <div class="info-value">${company.city || ''}${company.city && company.county ? ', ' : ''}${company.county || ''}</div>
            </div>
            ` : ''}
            ${company.registrationDate ? `
            <div class="info-item">
                <div class="info-label">Data Înregistrare</div>
                <div class="info-value">${new Date(company.registrationDate).toLocaleDateString('ro-RO')}</div>
            </div>
            ` : ''}
        </div>
        ${company.address ? `
        <div style="margin-top: 10px; padding: 8px; background: #f8fafc; border-radius: 4px;">
            <div class="info-label">Adresă</div>
            <div class="info-value">${company.address}</div>
        </div>
        ` : ''}
    </div>
`;
    });

    htmlContent += `
</body>
</html>`;

    const htmlPath = 'lista-companii.html';
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`✅ Listă HTML salvată: ${htmlPath}\n`);

    // Afișează primele 5 în consolă
    console.log('📋 PRIMELE 5 COMPANII:');
    allCompanies.slice(0, 5).forEach((company, index) => {
      console.log(`\n${index + 1}. ${company.name}`);
      console.log(`   CIF: ${company.cif}`);
      console.log(`   ${company.city || ''}${company.city && company.county ? ', ' : ''}${company.county || ''}`);
    });

    console.log(`\n✅ Export complet!`);
    console.log(`\n📁 Fișiere generate:`);
    console.log(`   - ${textPath} (text)`);
    console.log(`   - ${csvPath} (CSV)`);
    console.log(`   - ${htmlPath} (HTML - deschide în browser)`);
  } catch (error) {
    console.error('❌ Eroare:', error);
    process.exit(1);
  }
}

exportCompaniesList().catch(console.error);

