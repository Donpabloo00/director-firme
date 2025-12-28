# Security Policy - CSV Import

## Validări de Securitate Implementate

### 1. Validare Tip Fișier
- ✅ Doar extensia `.csv` este permisă
- ✅ Verificare că path-ul este un fișier valid (nu symlink, nu directory)

### 2. Validare Dimensiune
- ✅ Maximum 500MB per fișier
- ✅ Maximum 1,000,000 linii (prevenire DoS)
- ✅ Maximum 10,000 caractere per linie

### 3. Validare Structură
- ✅ Header-uri obligatorii: DENUMIRE, CUI, COD_INMATRICULARE, DATA_INMATRICULARE, FORMA_JURIDICA
- ✅ Verificare pattern-uri suspecte în header-uri (script tags, javascript:, etc.)
- ✅ Verificare număr coloane (trebuie să se potrivească cu header-urile)

### 4. Sanitizare Input
- ✅ Eliminare caractere control (0x00-0x1F, 0x7F)
- ✅ Eliminare script tags (`<script>`, `javascript:`, etc.)
- ✅ Limitare lungime câmpuri (max 1000 chars per câmp, max 500 chars pentru DENUMIRE)
- ✅ Trim whitespace

### 5. Validare Conținut
- ✅ DENUMIRE nu poate fi gol
- ✅ CUI trebuie să existe (poate fi "0" pentru PF)
- ✅ Verificare pattern-uri malicioase în denumire

### 6. Rate Limiting
- ✅ Pauză 1 secundă la fiecare 50 batch-uri (pentru a nu suprasolicita DB)
- ✅ Batch size: 100 linii (pentru performanță și control)

### 7. Error Handling
- ✅ Logging detaliat pentru erori
- ✅ Continuă procesarea chiar dacă unele linii eșuează
- ✅ Raport final cu statistici (inserted, updated, errors)

### 8. Audit Logging
- ✅ Fiecare companie importată are source provenance tracking
- ✅ Hash payload pentru deduplicare și audit

## Limitări

- **Max file size**: 500MB
- **Max lines**: 1,000,000
- **Max line length**: 10,000 chars
- **Max field length**: 1,000 chars (500 pentru DENUMIRE)
- **Batch size**: 100 linii
- **Rate limit**: 1s pauză la fiecare 50 batch-uri

## Recomandări

Pentru fișiere foarte mari (>100MB):
1. Split fișierul în mai multe fișiere mai mici
2. Rulează import-ul pe fiecare separat
3. Monitorizează progresul și erorile

Pentru producție:
1. Rulează import-ul doar din server-uri de trust
2. Nu permite upload direct de la utilizatori
3. Verifică hash/signature fișierului înainte de import
4. Folosește autentificare pentru script (API key sau JWT)

