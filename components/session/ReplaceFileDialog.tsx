'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Loader2, Upload } from 'lucide-react';

interface ReplaceFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  currentMetadata: {
    columns: Array<{ name: string; type: string }>;
  };
  onReplaceComplete: () => void;
}

interface ComparisonResult {
  isMatch: boolean;
  missingColumns: Array<{ name: string; type: string }>;
  viewCount: number;
  chartCount: number;
}

export function ReplaceFileDialog({
  isOpen,
  onClose,
  sessionId,
  currentMetadata,
  onReplaceComplete,
}: ReplaceFileDialogProps) {
  const [step, setStep] = useState<'select' | 'confirm' | 'uploading' | 'error'>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Upload file temporaneo e analizza colonne
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/session/replace-file/analyze', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setErrorMessage(result.error?.message || 'Errore durante l\'analisi del file');
        setStep('error');
        setIsProcessing(false);
        return;
      }

      // Confronta colonne
      const newColumns = result.metadata.sheets?.[0]?.columns || [];
      const currentColumns = currentMetadata.columns;

      // Check se tutte le colonne correnti esistono nel nuovo file (subset match)
      const missingColumns = currentColumns.filter(
        (oldCol) =>
          !newColumns.some(
            (newCol: any) => newCol.name === oldCol.name && newCol.type === oldCol.type
          )
      );

      const isMatch = missingColumns.length === 0;

      setComparison({
        isMatch,
        missingColumns,
        viewCount: result.viewCount,
        chartCount: result.chartCount,
      });

      setStep('confirm');
      setIsProcessing(false);
    } catch (error) {
      console.error('Error analyzing file:', error);
      setErrorMessage('Errore durante l\'analisi del file');
      setStep('error');
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleConfirmReplace = async () => {
    if (!selectedFile) return;

    setStep('uploading');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/session/replace-file', {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setErrorMessage(result.error?.message || 'Errore durante la sostituzione del file');
        setStep('error');
        return;
      }

      // Success! Reload page
      onReplaceComplete();
    } catch (error) {
      console.error('Error replacing file:', error);
      setErrorMessage('Errore durante la sostituzione del file');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedFile(null);
    setComparison(null);
    setErrorMessage('');
    setIsProcessing(false);
    onClose();
  };

  const handleTriggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {/* Step 1: Select File */}
        {step === 'select' && (
          <>
            <DialogHeader>
              <DialogTitle>Modifica File Input</DialogTitle>
              <DialogDescription>
                Seleziona un nuovo file per sostituire quello attuale.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <button
                onClick={handleTriggerFilePicker}
                disabled={isProcessing}
                className="w-full p-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                    <p className="text-sm text-slate-600">Analisi file in corso...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-10 w-10 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Click per selezionare un file
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        CSV, Excel (.xlsx, .xls)
                      </p>
                    </div>
                  </div>
                )}
              </button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annulla
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Confirm - Columns MATCH */}
        {step === 'confirm' && comparison && comparison.isMatch && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Sostituisci File Input
              </DialogTitle>
              <DialogDescription>
                Le colonne del nuovo file corrispondono a quelle del file corrente.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium mb-2">
                  ✅ Le tue Views e Charts saranno mantenuti
                </p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• {comparison.viewCount} Views salvate → Mantenute</li>
                  <li>• {comparison.chartCount} Charts → Mantenuti</li>
                  <li>• Filtri Explorer → Reset</li>
                </ul>
              </div>

              {selectedFile && (
                <div className="text-sm text-slate-600">
                  <p>
                    <strong>Nuovo file:</strong> {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              <p className="text-sm text-slate-600">
                Vuoi procedere con la sostituzione?
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annulla
              </Button>
              <Button onClick={handleConfirmReplace}>Sì, Sostituisci</Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Confirm - Columns NO MATCH */}
        {step === 'confirm' && comparison && !comparison.isMatch && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Sostituisci File Input
              </DialogTitle>
              <DialogDescription>
                ⚠️ ATTENZIONE: Le colonne del nuovo file NON corrispondono a quelle attuali.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800 font-medium mb-2">
                  Colonne mancanti nel nuovo file:
                </p>
                <ul className="text-sm text-orange-700 space-y-1">
                  {comparison.missingColumns.map((col) => (
                    <li key={col.name}>
                      • &quot;{col.name}&quot; ({col.type})
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  ❌ Verranno eliminate PERMANENTEMENTE:
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• {comparison.viewCount} Views salvate</li>
                  <li>• {comparison.chartCount} Charts</li>
                  <li>• Tutti i filtri</li>
                </ul>
              </div>

              {selectedFile && (
                <div className="text-sm text-slate-600">
                  <p>
                    <strong>Nuovo file:</strong> {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              <p className="text-sm font-medium text-red-700">
                Questa azione NON può essere annullata.
              </p>

              <p className="text-sm text-slate-600">Sei sicuro di voler continuare?</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annulla
              </Button>
              <Button variant="destructive" onClick={handleConfirmReplace}>
                Sì, Sostituisci
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Uploading */}
        {step === 'uploading' && (
          <>
            <DialogHeader>
              <DialogTitle>Sostituzione in corso...</DialogTitle>
              <DialogDescription>
                Il file viene sostituito, attendere prego.
              </DialogDescription>
            </DialogHeader>

            <div className="py-8 flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <p className="text-sm text-slate-600">Elaborazione file in corso...</p>
            </div>
          </>
        )}

        {/* Step 4: Error */}
        {step === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Errore
              </DialogTitle>
              <DialogDescription>
                Si è verificato un errore durante l&apos;operazione.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Chiudi
              </Button>
              <Button onClick={() => setStep('select')}>Riprova</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
