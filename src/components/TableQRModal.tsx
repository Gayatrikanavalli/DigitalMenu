import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { RestaurantTable } from '../types';
import { QrCode, Printer, Download, Check, ExternalLink, X, Smartphone, Utensils } from 'lucide-react';

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
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>(activeTable);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const selectedTable = tables.find((t) => t.tableNumber === selectedTableNumber) || tables[0];

  // Single shared, configurable base URL for table QR links.
  // FRONTEND_PUBLIC_URL (env) takes precedence and defaults to the laptop LAN IP
  // so phones on the same Wi-Fi can open the scanned link. Never falls back to
  // window.location.origin, which bakes in localhost for whoever opens the page.
  const baseUrl =
    typeof process.env.FRONTEND_PUBLIC_URL === 'string' && process.env.FRONTEND_PUBLIC_URL
      ? process.env.FRONTEND_PUBLIC_URL
      : 'http://10.218.105.8:3000';
  const tableTargetUrl = `${baseUrl}/?table=${selectedTable?.tableNumber || 'T-01'}`;

  // Generate QR Code data URL whenever selected table changes
  useEffect(() => {
    if (!selectedTable) return;
    QRCode.toDataURL(tableTargetUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#78350F', // Warm amber-900
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR Gen error:', err));
  }, [selectedTableNumber, tableTargetUrl]);

  if (!isOpen || !selectedTable) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `BhojanQR-${selectedTable.tableNumber}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(tableTargetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchAndClose = () => {
    onSelectTable(selectedTable.tableNumber);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-md no-print"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2 text-stone-900 mb-6 no-print">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif">Table QR Code Manager & Scanner</h2>
            <p className="text-xs text-stone-700">
              Generated via Python <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700 font-mono">qrcode</code> library & live SVG renderer
            </p>
          </div>
        </div>

        {/* Table Selector Pills */}
        <div className="mb-6 no-print">
          <label className="block text-xs font-semibold text-stone-700 mb-2">
            Select Dining Table
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tables.map((table) => {
              const isSelected = table.tableNumber === selectedTableNumber;
              const isCurrent = table.tableNumber === activeTable;
              return (
                <button
                  key={table.id}
                  onClick={() => setSelectedTableNumber(table.tableNumber)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-sm font-mono">
                      {table.tableNumber}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-500 mt-1 truncate">
                    {table.displayName}
                  </div>
                  <div className="text-[11px] text-stone-700 mt-0.5">
                    {table.section} · {table.capacity} Seats
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Printable Table QR Standee Card */}
        <div
          ref={printRef}
          className="border-2 border-dashed border-amber-300 rounded-2xl p-6 bg-amber-50/40 text-center flex flex-col items-center justify-center"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-amber-600 text-white font-serif font-black text-xs flex items-center justify-center">
              भ
            </div>
            <span className="text-base font-extrabold font-serif text-stone-900 tracking-tight">
              Bhojan<span className="text-amber-600 font-sans">QR</span>
            </span>
          </div>

          <p className="text-xs text-stone-700 uppercase tracking-widest font-semibold mb-3">
            Digital Dine-In Table Standee
          </p>

          {/* QR Image Container */}
          <div className="p-3 bg-white rounded-xl shadow-sm border border-stone-200">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Table ${selectedTable.tableNumber} QR Code`}
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
              />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-stone-400">
                Generating QR...
              </div>
            )}
          </div>

          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-amber-900 tracking-wide block">
              Table {selectedTable.tableNumber}
            </span>
            <span className="text-xs text-stone-700">
              {selectedTable.displayName} · {selectedTable.section}
            </span>
          </div>

          <p className="mt-3 text-xs text-stone-700 max-w-xs leading-relaxed">
            Point your phone camera to scan this QR code to view today's live menu and send orders directly to our chefs.
          </p>

          <div className="mt-2 text-[11px] font-mono text-stone-600 break-all select-all">
            {tableTargetUrl}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-stone-600" />
              <span>Print Table Standee</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-stone-600" />
              <span>Download PNG</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className="px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <ExternalLink className="w-4 h-4" />}
              <span>{copied ? 'Copied URL!' : 'Copy Table Link'}</span>
            </button>

            <button
              onClick={handleSwitchAndClose}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>Simulate Scan & Order as Table {selectedTable.tableNumber}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
