import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const containerId = "qr-reader-container";
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          onScan(decodedText);
          scanner.stop().catch(() => {});
        },
        () => {
          // ignore per-frame "no QR found" errors, this fires constantly while scanning
        }
      )
      .catch((err) => {
        console.error("Camera start failed:", err);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="w-full">
      <div id={containerId} className="w-full rounded-xl overflow-hidden" />
      <button
        onClick={onClose}
        className="w-full mt-3 py-2 rounded-full font-bold text-xs"
        style={{ backgroundColor: "var(--color-chalk-sky)", color: "#FFFFFF" }}
      >
        Close scanner
      </button>
    </div>
  );
}