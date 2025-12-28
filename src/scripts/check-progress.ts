import { db } from '@/server/db/index';
import { companies } from '@/server/db/schema';
import { sql } from 'drizzle-orm';
import fs from 'fs';

async function checkProgress() {
  if (!db) {
    console.error('❌ Database connection not available');
    process.exit(1);
  }

  try {
    // Număr firme în DB
    const result = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(companies);
    
    const totalInDB = Number(result[0]?.count || 0);
    
    // Verifică log-ul pentru progres
    const logPath = 'import_log.txt';
    let processedFromLog = 0;
    let rateFromLog = 0;
    let percentFromLog = 0;
    let estimatedTotal = 2100000;
    
    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, 'utf8');
      const lines = logContent.split('\n').filter(l => l.includes('FIRME PROCESATE'));
      
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        
        // Extrage: "📊 FIRME PROCESATE: 2.650.000 | ⚡ 26.596/min | 126.2%"
        const processedMatch = lastLine.match(/FIRME PROCESATE:\s*([\d.,]+)/);
        if (processedMatch) {
          processedFromLog = parseInt(processedMatch[1].replace(/[.,]/g, ''), 10);
        }
        
        const rateMatch = lastLine.match(/⚡\s*([\d.,]+)\/min/);
        if (rateMatch) {
          rateFromLog = parseInt(rateMatch[1].replace(/[.,]/g, ''), 10);
        }
        
        const percentMatch = lastLine.match(/(\d+\.\d+)%/);
        if (percentMatch) {
          percentFromLog = parseFloat(percentMatch[1]);
          // Calculează totalul real bazat pe procent (dacă procentul este valid)
          if (percentFromLog > 50 && percentFromLog < 200) {
            estimatedTotal = Math.round(processedFromLog / (percentFromLog / 100));
          }
        }
      }
    }
    
    // Folosim cel mai mare număr între DB și log pentru progres
    const currentProgress = Math.max(totalInDB, processedFromLog);
    
    // Dacă procentul din log este > 100%, înseamnă că CSV-ul are mai multe rânduri
    // Folosim numărul procesat ca referință pentru totalul real
    if (percentFromLog > 100) {
      estimatedTotal = Math.max(estimatedTotal, processedFromLog);
    }
    
    const remaining = Math.max(0, estimatedTotal - currentProgress);
    const percentage = estimatedTotal > 0 ? ((currentProgress / estimatedTotal) * 100).toFixed(1) : '0.0';
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 PROGRES IMPORT FIRME - STATUS LIVE');
    console.log('='.repeat(70));
    console.log(`✅ Firme în baza de date: ${totalInDB.toLocaleString()}`);
    if (processedFromLog > 0) {
      console.log(`📋 Procesate (din log): ${processedFromLog.toLocaleString()}`);
    }
    console.log(`📁 Total estimat în CSV: ~${estimatedTotal.toLocaleString()}`);
    console.log(`⏳ Firme rămase: ${remaining.toLocaleString()}`);
    console.log(`📈 Progres: ${percentage}%`);
    
    if (rateFromLog > 0) {
      console.log(`⚡ Viteză: ~${rateFromLog.toLocaleString()} firme/minut`);
    }
    
    if (remaining > 0 && rateFromLog > 0) {
      const estimatedMinutes = Math.round(remaining / rateFromLog);
      const estimatedHours = Math.floor(estimatedMinutes / 60);
      const remainingMins = estimatedMinutes % 60;
      console.log(`\n⏱️  Timp estimat rămas: ~${estimatedHours}h ${remainingMins}m`);
    } else if (remaining <= 0 || percentFromLog > 100) {
      console.log(`\n🎉 Import aproape complet!`);
      if (percentFromLog > 100) {
        console.log(`   (Procesat ${percentFromLog.toFixed(1)}% - CSV-ul are mai multe rânduri)`);
      }
    }
    
    console.log('='.repeat(70) + '\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Eroare:', error.message);
    process.exit(1);
  }
}

checkProgress();
