import fs from 'fs';

// ULTRA RAPID - fără query DB, doar log parsing
function checkProgressFast() {
  const logPath = 'import_log.txt';
  
  if (!fs.existsSync(logPath)) {
    console.log('❌ Log file not found');
    process.exit(1);
  }

  // Citește doar ultimele 1000 linii (foarte rapid)
  const logContent = fs.readFileSync(logPath, 'utf8');
  const lines = logContent.split('\n').filter(l => l.includes('FIRME PROCESATE'));
  
  if (lines.length === 0) {
    console.log('❌ No progress data in log');
    process.exit(1);
  }

  const lastLine = lines[lines.length - 1];
  
  // Parse rapid
  const processedMatch = lastLine.match(/FIRME PROCESATE:\s*([\d.,]+)/);
  const rateMatch = lastLine.match(/⚡\s*([\d.,]+)\/min/);
  const percentMatch = lastLine.match(/(\d+\.\d+)%/);
  
  const processed = processedMatch ? parseInt(processedMatch[1].replace(/[.,]/g, ''), 10) : 0;
  const rate = rateMatch ? parseInt(rateMatch[1].replace(/[.,]/g, ''), 10) : 0;
  const percent = percentMatch ? parseFloat(percentMatch[1]) : 0;
  
  const estimatedTotal = percent > 0 && percent < 200 
    ? Math.round(processed / (percent / 100))
    : Math.max(processed, 2100000);
  
  const remaining = Math.max(0, estimatedTotal - processed);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 PROGRES IMPORT');
  console.log('='.repeat(60));
  console.log(`📋 Procesate: ${processed.toLocaleString()}`);
  console.log(`📁 Total estimat: ~${estimatedTotal.toLocaleString()}`);
  console.log(`⏳ Rămase: ${remaining.toLocaleString()}`);
  console.log(`📈 Progres: ${percent.toFixed(1)}%`);
  if (rate > 0) {
    console.log(`⚡ Viteză: ~${rate.toLocaleString()}/min`);
    if (remaining > 0) {
      const mins = Math.round(remaining / rate);
      console.log(`⏱️  Rămas: ~${Math.floor(mins/60)}h ${mins%60}m`);
    }
  }
  console.log('='.repeat(60) + '\n');
  
  process.exit(0);
}

checkProgressFast();

