# Director Firme

Platformă web pentru căutare și vizualizare informații despre companiile din România, similară cu termene.ro.

## Tehnologii

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: tRPC, Next.js API Routes
- **Database**: PostgreSQL (Supabase) cu Drizzle ORM
- **Autentificare**: Supabase Auth

## Funcționalități

- 🔍 Căutare companii după CIF sau nume
- 📊 Vizualizare detalii complete despre companii
- 💼 Informații financiare (cifră de afaceri, profit, angajați)
- 👥 Acționari și asociați
- ⚖️ Dosare judiciare
- 📈 Istoric modificări

## Instalare

1. Clonează repository-ul
2. Instalează dependențele:
```bash
npm install
```

3. Configurează variabilele de mediu:
```bash
cp .env.example .env
```

Editează `.env` și adaugă:
- `NEXT_PUBLIC_SUPABASE_URL` - URL-ul proiectului Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Cheia anonimă Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Cheia de serviciu Supabase (doar server-side)
- `DATABASE_URL` - Connection string pentru PostgreSQL

4. Rulează migrațiile:
```bash
npm run db:generate
npm run db:migrate
```

5. Pornește serverul de dezvoltare:
```bash
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000) în browser.

## Surse de date

Pentru a popula baza de date cu informații despre companii, trebuie să extragi date din următoarele surse oficiale:

### 1. ONRC (Oficiul Național al Registrului Comerțului)
- **URL**: https://www.onrc.ro
- **Date disponibile**: Informații despre înregistrarea companiilor, acționari, adrese, activități
- **Metodă**: Web scraping sau API (dacă disponibil)

### 2. ANAF (Agenția Națională de Administrare Fiscală)
- **URL**: https://static.anaf.ro/static/10/Anaf/Informatii_R/index.html
- **Date disponibile**: Date financiare, restanțe fiscale, status TVA
- **Metodă**: Web scraping sau API oficial

### 3. Portalul Instanțelor de Judecată
- **Date disponibile**: Dosare judiciare, proceduri
- **Metodă**: Web scraping

### 4. API-uri terțe disponibile
- **Termene.ro API**: Oferă acces la date prin API (necesită abonament)
- **ListaFirme.ro**: Baze de date actualizate (necesită licență)
- **Firmeo.ro**: Informații despre companii

## Proces de ingesting date

Pentru a extrage și actualiza datele despre companii, poți crea scripturi de scraping sau să folosești servicii existente:

1. **Scraping direct**: Folosește biblioteci precum Puppeteer sau Playwright pentru a extrage date din sursele oficiale
2. **API-uri terțe**: Integrează cu servicii existente care oferă API-uri
3. **Actualizare periodică**: Configurează job-uri cron pentru a actualiza datele zilnic/săptămânal

### Exemplu de script de ingesting

Creează un script în `src/scripts/ingest.ts` pentru a popula baza de date:

```typescript
import { db } from '@/server/db';
import { companies } from '@/server/db/schema';

async function ingestCompanyData() {
  // Aici adaugi logica de extragere date
  // Exemplu:
  const companyData = {
    cif: 'RO12345678',
    name: 'Exemplu SRL',
    // ... alte câmpuri
  };

  await db.insert(companies).values(companyData).onConflictDoUpdate({
    target: companies.cif,
    set: { /* câmpuri de actualizat */ }
  });
}
```

## Securitate

Proiectul respectă cele mai bune practici de securitate:
- ✅ Validare input cu Zod
- ✅ RLS (Row Level Security) în Supabase
- ✅ Autentificare și autorizare
- ✅ Protecție CSRF
- ✅ Sanitizare output

## Structură proiect

```
├── src/
│   ├── pages/              # Pagini Next.js
│   │   ├── api/trpc/       # Endpoint tRPC
│   │   ├── company/        # Pagini detaliu companie
│   │   └── index.tsx       # Pagina principală
│   ├── server/
│   │   ├── db/             # Schema și configurare DB
│   │   └── trpc/           # Routers și context tRPC
│   ├── lib/                # Utilitare și configurare Supabase
│   └── styles/             # Stiluri globale
├── drizzle/                # Migrații Drizzle
└── public/                 # Fișiere statice
```

## Dezvoltare

- `npm run dev` - Pornește serverul de dezvoltare
- `npm run build` - Construiește pentru producție
- `npm run start` - Pornește serverul de producție
- `npm run db:generate` - Generează migrații Drizzle
- `npm run db:migrate` - Rulează migrații
- `npm run db:studio` - Deschide Drizzle Studio

## Licență

MIT

