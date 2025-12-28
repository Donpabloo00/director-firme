import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function UploadCSV() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.csv')) {
        handleUpload(file);
      } else {
        setError('Only CSV files are allowed');
      }
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  }, [handleUpload]);

  return (
    <>
      <Head>
        <title>Upload CSV - Lista Firme România</title>
        <meta name="description" content="Încarcă fișier CSV cu date firme pentru import în baza de date" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Upload CSV Firme
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Încarcă fișierul CSV cu datele firmelor din România pentru import în baza de date.
              Suportă fișiere până la 2GB cu milioane de înregistrări.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="space-y-4">
                <div className="text-6xl">📁</div>
                <div>
                  <p className="text-xl font-medium text-gray-900">
                    {uploading ? 'Se încarcă...' : 'Trage și lasă fișierul CSV aici'}
                  </p>
                  <p className="text-gray-500 mt-2">
                    sau <span className="text-blue-600 underline cursor-pointer">click pentru selectare</span>
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  Doar fișiere CSV • Max 2GB • Format ONRC
                </div>
              </div>

              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-lg font-medium">Se procesează...</span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">❌ {error}</p>
              </div>
            )}

            {uploadResult && (
              <div className="mt-6 p-6 bg-green-50 border-2 border-green-300 rounded-lg shadow-md">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">✅</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-3 text-lg">
                      Fișier încărcat cu succes!
                    </h3>
                    <div className="bg-white rounded-lg p-4 mb-4 text-sm shadow-sm border border-gray-200">
                      <p className="text-gray-800 mb-2">
                        <strong className="text-gray-900">Nume:</strong> <span className="text-gray-700">{uploadResult.file.name}</span>
                      </p>
                      <p className="text-gray-800 mb-2">
                        <strong className="text-gray-900">Dimensiune:</strong> <span className="text-gray-700">{(uploadResult.file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </p>
                      <p className="text-gray-800">
                        <strong className="text-gray-900">Status:</strong> <span className="text-green-700 font-semibold">Pregătit pentru import</span>
                      </p>
                    </div>
                    {uploadResult.nextSteps && (
                      <div className="space-y-2">
                        <a
                          href={uploadResult.nextSteps.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
                        >
                          👁️ Previzualizează datele CSV
                        </a>
                        <button
                          onClick={async () => {
                            setImporting(true);
                            try {
                              const response = await fetch(uploadResult.nextSteps.importUrl);
                              const result = await response.json();
                              if (result.success && result.progressUrl) {
                                router.push(result.progressUrl);
                              } else {
                                throw new Error(result.error || 'Failed to start import');
                              }
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Failed to start import');
                              setImporting(false);
                            }
                          }}
                          disabled={importing}
                          className="block w-full text-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {importing ? (
                            <>
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Se pornește importul...
                            </>
                          ) : (
                            '🚀 Începe importul în baza de date'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
