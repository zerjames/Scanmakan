# ScanMakan – Panduan Lengkap

## 📁 Struktur Folder

```
ScanMakan/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── nutrition.js      ← database nutrisi + porsi
│   └── app.js            ← logika utama
└── model/                ← ⬅️ LETAKKAN MODEL TEACHABLE MACHINE DI SINI
    ├── model.json
    ├── metadata.json
    └── weights.bin
```

---

## 🧠 Cara Melatih Model di Teachable Machine

1. Buka **https://teachablemachine.withgoogle.com/**
2. Pilih **Image Project → Standard image model**
3. Tambahkan kelas makanan (contoh: `bakso`, `nasi goreng`, `ayam goreng`, dll.)
4. Upload 30–100 foto per kelas untuk hasil terbaik
5. Klik **Train Model**
6. Setelah selesai, klik **Export Model**
7. Pilih tab **Tensorflow.js**
8. Klik **Download my model** → ekstrak file ZIP

---

## 📦 Cara Pasang Model

Setelah download model dari Teachable Machine:

1. Buat folder `model/` di dalam folder `ScanMakan/`
2. Salin ketiga file ke dalamnya:
   - `model.json`
   - `metadata.json`
   - `weights.bin` (mungkin ada beberapa file weights)
3. Buka website — model akan otomatis dimuat

> **Mode Demo**: Jika folder `model/` belum ada, website akan berjalan dalam mode demo
> dengan prediksi acak dari database. Status bar di header menunjukkan mode aktif.

---

## 🥘 Menyesuaikan Nama Kelas

Nama kelas di Teachable Machine **harus sama** dengan key di `js/nutrition.js`.

Contoh: jika Anda melatih kelas bernama `"Bakso"`, pastikan di `nutrition.js` ada:

```js
"bakso": {
  name_id: "Bakso",
  emoji: "🍲",
  calories: 156, protein: 10.5, fat: 9.2, carbs: 7.8, fiber: 0.3
},
```

Pencarian bersifat **case-insensitive** dan **partial match**, jadi `"Bakso Kuah"` akan cocok dengan `"bakso"`.

---

## ⚖️ Sistem Porsi

| Porsi    | Bobot  | Faktor |
|----------|--------|--------|
| Kecil    | ~50g   | × 0.5  |
| Sedang   | ~100g  | × 1.0  |
| 1 Porsi  | ~200g  | × 2.0  |

Semua nilai kalori, protein, lemak, dan karbo dikalikan otomatis sesuai pilihan porsi user.

---

## 🌐 Cara Menjalankan

Buka melalui **XAMPP** (karena model dimuat via HTTP):

1. Pastikan Apache XAMPP berjalan
2. Buka browser → `http://localhost/ScanMakan/`

> ⚠️ Jangan buka langsung sebagai file (`file:///...`) karena CORS akan memblokir loading model.

---

## ➕ Menambah Makanan ke Database

Edit file `js/nutrition.js`, tambahkan entry baru:

```js
"nama kelas": {
  name_id: "Nama Bahasa Indonesia",
  emoji: "🍽️",
  calories: 0,   // kcal per 100g
  protein: 0,    // gram per 100g
  fat: 0,        // gram per 100g
  carbs: 0,      // gram per 100g
  fiber: 0       // gram per 100g
},
```
