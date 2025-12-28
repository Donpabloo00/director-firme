import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface ImportProgress {
  status: 'running' | 'completed' | 'error';
  totalRows: number;
  processedRows: number;
  inserted: number;
  updated: number;
  errors: number;
  percentage: number;
  currentBatch?: number;
  totalBatches?: number;
  error?: string;
  startTime: string;
  lastUpdate: string;
}

export default function ImportProgressPage() {
  const router = useRouter();
  const { importId } = router.query;
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!importId || typeof importId !== 'string') return;

    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/import-progress?importId=${importId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch progress');
        }

        setProgress(result.progress);
        setLoading(false);

        // Dacă importul este complet sau cu eroare, oprește polling-ul
        if (result.progress.status === 'completed' || result.progress.status === 'error') {
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch progress');
        setLoading(false);
      }
    };

    // Fetch inițial
    fetchProgress();

    // Polling la fiecare 2 secunde dacă importul rulează
    const interval = setInterval(() => {
      if (progress?.status === 'running') {
        fetchProgress();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [importId, progress?.status]);

  if (loading) {
    return (
      <>
        <Head>
          <title>Import în curs - Lista Firme România</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Se încarcă progresul...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !progress) {
    return (
      <>
        <Head>
          <title>Eroare Import - Lista Firme România</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-red-900 mb-2">Eroare</h1>
              <p className="text-red-800">{error || 'Progresul importului nu a fost găsit'}</p>
              <button
                onClick={() => router.push('/upload-csv')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Înapoi la Upload
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'completed':
        return '✅ Import Complet';
      case 'error':
        return '❌ Import Eșuat';
      default:
        return '🔄 Import în curs...';
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('ro-RO');
  };

  const getElapsedTime = () => {
    const start = new Date(progress.startTime);
    const now = new Date(progress.lastUpdate);
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <>
      <Head>
        <title>Import în curs - Lista Firme România</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {getStatusText()}
            </h1>
            <p className="text-gray-600">Import ID: {importId}</p>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progres: {progress.percentage}%
                </span>
                <span className="text-sm text-gray-500">
                  {progress.processedRows.toLocaleString()} / {progress.totalRows.toLocaleString()} rânduri
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full ${getStatusColor()} transition-all duration-500 ease-out`}
                  style={{ width: `${progress.percentage}%` }}
                >
                  <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  {progress.inserted.toLocaleString()}
                </div>
                <div className="text-sm text-green-600 mt-1">Inserate</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">
                  {progress.updated.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600 mt-1">Actualizate</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                <div className="text-2xl font-bold text-red-700">
                  {progress.errors.toLocaleString()}
                </div>
                <div className="text-sm text-red-600 mt-1">Erori</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">
                  {progress.currentBatch || 0} / {progress.totalBatches || 0}
                </div>
                <div className="text-sm text-purple-600 mt-1">Batch-uri</div>
              </div>
            </div>

            {/* Time Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Început:</span> {formatTime(progress.startTime)}
                </div>
                <div>
                  <span className="font-medium">Ultima actualizare:</span> {formatTime(progress.lastUpdate)}
                </div>
                <div>
                  <span className="font-medium">Timp scurs:</span> {getElapsedTime()}
                </div>
                {progress.status === 'running' && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <span>Import activ</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {progress.status === 'error' && progress.error && (
              <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-red-800 font-medium">Eroare:</p>
                <p className="text-red-700 mt-1">{progress.error}</p>
              </div>
            )}

            {/* Success Message */}
            {progress.status === 'completed' && (
              <div className="mt-6 p-6 bg-green-50 border-2 border-green-300 rounded-lg text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-xl font-bold text-green-900 mb-2">
                  Import finalizat cu succes!
                </h3>
                <p className="text-green-800 mb-4">
                  {progress.inserted + progress.updated} firme au fost procesate.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/')}
                    className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Mergi la Homepage
                  </button>
                  <button
                    onClick={() => router.push('/upload-csv')}
                    className="block w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Importă alt fișier
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          {progress.status === 'running' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                💡 <strong>Notă:</strong> Pagina se actualizează automat la fiecare 2 secunde. 
                Poți închide această pagină - importul va continua în background.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

