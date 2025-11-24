# Cara Setup Google Form untuk Laporan DBD

Follow langkah-langkah ini untuk mengaktifkan Google Form:

## 📝 Langkah 1: Buat Google Form Baru

1. Buka https://forms.google.com
2. Klik tombol **"+"** (Blank form) untuk membuat form baru
3. Ubah judul form menjadi: **"Laporan Temuan DBD"**
4. Tambahkan deskripsi: **"Form pelaporan jentik nyamuk atau kasus DBD"**

## 🔧 Langkah 2: Tambahkan Pertanyaan

Buat pertanyaan berikut PERSIS dengan urutan ini:

### Pertanyaan 1: Nama Lengkap
- Tipe: **Short answer**
- Judul: `Nama Lengkap`
- Keterangan: `Opsional`
- ❌ **Jangan** centang "Required"

### Pertanyaan 2: Email
- Tipe: **Short answer**
- Judul: `Email`
- Keterangan: `Opsional`
- ❌ **Jangan** centang "Required"

### Pertanyaan 3: Alamat
- Tipe: **Short answer**
- Judul: `Alamat Lengkap / RT & RW`
- ✅ Centang **"Required"**

### Pertanyaan 4: Kategori
- Tipe: **Dropdown**
- Judul: `Kategori Laporan`
- Pilihan:
  - `Temuan Jentik Nyamuk`
  - `Kasus atau Gejala DBD`
  - `Lingkungan Berisiko`
  - `Lainnya`
- ✅ Centang **"Required"**

### Pertanyaan 5: Prioritas
- Tipe: **Multiple choice**
- Judul: `Tingkat Prioritas`
- Pilihan:
  - `Rendah - Pemantauan rutin`
  - `Sedang - Perlu perhatian`
  - `Tinggi - Urgent, perlu tindakan segera`
- ✅ Centang **"Required"**

### Pertanyaan 6: Keterangan
- Tipe: **Paragraph**
- Judul: `Detail Laporan / Keterangan`
- Keterangan: `Berikan detail selengkap mungkin`
- ✅ Centang **"Required"**

## 🔗 Langkah 3: Dapatkan Link Form

1. Klik tombol **"Send"** (pojok kanan atas)
2. Pilih tab **"Link"** (ikon 🔗)
3. Klik **"Shorten URL"** (optional)
4. Klik **"COPY"** untuk copy link

URL akan berbentuk seperti:
```
https://forms.gle/xxxxxxxxxxxx
```
ATAU
```
https://docs.google.com/forms/d/e/1FAIpQLSxxxxxxxxx/viewform
```

## 🎨 Langkah 4: Customize Form (Opsional)

1. Klik ikon **palette** 🎨 (pojok kanan atas)
2. Pilih warna tema: **Green** (#0F8B6D jika bisa)
3. Pilih header image jika mau
4. Klik "Background color" → pilih hijau

## 📊 Langkah 5: Setup Spreadsheet untuk Respon

1. Di Google Form, klik tab **"Responses"**
2. Klik tombol **hijau** dengan icon spreadsheet
3. Pilih **"Create a new spreadsheet"**
4. Klik **"Create"**

✅ Semua data laporan akan otomatis masuk ke Google Sheets!

## 🔐 Langkah 6: Dapatkan Entry IDs (untuk gform.html)

Jika Anda ingin menggunakan `gform.html`:

1. Buka Google Form Anda yang sudah jadi
2. Klik **"Send"** → **"Link"** → Copy link
3. Buka link di browser
4. Tekan `Ctrl+U` (View Page Source)
5. Cari `entry.` - akan ada angka seperti `entry.1234567890`
6. Copy semua entry IDs dan ganti di `gform.html`

Contoh:
```html
<!-- SEBELUM -->
<input name="entry.YOUR_ENTRY_ID_1" ...>

<!-- SESUDAH (ganti dengan ID asli) -->
<input name="entry.1234567890" ...>
```

## 📍 Langkah 7: Update Link di Website

### Option A: Gunakan Link Google Form Langsung

Edit `lapor.html`, cari baris ini:
```html
```
<a href="https://forms.gle/YOUR_FORM_ID" target="_blank" class="btn btn-primary">
```

Ganti `YOUR_FORM_ID` with link form Anda.

### Option B: Gunakan gform.html

1. Update semua `YOUR_ENTRY_ID` di `gform.html` with entry IDs yang benar
2. Update `YOUR_FORM_ID` di action form
3. Di `lapor.html`, ganti link Google Form ke `gform.html`

## ✅ Testing

1. Buka form Anda
2. Isi dan submit test data
3. Check Google Sheets → data should masuk otomatis
4. ✓ DONE!

## 🎯 Tips Pro

- **Notifikasi Email**: Di Google Form → Settings → Responses → centang "Get email notifications for new responses"
- **Limit Responses**: Bisa set max responses jika perlu
- **Confirmation Message**: Customize pesan sukses di Settings → Presentation
- **Auto-close**: Bisa set tanggal otomatis close form

## 🆘 Troubleshooting

**Q: Form tidak submit?**
- Pastikan semua field "Required" sudah diisi
- Check internet connection

**Q: Data tidak masuk Google Sheets?**
- Pastikan Spreadsheet sudah di-link
- Check tab "Responses" di Google Form

**Q: Entry IDs tidak ketemu?**
- Gunakan Option A (link langsung) saja, lebih mudah!

---

**Need Help?**
- Google Forms Help: https://support.google.com/docs/answer/6281888
- Video Tutorial: Search "cara membuat google form" di YouTube
