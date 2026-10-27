import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, Copy, Check, Download, ExternalLink, Smartphone } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionCode: string;
  sessionTitle: string;
  onToast: (type: 'error' | 'success' | 'info', message: string, title?: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  sessionCode,
  sessionTitle,
  onToast,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?code=${sessionCode}`
      : `http://localhost:3000/?code=${sessionCode}`;

  useEffect(() => {
    if (!isOpen || !sessionCode) return;

    QRCode.toDataURL(joinUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#09090b', // zinc-950
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, sessionCode, joinUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const urlToCopy =
      typeof window !== 'undefined' && window.location.href
        ? window.location.href
        : joinUrl;

    // Use Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urlToCopy).catch((err) => {
        console.warn('Clipboard API writeText rejected, fallback used', err);
      });
    }

    // Synchronous textarea copy fallback to ensure immediate success across all browser contexts
    try {
      const textArea = document.createElement('textarea');
      textArea.value = urlToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('Fallback execCommand copy error', err);
    }

    setCopied(true);
    onToast('success', 'Session link copied to clipboard!', 'Link Copied');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `livepulse-qr-${sessionCode}.png`;
    a.click();
    onToast('success', `QR code downloaded: livepulse-qr-${sessionCode}.png`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
        className="w-full max-w-sm bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl p-6 relative text-zinc-100 text-center"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 id="qr-modal-title" className="text-sm font-bold text-white">
                Audience QR Code
              </h2>
              <p className="text-[11px] text-zinc-400">Scan to join on mobile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close QR dialog"
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="my-5 flex flex-col items-center">
          <div className="p-4 bg-white rounded-2xl shadow-xl shadow-black/40 border-4 border-indigo-500/30">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code to join session ${sessionCode}`}
                className="w-56 h-56 object-contain rounded-lg"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-zinc-400 text-xs">
                Generating QR code...
              </div>
            )}
          </div>

          {/* Session Code & Instructions */}
          <div className="mt-4 space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-sm font-bold text-indigo-300">
              <span className="text-zinc-500 text-xs font-normal">CODE:</span>
              <span className="text-white text-base tracking-widest">{sessionCode}</span>
            </div>
            <p className="text-xs text-zinc-300 font-medium truncate max-w-[280px] mx-auto mt-1">
              {sessionTitle}
            </p>
            <p className="text-[11px] text-zinc-400 flex items-center justify-center gap-1.5 pt-1">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Point phone camera at screen to enter</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-3 border-t border-zinc-800">
          {copied && (
            <div className="py-2 px-3 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 animate-fade-in shadow-lg shadow-emerald-950/50">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Session URL copied to clipboard!</span>
            </div>
          )}

          <button
            onClick={handleCopy}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              copied
                ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-300 shadow-lg shadow-emerald-950/40'
                : 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-200 hover:text-white hover:border-zinc-600'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">Session Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Copy Session Link</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
            <button
              onClick={onClose}
              className="py-2 px-3 bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
