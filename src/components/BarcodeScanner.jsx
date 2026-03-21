import { useState } from "react"
import QrBarcodeScanner from "react-qr-barcode-scanner"

/**
 * InventoryScanner
 * Wraps react-qr-barcode-scanner with:
 * - Renamed library import to avoid collision with this component's name
 * - NotFoundException filtered out (fires on every empty video frame)
 * - Camera permission error surfaced to the user
 * - Loading state while camera initialises
 * - onScan only fires once per unique result to prevent duplicate triggers
 */
export default function InventoryScanner({ onScan }) {

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastResult, setLastResult] = useState(null)

  const handleUpdate = (err, result) => {

    /**
     * NotFoundException fires on every frame that doesn't contain a barcode.
     * This is normal ZXing behaviour — suppress it entirely.
     * Any other error (camera permission denied, device not found) is real
     * and should be surfaced to the user.
     */
    if (err) {
      if (err?.name !== "NotFoundException") {
        console.error("Scanner error:", err)
        setError("Camera error: " + (err.message || err.name))
      }
      return
    }

    if (result?.text) {

      /**
       * Deduplicate — the scanner fires continuously on the same barcode
       * while it stays in frame. Only call onScan when the value changes.
       */
      if (result.text !== lastResult) {
        setLastResult(result.text)
        onScan(result.text)
      }
    }
  }

  return (
    <div className="bg-white shadow rounded p-6">

      <h3 className="font-semibold mb-4">
        Scan Item Barcode
      </h3>

      {error ? (
        <div className="bg-red-100 text-red-700 text-sm p-3 rounded">
          {error}
        </div>
      ) : (
        <div className="relative">

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center
                            bg-gray-100 rounded text-sm text-gray-400 z-10">
              Starting camera...
            </div>
          )}

          <QrBarcodeScanner
            width={500}
            height={300}
            onUpdate={handleUpdate}
            onLoad={() => setLoading(false)}
          />

        </div>
      )}

    </div>
  )
}