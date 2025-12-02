// Daftar Kecamatan di Kabupaten Banyuwangi
export const KECAMATAN_BANYUWANGI = [
  'Banyuwangi',
  'Giri',
  'Kalipuro',
  'Glagah',
  'Licin',
  'Rogojampi',
  'Kabat',
  'Singojuruh',
  'Srono',
  'Genteng',
  'Glenmore',
  'Kalibaru',
  'Pesanggaran',
  'Bangorejo',
  'Purwoharjo',
  'Tegaldlimo',
  'Muncar',
  'Cluring',
  'Gambiran',
  'Tegalsari',
  'Siliragung',
  'Wongsorejo',
  'Songgon'
].sort()

// Status Order
export const ORDER_STATUS = {
  PENDING_DELIVERY: 'pending_delivery',
  SCHEDULED: 'scheduled',
  ON_DELIVERY: 'on_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
}

export const ORDER_STATUS_LABELS = {
  pending_delivery: 'Menunggu Pengiriman',
  scheduled: 'Terjadwal',
  on_delivery: 'Dalam Pengiriman',
  delivered: 'Terkirim',
  cancelled: 'Dibatalkan'
}

export const ORDER_STATUS_COLORS = {
  pending_delivery: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  on_delivery: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

// Metode Pembayaran
export const PAYMENT_METHODS = {
  CASH: 'cash',
  TRANSFER: 'transfer',
  TEMPO: 'tempo'
}

export const PAYMENT_METHOD_LABELS = {
  cash: 'Tunai',
  transfer: 'Transfer',
  tempo: 'Tempo'
}

// Status Pembayaran
export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid'
}

export const PAYMENT_STATUS_LABELS = {
  unpaid: 'Belum Dibayar',
  partial: 'Dibayar Sebagian',
  paid: 'Lunas'
}

export const PAYMENT_STATUS_COLORS = {
  unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
}

// Status Pengiriman
export const DELIVERY_STATUS = {
  SCHEDULED: 'scheduled',
  ON_DELIVERY: 'on_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
}

export const DELIVERY_STATUS_LABELS = {
  scheduled: 'Terjadwal',
  on_delivery: 'Dalam Pengiriman',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan'
}

export const DELIVERY_STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  on_delivery: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}
