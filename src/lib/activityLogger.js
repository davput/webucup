import { supabase } from './supabase'

/**
 * Log user activity to activity_logs table
 * @param {Object} params - Activity parameters
 * @param {string} params.action - Action type: create, update, delete, view, export
 * @param {string} params.entityType - Entity type: order, product, store, delivery, payment, etc
 * @param {string} params.entityId - Entity ID (optional)
 * @param {string} params.entityName - Entity name for display
 * @param {string} params.description - Human readable description
 * @param {Object} params.metadata - Additional data (optional)
 */
export async function logActivity({
  action,
  entityType,
  entityId = null,
  entityName,
  description,
  metadata = null
}) {
  try {
    // Get user info (you can enhance this with actual auth)
    const userName = 'Admin' // TODO: Get from auth context

    const logData = {
      user_name: userName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date().toISOString() // Explicitly set created_at
    }

    const { error } = await supabase
      .from('activity_logs')
      .insert(logData)

    if (error) {
      console.error('Failed to log activity:', error)
    }
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

// Helper functions for common actions
export const ActivityLogger = {
  // Product actions
  createProduct: (productName) => 
    logActivity({
      action: 'create',
      entityType: 'product',
      entityName: productName,
      description: `Menambahkan produk baru "${productName}"`
    }),

  updateProduct: (productName, changes) => 
    logActivity({
      action: 'update',
      entityType: 'product',
      entityName: productName,
      description: `Mengubah data produk "${productName}"`,
      metadata: changes
    }),

  deleteProduct: (productName) => 
    logActivity({
      action: 'delete',
      entityType: 'product',
      entityName: productName,
      description: `Menghapus produk "${productName}"`
    }),

  // Order actions
  createOrder: (orderNumber, storeName) => 
    logActivity({
      action: 'create',
      entityType: 'order',
      entityName: orderNumber,
      description: `Membuat order baru ${orderNumber} untuk ${storeName}`
    }),

  updateOrder: (orderNumber, status) => 
    logActivity({
      action: 'update',
      entityType: 'order',
      entityName: orderNumber,
      description: `Mengubah status order ${orderNumber} menjadi "${status}"`
    }),

  // Store actions
  createStore: (storeName) => 
    logActivity({
      action: 'create',
      entityType: 'store',
      entityName: storeName,
      description: `Menambahkan toko baru "${storeName}"`
    }),

  updateStore: (storeName) => 
    logActivity({
      action: 'update',
      entityType: 'store',
      entityName: storeName,
      description: `Mengubah data toko "${storeName}"`
    }),

  deleteStore: (storeName) => 
    logActivity({
      action: 'delete',
      entityType: 'store',
      entityName: storeName,
      description: `Menghapus toko "${storeName}"`
    }),

  // Delivery actions
  createDelivery: (deliveryNumber, orderCount) => 
    logActivity({
      action: 'create',
      entityType: 'delivery',
      entityName: deliveryNumber,
      description: `Membuat jadwal pengiriman ${deliveryNumber} untuk ${orderCount} order`
    }),

  // Payment actions
  createPayment: (paymentNumber, amount) => 
    logActivity({
      action: 'create',
      entityType: 'payment',
      entityName: paymentNumber,
      description: `Mencatat pembayaran ${paymentNumber} sebesar Rp ${amount.toLocaleString('id-ID')}`
    }),

  // Stock actions
  stockIn: (productName, quantity) => 
    logActivity({
      action: 'update',
      entityType: 'product',
      entityName: productName,
      description: `Stok masuk: ${productName} +${quantity}`
    }),

  stockAdjustment: (productName, quantity, reason) => 
    logActivity({
      action: 'update',
      entityType: 'product',
      entityName: productName,
      description: `Penyesuaian stok: ${productName} ${quantity > 0 ? '+' : ''}${quantity} (${reason})`
    }),

  // Master Data actions
  createMasterData: (type, name) => 
    logActivity({
      action: 'create',
      entityType: type,
      entityName: name,
      description: `Menambahkan ${type === 'product_types' ? 'jenis produk' : type === 'units' ? 'satuan' : 'wilayah'} "${name}"`
    }),

  updateMasterData: (type, name) => 
    logActivity({
      action: 'update',
      entityType: type,
      entityName: name,
      description: `Mengubah ${type === 'product_types' ? 'jenis produk' : type === 'units' ? 'satuan' : 'wilayah'} "${name}"`
    }),

  deleteMasterData: (type, name) => 
    logActivity({
      action: 'delete',
      entityType: type,
      entityName: name,
      description: `Menghapus ${type === 'product_types' ? 'jenis produk' : type === 'units' ? 'satuan' : 'wilayah'} "${name}"`
    })
}
