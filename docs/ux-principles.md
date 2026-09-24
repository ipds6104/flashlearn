# 🎨 FlashLearn UX Principles & Industrial Benchmark Analysis

Dokumentasi ini merangkum riset mendalam, standar industri (Nielsen Norman Group, Baymard Institute, ISO 9241-210), serta justifikasi desain interaksi untuk platform **FlashLearn**.

---

## 1. Analisis Kritis: Guest Identity Gating & Pengecekan Nama Duplikat

### Pertanyaan Desain:
> *"Jika quiz atau materi dibuka via link join sebagai guest, apakah sebaiknya langsung ditanya dulu nama yang bersangkutan, dan diatur pengecekan apakah sudah ada nama yang sama untuk konteks materi/quiz tersebut?"*

### Kesimpulan & Rekomendasi Industri:

| Tipe Modul | Pendekatan Terbaik | Alasan UX & Psikologi Kognitif |
| :--- | :--- | :--- |
| **Materi Saja** | ❌ **JANGAN ditanya nama di awal** (Zero-Friction Access) | Konsumsi bacaan bersifat pasif. Meminta nama di awal menghasilkan **bounce rate 60–80%** (NN/g Form Abandonment). Pembaca merasa diinterogasi sebelum mendapat nilai (Value-First Principle). |
| **Quiz Saja** | ✅ **Wajib Briefing Card + Input Nama di Awal** (Identity Commitment) | Meniru pola **Kahoot**, **Quizizz**, dan **Duolingo**. Kuis membutuhkan kepemilikan skor (*Endowment Effect*). Briefing card memberi kepastian durasi, topik, dan jumlah soal. |
| **Materi + Quiz** | ⚡ **Progressive Disclosure** (Tanya saat hendak mulai kuis) | Pengguna membaca materi dengan bebas tanpa halangan. Saat tombol *"Mulai Kuis Evaluasi"* di bagian bawah ditekan, dialog nama muncul secara kontekstual (*Just-in-Time Intent*). |

---

## 2. Strategi Penanganan Nama Duplikat (Duplicate Name Resolution)

### ⚠️ Mengapa "Hard-Blocking" Adalah Anti-Pattern:
Jika sistem menolak input dengan pesan error merah kaku: *"Nama ini sudah dipakai, pilih nama lain!"*, pengguna akan mengalami:
1. **Cognitive Fatigue:** Frustrasi mencoba berbagai variasi nama unik.
2. **Group Context Reality:** Dalam satu kelas atau pelatihan, nama umum (misal: "Budi", "Siti", "Rian") sangat sering kembar.
3. **Drop-Off:** Pengguna batal mengerjakan kuis karena terhambat di gerbang nama.

### ✨ Solusi Best-Practice yang Diterapkan di FlashLearn:
1. **Debounced Realtime Check:** Saat guest mengetik nama, sistem memanggil endpoint `POST /api/v1/contents/:id/check-name` secara debounce (400ms).
2. **Smart Disambiguation Suggestion:** Jika nama telah terdaftar pada kuis tersebut, sistem menampilkan saran ramah 1-klik:
   > *"Nama 'Budi' sudah ada di kuis ini. Gunakan **Budi (2)** [Gunakan Saran] atau tambahkan inisial/nama belakang."*
3. **Non-Blocking Fallback:** Tombol submit tidak di-*disable* secara kejam; jika pengguna tetap ingin menggunakan nama tersebut, backend otomatis menambahkan sufiks unik (*graceful degradation*).
4. **Escape Hatch (Jalur Cepat):** Terdapat opsi *"Lewati & Kerjakan Anonim"* untuk guest yang terburu-buru atau menginginkan privasi.
5. **Local Persistence:** Nama yang telah digunakan disimpan di `localStorage('flashlearn_guest_name')` sehingga guest tidak perlu mengetik ulang saat membuka modul lain di sesi berikutnya.

---

## 3. Penerapan Prinsip-Prinsip UX Standar Industri

### A. Heuristik Nielsen Norman Group (NN/g)

#### 1. Visibility of System Status (Visibilitas Status Sistem)
- **Implementasi:** Pada `QuizRunner.svelte`, progress bar animasi menunjukkan `Soal X dari Y` dan persentase ketercapaian secara realtime.
- **Implementasi:** Pada penyimpanan API Key dan pembuatan konten, indikator loading spinner dan toast Framework7 mengabarkan status request secara instan.

#### 2. Match Between System and the Real World (Kesesuaian dengan Dunia Nyata)
- **Implementasi:** Fitur post-quiz flashcard dirancang dengan simulasi **3D Flip Card** nyata menggunakan CSS `perspective` dan `transform: rotateY(180deg)`. Pengguna menyentuh/mengklik kartu layaknya membalik kartu belajar fisik.

#### 3. User Control and Freedom (Kontrol & Kebebasan Pengguna)
- **Implementasi:** Pengguna dapat berpindah antar kartu flashcard kapan saja (Sebelumnya / Selanjutnya / Balik Kartu), mengulang kuis (*Retake Quiz*), atau kembali ke katalog modul tanpa terjebak.
- **Implementasi:** Dialog dan modal dapat ditutup dengan tombol esc keyboard maupun klik di luar modal (*backdrop dismiss*).

#### 4. Recognition Rather Than Recall (Mengenali Lebih Baik Daripada Mengingat)
- **Implementasi:** Opsi jawaban kuis disajikan dengan badge visual jelas (A, B, C, D) dengan state aktif warna indigo cerah.
- **Implementasi:** Halaman hasil kuis merinci setiap soal: mana jawaban yang benar, jawaban yang dipilih user, dan penjelasan materi terkait.

#### 5. Error Prevention & Friendly Recovery (Pencegahan & Pemulihan Error)
- **Implementasi:** Token API Key rahasia ditampilkan dalam modal *one-time reveal* dengan tombol salin otomatis (*1-click clipboard copy*) untuk mencegah kesalahan *copy-paste* parsial.

---

### B. Hukum UX Psikologi (Laws of UX)

- **Fitts's Law (Hukum Fitts):**
  - Tombol aksi utama (*Call to Action*) seperti *"Mulai Kuis"*, *"Konfirmasi Jawaban"*, dan *"Balik Kartu Flashcard"* memiliki area sentuh minimal **48x48px** (*Thumb Zone friendly* di perangkat mobile/Framework7).
- **Hick's Law (Hukum Hick):**
  - Meminimalkan pilihan yang membebani kognisi: saat kuis berjalan, layar difokuskan murni pada 1 pertanyaan aktif tanpa elemen navigasi distraksi samping (*Focus Mode*).
- **Peak-End Rule:**
  - Puncak pengalaman belajar terjadi di akhir kuis: alih-alih hanya menampilkan skor angka dingin, FlashLearn menyajikan perayaan visual skor dan **tombol interaktif instan untuk langsung membuka Flashcard Active Recall**.

---

## 4. Evaluasi Alur Per Jenis User

### 1. Guest Flow (Pelajar / Tamu)
- **Akses:** Bebas tanpa registrasi/login.
- **Materi:** Zero friction, tipografi nyaman dibaca, tag kategori, waktu estimasi baca.
- **Quiz:** Briefing card -> input nama ramah -> fokus kuis -> rangkuman skor -> 3D Flashcard review.

### 2. Creator Flow (Pendidik / Pembuat Konten)
- **Autentikasi:** 1-klik via Google OAuth resmi.
- **Manajemen Ruang Kerja:** Struktur hierarkis yang jelas: *Workspace -> Modules (Materi / Quiz / Combined)*.
- **Penerbitan Konten:** Form terstruktur dengan validasi opsi jawaban, penanda jawaban benar, dan penjelasan kunci.
- **Integrasi Developer:** Halaman API Key dengan permission scoped (`content:write`, `workspace:write`, `read_only`).

### 3. Superadmin Flow (Pengelola Platform)
- **Visibilitas Global:** Melihat seluruh workspace lintas creator.
- **Tata Kelola:** Mengatur visibilitas publik/privat workspace dan konten.
- **Kredensial Master:** Hak akses API key penuh untuk operasi otomasi dan ingest data eksternal.
