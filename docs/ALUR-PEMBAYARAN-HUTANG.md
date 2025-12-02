# 💰 Alur Pembayaran Hutang (Tempo)

## 📋 Ringkasan

Sistem sudah mendukung pembayaran **hutang/tempo** dengan tracking otomatis. Toko bisa bayar cicil dan hutang akan berkurang otomatis.

---

## 🔄 Alur Lengkap

### **STEP 1: Buat Order dengan Metode "Tempo"**

**Halaman:** `/orders/new`

**Proses:**
1. Admin pilih toko
2. Tambah produk
3. Pilih metode pembayaran: **"Tempo"**
4. **Wajib isi tanggal jatuh tempo**
5. Klik "Simpan Order"

**Yang Terjadi di Database:**

```javascript
// 1. Order dibuat
orders {
  payment_method: "tempo",
  payment_status: "unpaid",
  due_date: "2024-12-31",
  total_amount: 1000000
}

// 2. Hutang toko BERTAMBAH otomatis
stores {
  debt: debt_lama + 1000000
}
```

**Contoh:**
- Hutang toko sebelumnya: Rp 500.000
- Order baru: Rp 1.000.000
- **Hutang toko sekarang: Rp 1.500.000** ✅

---

### **STEP 2: Toko Bayar Hutang (Bisa Cicil)**

**Halaman:** `/orders/:id` (Detail Order)

**Proses:**
1. Admin buka detail order
2. Klik tombol **"Tambah Pembayaran"**
3. Masukkan jumlah pembayaran (bisa sebagian/cicil)
4. Pilih metode: Cash atau Transfer
5. Tambah catatan (opsional)
6. Klik "Simpan Pembayaran"

**Yang Terjadi di Database:**

```javascript
// 1. Pembayaran dicatat
payments {
  order_id: "xxx",
  amount: 500000,
  payment_method: "cash"
}

// 2. Status pembayaran order diupdate
orders {
  payment_status: "partial" // atau "paid" jika lunas
}

// 3. Hutang toko BERKURANG otomatis
stores {
  debt: debt_lama - 500000
}
```

**Contoh Cicilan:**

**Pembayaran 1:**
- Bayar: Rp 500.000
- Hutang toko: Rp 1.500.000 - Rp 500.000 = **Rp 1.000.000**
- Status order: **Dibayar Sebagian**

**Pembayaran 2:**
- Bayar: Rp 500.000
- Hutang toko: Rp 1.000.000 - Rp 500.000 = **Rp 500.000**
- Status order: **Lunas** ✅

---

## 📊 Status Pembayaran

### **Status Order:**

| Status | Arti | Hutang Toko |
|--------|------|-------------|
| **Belum Dibayar** | Belum ada pembayaran sama sekali | Bertambah saat order dibuat |
| **Dibayar Sebagian** | Sudah bayar tapi belum lunas | Berkurang sesuai pembayaran |
| **Lunas** | Sudah dibayar penuh | Berkurang sampai 0 untuk order ini |

---

## 💡 Fitur Penting

### **1. Tracking Hutang Real-time**

Hutang toko selalu update otomatis:
- ✅ Bertambah saat order tempo dibuat
- ✅ Berkurang saat toko bayar
- ✅ Bisa dilihat di halaman Detail Toko
- ✅ Bisa dilihat di halaman Buat Order (info toko)

### **2. Riwayat Pembayaran Lengkap**

Di halaman Detail Order, tampil:
- ✅ Total order
- ✅ Sudah dibayar berapa
- ✅ Sisa berapa
- ✅ Riwayat semua pembayaran (tanggal, jumlah, metode)

### **3. Pembayaran Cicil**

Toko bisa bayar bertahap:
- ✅ Bayar Rp 100.000 hari ini
- ✅ Bayar Rp 200.000 minggu depan
- ✅ Bayar Rp 300.000 bulan depan
- ✅ Sistem tracking otomatis

### **4. Tanggal Jatuh Tempo**

Sistem mencatat jatuh tempo:
- ✅ Tampil di detail order
- ✅ Tampil di daftar order (filter)
- ✅ Bisa buat laporan piutang jatuh tempo

---

## 🎯 Contoh Kasus Nyata

### **Kasus 1: Toko Baru Order Tempo**

**Situasi Awal:**
- Toko "Makmur Jaya"
- Hutang saat ini: Rp 0

**Order Baru:**
- 10 karung Urea @ Rp 180.000 = Rp 1.800.000
- Metode: **Tempo**
- Jatuh tempo: 30 hari

**Hasil:**
- ✅ Order dibuat dengan status "Belum Dibayar"
- ✅ Hutang toko: Rp 0 → **Rp 1.800.000**
- ✅ Jatuh tempo: 30 hari dari sekarang

---

### **Kasus 2: Toko Bayar Cicil**

**Situasi:**
- Order: Rp 1.800.000
- Hutang toko: Rp 1.800.000

**Pembayaran 1 (Minggu 1):**
- Bayar: Rp 600.000 (Cash)
- Hutang toko: Rp 1.800.000 - Rp 600.000 = **Rp 1.200.000**
- Status order: **Dibayar Sebagian**

**Pembayaran 2 (Minggu 2):**
- Bayar: Rp 600.000 (Transfer)
- Hutang toko: Rp 1.200.000 - Rp 600.000 = **Rp 600.000**
- Status order: **Dibayar Sebagian**

**Pembayaran 3 (Minggu 3):**
- Bayar: Rp 600.000 (Cash)
- Hutang toko: Rp 600.000 - Rp 600.000 = **Rp 0**
- Status order: **Lunas** ✅

---

### **Kasus 3: Toko Punya Beberapa Order Tempo**

**Situasi:**
- Order 1: Rp 1.000.000 (tempo, belum bayar)
- Order 2: Rp 1.500.000 (tempo, belum bayar)
- **Total hutang toko: Rp 2.500.000**

**Toko Bayar Order 1:**
- Bayar: Rp 1.000.000
- Hutang toko: Rp 2.500.000 - Rp 1.000.000 = **Rp 1.500.000**
- Order 1: **Lunas** ✅
- Order 2: Masih belum dibayar

**Toko Bayar Order 2 Cicil:**
- Bayar: Rp 500.000
- Hutang toko: Rp 1.500.000 - Rp 500.000 = **Rp 1.000.000**
- Order 2: **Dibayar Sebagian**

---

## 📱 Cara Menggunakan

### **Untuk Admin:**

#### **1. Buat Order Tempo:**
```
1. Buka: /orders/new
2. Pilih toko
3. Tambah produk
4. Metode pembayaran: Tempo
5. Isi tanggal jatuh tempo
6. Simpan
→ Hutang toko bertambah otomatis
```

#### **2. Input Pembayaran:**
```
1. Buka: /orders/:id (detail order)
2. Klik "Tambah Pembayaran"
3. Masukkan jumlah (bisa sebagian)
4. Pilih metode (Cash/Transfer)
5. Simpan
→ Hutang toko berkurang otomatis
```

#### **3. Cek Hutang Toko:**
```
1. Buka: /stores/:id (detail toko)
2. Lihat "Hutang Saat Ini"
3. Lihat riwayat pembayaran
```

---

## 🔍 Monitoring Hutang

### **Di Halaman Detail Toko:**
- Total hutang saat ini
- Daftar order yang belum lunas
- Riwayat pembayaran

### **Di Halaman Manajemen Order:**
- Filter berdasarkan status pembayaran
- Filter berdasarkan metode pembayaran
- Lihat order yang jatuh tempo

### **Di Halaman Keuangan:** (Future)
- Laporan piutang
- Piutang jatuh tempo
- Aging piutang (30, 60, 90 hari)

---

## ⚠️ Penting!

### **Hutang Otomatis:**
- ✅ Bertambah saat order tempo dibuat
- ✅ Berkurang saat toko bayar
- ❌ **TIDAK** bertambah untuk order Cash/Transfer

### **Pembayaran Cicil:**
- ✅ Bisa bayar berapa saja (tidak harus lunas)
- ✅ Bisa bayar berkali-kali
- ✅ Sistem tracking otomatis

### **Status Order:**
- Order tempo yang belum dibayar: **"Belum Dibayar"**
- Order tempo yang sudah bayar sebagian: **"Dibayar Sebagian"**
- Order tempo yang sudah lunas: **"Lunas"**

---

## 📊 Laporan Hutang (Future Enhancement)

Fitur yang bisa ditambahkan:
- 📈 Grafik hutang per toko
- 📅 Reminder jatuh tempo otomatis
- 📧 Email/WhatsApp reminder
- 📊 Aging report (hutang 30/60/90 hari)
- 💰 Proyeksi cash flow

---

## ✅ Checklist Penggunaan

### Saat Buat Order Tempo:
- [ ] Pilih metode "Tempo"
- [ ] Isi tanggal jatuh tempo
- [ ] Cek hutang toko bertambah

### Saat Toko Bayar:
- [ ] Buka detail order
- [ ] Klik "Tambah Pembayaran"
- [ ] Input jumlah pembayaran
- [ ] Cek hutang toko berkurang
- [ ] Cek status pembayaran update

---

**Sistem pembayaran hutang sudah berfungsi dengan baik!** 🎉

Toko bisa bayar cicil, hutang tracking otomatis, dan admin bisa monitor dengan mudah.
