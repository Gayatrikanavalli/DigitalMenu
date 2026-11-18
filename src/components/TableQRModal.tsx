import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import { RestaurantTable } from '../types';
import { QrCode, Printer, Download, Check, ExternalLink, X, Smartphone } from 'lucide-react';

interface TableQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: RestaurantTable[];
  activeTable: string;
  onSelectTable: (tableNum: string) => void;
}

export const TableQRModal: React.FC<TableQRModalProps> = ({
  isOpen,
  onClose,
  tables,
  activeTable,
  onSelectTable,
}) => {
  const displayTables = useMemo(() => {
    return [...tables].sort((a, b) => String(a.tableNumber).localeCompare(String(b.tableNumber), undefined, { numeric: true, sensitivity: 'base' }));
  }, [tables]);

  const [selectedTableNumber, setSelectedTableNumber] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const current = activeTable && displayTables.some((t) => t.tableNumber === activeTable) ? activeTable : displayTables[0]?.tableNumber || '';
    setSelectedTableNumber((prev) => (prev && displayTables.some((t) => t.tableNumber === prev) ? prev : current));
  }, [isOpen, activeTable, displayTables]);

  const selectedTable = displayTables.find((t) => t.tableNumber === selectedTableNumber) || displayTables[0] || null;

  // Preserve existing QR URL/mapping: each table maps to /?table=<tableNumber>
  const baseUrl =
    (typeof process !== 'undefined' && process.env?.FRONTEND_PUBLIC_URL) ||
    (import.meta as any).env?.VITE_FRONTEND_PUBLIC_URL ||
    window.location.origin;
  const tableTargetUrl = selectedTable ? `${String(baseUrl).replace(/\/$/, '')}/?table=${encodeURIComponent(selectedTable.tableNumber)}` : '';

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedTable || !tableTargetUrl) { setQrDataUrl(''); return; }
    let cancelled = false;
    QRCode.toDataURL(tableTargetUrl, {
      width: 360,
      margin: 2,
      color: { dark: '#78350F', light: '#FFFFFF' },
    })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch((err) => console.error('QR Gen error:', err));
    return () => { cancelled = true; };
  }, [selectedTable?.tableNumber, tableTargetUrl]);

  if (!isOpen || !selectedTable) return null;

  const handlePrint = () => {
    if (!qrDataUrl || !selectedTable) return;
    const w = window.open('', '_blank', 'width=480,height=640');
    if (!w) { window.print(); return; }
    const title = `BhojanQR-${selectedTable.tableNumber}`;
    w.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh}.card{text-align:center;padding:24px;border:1px solid #f1e4d3;border-radius:16px}img{width:320px;height:320px}h1{margin:8px 0 4px;font-size:28px}p{margin:0;color:#444;font-size:14px}</style></head><body><div class="card"><div style="font-weight:800;color:#92400e">BhojanQR</div><h1>${selectedTable.tableNumber}</h1><img src="${qrDataUrl}" alt="${selectedTable.tableNumber} QR"/><p>Scan to open menu for ${selectedTable.tableNumber}</p><p style="margin-top:6px;font-size:11px;color:#777;word-break:break-all">${tableTargetUrl}</p></div></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 250);
  };

  const handleDownload = () => {
    if (!qrDataUrl || !selectedTable) return;
    const link = document.createElement('a');
    link.download = `BhojanQR-${selectedTable.tableNumber}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyUrl = async () => {
    if (!tableTargetUrl) return;
    try {
      await navigator.clipboard.writeText(tableTargetUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = tableTargetUrl; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchAndClose = () => {
    onSelectTable(selectedTable.tableNumber);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md sm:max-w-lg my-2 rounded-2xl border border-amber-200/70 bg-[#FFFBF5] shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#FFFBF5] border-b border-amber-200/70">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold font-serif text-stone-900 leading-tight">Table QR Management</h2>
              <p className="text-[11px] text-stone-600 truncate">Select a table to view its QR code</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-600 text-white hover:bg-amber-700 border-2 border-white shadow transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-3 sm:p-4">
          {/* 2x2 table grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {displayTables.map((table) => {
              const isSelected = table.tableNumber === selectedTableNumber;
              const isCurrent = table.tableNumber === activeTable;
              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => setSelectedTableNumber(table.tableNumber)}
                  className={`relative text-left px-3 py-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-white shadow-sm ring-1 ring-amber-200'
                      : 'border-amber-200/70 bg-[#FFF7ED] hover:bg-white hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm sm:text-base font-bold font-mono text-stone-900">{table.tableNumber}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-white bg-amber-600 px-1.5 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-stone-600 truncate">{table.displayName || `Table ${table.tableNumber}`}</p>
                </button>
              );
            })}
          </div>

          {/* Compact QR preview */}
          <div
            ref={printRef}
            className="mt-3 sm:mt-4 rounded-xl border border-amber-200 bg-gradient-to-b from-[#FFFDF8] to-[#FFF4E6] p-3 sm:p-4"
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
              <div className="bg-white p-2 rounded-xl border border-amber-100 shadow-sm shrink-0">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Table ${selectedTable.tableNumber} QR Code`}
                    className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center text-stone-400 text-xs">Generating...</div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded bg-amber-600 text-white font-serif font-black text-[10px] flex items-center justify-center">भ</div>
                  <span className="text-sm font-extrabold font-serif text-stone-900 tracking-tight">
                    Bhojan<span className="text-amber-600 font-sans">QR</span>
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-black font-mono text-stone-900 leading-tight">{selectedTable.tableNumber}</p>
                <p className="mt-1 text-[11px] sm:text-xs text-stone-600 leading-snug">
                  Scan with your phone camera to open the menu for <span className="font-semibold text-stone-900">{selectedTable.tableNumber}</span> and place your order.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download QR
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-amber-50 text-stone-800 border border-amber-300 text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print QR
            </button>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
            <button
              type="button"
              onClick={handleSwitchAndClose}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors sm:ml-auto"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Open as {selectedTable.tableNumber}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
