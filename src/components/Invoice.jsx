import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function Invoice({ order, onClose }) {
  if (!order) return null

  const totalPaid = order.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
  const remaining = parseFloat(order.total_amount) - totalPaid

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none">
        {/* Header Actions - Hidden when printing */}
        <div className="flex justify-end gap-2 p-4 border-b print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🖨️ Cetak Invoice
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Tutup
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-8 print:p-12">
          {/* Company Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
              <div className="text-gray-600">
                <p className="font-semibold text-lg">CV. Distribusi Pupuk</p>
                <p className="text-sm">Jl. Raya Distribusi No. 123</p>
                <p className="text-sm">Banyuwangi, Jawa Timur</p>
                <p className="text-sm">Telp: (0333) 123-4567</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg inline-block mb-3">
                <p className="text-sm font-medium">No. Invoice</p>
                <p className="text-xl font-bold">{order.order_number}</p>
              </div>
              <p className="text-sm text-gray-600">
                Tanggal: {format(new Date(order.order_date), 'dd MMMM yyyy', { locale: id })}
              </p>
              {order.due_date && (
                <p className="text-sm text-red-600 font-semibold mt-1">
                  Jatuh Tempo: {format(new Date(order.due_date), 'dd MMMM yyyy', { locale: id })}
                </p>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Kepada:</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-bold text-lg text-gray-900">{order.stores.name}</p>
              <p className="text-gray-700">{order.stores.owner}</p>
              <p className="text-gray-600 text-sm mt-1">{order.stores.address}</p>
              <p className="text-gray-600 text-sm">{order.stores.region}</p>
              <p className="text-gray-600 text-sm">Telp: {order.stores.phone}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="text-left py-3 px-4 font-semibold text-sm">No</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Nama Produk</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm">Jumlah</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Harga Satuan</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-3 px-4 text-gray-700">{index + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{item.products.name}</p>
                      <p className="text-sm text-gray-500">{item.products.unit}</p>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>PPN (0%):</span>
                  <span className="font-semibold">Rp 0</span>
                </div>
                <div className="border-t-2 border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
                
                {totalPaid > 0 && (
                  <>
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <div className="flex justify-between text-green-600">
                        <span>Terbayar:</span>
                        <span className="font-semibold">{formatCurrency(totalPaid)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>Sisa:</span>
                      <span>{formatCurrency(remaining)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Method */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Metode Pembayaran:</p>
                <p className="font-semibold text-gray-900">
                  {order.payment_method === 'cash' && '💵 Tunai'}
                  {order.payment_method === 'transfer' && '🏦 Transfer Bank'}
                  {order.payment_method === 'tempo' && '📅 Tempo'}
                </p>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {order.payments && order.payments.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Riwayat Pembayaran:</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {order.payments.map((payment, index) => (
                  <div key={payment.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                    <div>
                      <p className="text-sm text-gray-600">
                        {format(new Date(payment.payment_date), 'dd MMM yyyy HH:mm', { locale: id })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.payment_method === 'cash' ? 'Tunai' : 'Transfer'}
                      </p>
                    </div>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Catatan:</h3>
              <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                {order.notes}
              </p>
            </div>
          )}

          {/* Terms & Conditions */}
          <div className="border-t-2 border-gray-300 pt-6 mt-8">
            <h3 className="font-semibold text-gray-900 mb-3">Syarat & Ketentuan:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Pembayaran dapat dilakukan melalui transfer bank atau tunai</li>
              <li>• Barang yang sudah dibeli tidak dapat dikembalikan</li>
              <li>• Untuk pembayaran tempo, harap lunasi sebelum tanggal jatuh tempo</li>
              <li>• Hubungi kami jika ada pertanyaan mengenai invoice ini</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-300">
            <div className="flex justify-between items-end">
              <div className="text-sm text-gray-600">
                <p>Terima kasih atas kepercayaan Anda!</p>
                <p className="mt-1">Invoice ini dicetak secara otomatis dan sah tanpa tanda tangan</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-8">Hormat kami,</p>
                <div className="border-t border-gray-400 pt-2 w-40">
                  <p className="font-semibold text-gray-900">Admin</p>
                  <p className="text-sm text-gray-600">CV. Distribusi Pupuk</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block {
            display: block !important;
          }
          .fixed {
            position: relative !important;
            background: white !important;
          }
          .bg-black {
            background: white !important;
          }
          .max-w-4xl {
            max-width: 100% !important;
          }
          .rounded-lg {
            border-radius: 0 !important;
          }
          .shadow-2xl {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}
