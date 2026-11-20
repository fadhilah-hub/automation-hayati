# Automation Test Login (Playwright)

Test otomatis untuk halaman login aplikasi Hayati.

## Cara menjalankan

1. `npm install`
2. Buat file `.env` di folder project, isi (nilainya diisi sendiri):

```
BASE_URL=http://localhost:5173/
EMAIL_VALID=
SANDI_VALID=
EMAIL_BELUM_ACC=
SANDI_BELUM_ACC=
EMAIL_UJI_BLOKIR=
SANDI_UJI_BLOKIR=
EMAIL_UJI_GAGAL_1=
SANDI_UJI_GAGAL_1=
EMAIL_UJI_GAGAL_2=
DB_HOST=
DB_PORT=
DB_USER=
DB_PASS=
DB_NAME=
```

3. Pastikan aplikasi frontend, backend, dan database lokal sedang jalan.
4. `npm run test:chromium` (semua tes kecuali blokir akun)
5. `npm run test:blokir` (khusus tes blokir akun)

Catatan: `reset-blokir.js` menghapus isi tabel cache dan mengubah batas login. Hanya untuk database lokal.
