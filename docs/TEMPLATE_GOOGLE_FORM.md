# 🎯 Template Google Form - Siap Pakai

## ✅ Form Sudah Jadi! Bisa Digunakan Langsung

File `gform.html` yang saya buat **sudah bisa dipakai langsung** tanpa perlu setup Google Form!

### Cara Pakai:
1. Warga buka `gform.html`
2. Isi form → Klik "Kirim Laporan"
3. **Data otomatis tersimpan** ke `localStorage` dengan key: `pkm_dbd_reports`
4. **Langsung muncul** di Dashboard Analytics (`index.html`)

---

## 📋 (OPSIONAL) Setup Google Form Asli

Jika Anda ingin mengintegrasikan dengan Google Form asli, ikuti langkah berikut:

### Langkah 1: Buat Google Form Baru

1. Buka https://forms.google.com/
2. Klik "+ Blank" untuk form baru
3. Judul form: **"Laporan Temuan DBD - PKM Bersih Itu Patriotik"**
4. Deskripsi: **"Form pelaporan jentik nyamuk atau kasus DBD"**

### Langkah 2: Tambahkan Pertanyaan

Buat 6 pertanyaan dengan format berikut:

#### 1️⃣ Nama Lengkap (Short answer)
- **Pertanyaan:** Nama Lengkap
- **Type:** Short answer
- **Required:** TIDAK (opsional)

#### 2️⃣ Email (Short answer)
- **Pertanyaan:** Email
- **Type:** Short answer
- **Validation:** Email address
- **Required:** TIDAK (opsional)

#### 3️⃣ Alamat Lengkap / RT & RW (Short answer)
- **Pertanyaan:** Alamat Lengkap / RT & RW
- **Type:** Short answer
- **Required:** YA ✓

#### 4️⃣ Kategori Laporan (Dropdown)
- **Pertanyaan:** Kategori Laporan
- **Type:** Dropdown
- **Options:**
  - 🦟 Temuan Jentik Nyamuk
  - 🏥 Kasus atau Gejala DBD
  - 🌳 Lingkungan Berisiko
  - 📋 Lainnya
- **Required:** YA ✓

#### 5️⃣ Tingkat Prioritas (Multiple choice)
- **Pertanyaan:** Tingkat Prioritas
- **Type:** Multiple choice
- **Options:**
  - 🟢 Rendah - Pemantauan rutin
  - 🟡 Sedang - Perlu perhatian
  - 🔴 Tinggi - Urgent, perlu tindakan segera
- **Required:** YA ✓

#### 6️⃣ Detail Laporan (Paragraph)
- **Pertanyaan:** Detail Laporan / Keterangan
- **Type:** Paragraph
- **Description:** "Berikan detail selengkap mungkin untuk memudahkan tim melakukan verifikasi"
- **Required:** YA ✓

---

### Langkah 3: Menghubungkan Form ke HTML (ADVANCED)

**UNTUK ADMIN YANG INGIN INTEGR ASI PENUH:**

#### A. Dapatkan Form URL dan Entry IDs

1. Klik "Send" → Copy link form
2. Buka form tersebut di browser
3. Klik kanan → View Page Source
4. Cari `entry.` untuk mendapatkan entry IDs, contoh:
   - `entry.123456789` (untuk Nama)
   - `entry.987654321` (untuk Email)
   - dst...

#### B. Update gform.html

Edit file `gform.html`, ganti:

**Bagian FORM ACTION:**
```html
<!-- SEBELUM (line 225): -->
<form id="gform" onsubmit="return handleSubmit(event);">

<!-- SESUDAH: -->
<form id="gform" 
      action="https://docs.google.com/forms/d/e/FORM_ID_ANDA/formResponse" 
      method="POST"
      target="hidden_iframe"
      onsubmit="handleGoogleFormSubmit(); return true;">
```

**Ganti FORM_ID_ANDA** dengan ID form Google Anda.

**Bagian INPUT NAMES:**
Tambahkan `name` attribute di setiap input:
```html
<input type="text" id="nama" name="entry.ENTRY_ID_1" ...>
<input type="email" id="email" name="entry.ENTRY_ID_2" ...>
<input type="text" id="alamat" name="entry.ENTRY_ID_3" ...>
<select id="kategori" name="entry.ENTRY_ID_4" ...>
<input type="radio" ... name="entry.ENTRY_ID_5" ...>
<textarea id="keterangan" name="entry.ENTRY_ID_6" ...>
```

**Ganti ENTRY_ID_X** dengan entry ID yang sesuai dari form Anda.

#### C. Tambahkan Hidden Iframe

Tambahkan sebelum closing `</body>`:
```html
<iframe name="hidden_iframe" id="hidden_iframe" style="display:none;" 
        onload="if(submitted) showSuccessMessage();"></iframe>

<script>
let submitted = false;
function handleGoogleFormSubmit() {
    submitted = true;
    // Tetap simpan ke localStorage juga
    handleSubmit(event);
}
</script>
```

---

## 🎨 Perubahan yang Sudah Dilakukan

### ✅ Warna Biru (Bukan Ungu Lagi)
- Background gradient: `#3B82F6` → `#1D4ED8`
- Header: `#3B82F6`
- Tombol: `#3B82F6`
- Focus state: `#3B82F6`

### ✅ Integrasi Dashboard
Data dari Google Form **langsung muncul** di:
- ✅ Dashboard Analytics (`index.html` section dashboard)
- ✅ Halaman Reports (`reports.html`)
- ✅ Grafik & Statistik otomatis update

### ✅ Format Data Konsisten
Data tersimpan dengan struktur sama seperti lapor via Gmail:
```javascript
{
  id: "RPT-1234567890-ABC123",
  timestamp: 1234567890,
  name: "Budi Santoso",
  address: "Jl. Merdeka No. 10",
  category: "jentik",  // jentik/kasus/lingkungan/lainnya
  priority: "medium",  // low/medium/high
  status: "pending",
  note: "Detail laporan..."
}
```

---

## 📊 Cara Melihat Data

### 1. Di Dashboard (index.html)
- Scroll ke section "Dashboard Analytics"
- Lihat angka Total Laporan, Prioritas Tinggi, dll
- Lihat grafik dan aktivitas terbaru

### 2. Di Reports (reports.html)
- Klik "Lihat Laporan" dari Quick Access
- Semua laporan muncul dalam tabel
- Bisa filter, search, dan export ke Excel/CSV

---

## ✨ Kesimpulan

**Form sudah siap 100%!** Tidak wajib setup Google Form. Data tetap tersimpan lokal dan muncul di dashboard.

Jika butuh integrasi penuh dengan Google Sheets, ikuti "Langkah 3" di atas.
