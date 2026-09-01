<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ScanMakan - Deteksi Kalori Instan</title>
    <meta name="description" content="Scan makanan dan pantau kalori harian secara otomatis dengan AI.">
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">
    <!-- CSS Utama -->
    <link rel="stylesheet" href="css/style.css">
</head>

<body>
    <!-- HEADER -->
    <header class="header">
        <div class="header-inner">
            <div class="logo">
                <div class="logo-icon">S</div>
                <span>ScanMakan</span>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
                <button class="btn-profile" onclick="openProfileModal()" title="Kalkulator BMI & TDEE" style="display: flex; align-items: center; gap: 6px;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    Profil & Target
                </button>
                <div id="app-status" class="status-badge ready">
                    <div class="dot"></div>
                    <span class="badge-text">YOLOv8 Ready</span>
                </div>
            </div>
        </div>
    </header>

    <main class="main">
        <!-- HERO SECTION -->
        <div class="hero-text" style="text-align: center; margin-bottom: 20px;">
            <h1
                style="font-size: clamp(1.5rem, 6vw, 2.2rem); font-weight: 800; letter-spacing: -1px; line-height: 1.1; margin-bottom: 12px; color: #1C1C1C;">
                Cek Kalori Makanan <br><span style="color: var(--accent);">Harianmu</span></h1>
            <p style="color: var(--text-muted); font-size: 1rem; max-width: 480px; margin: 0 auto;">Foto makananmu, lihat info gizinya, dan catat ke log harianmu dengan mudah.</p>
        </div>

        <!-- BANNER SETUP PROFIL (muncul jika profil belum diisi) -->
        <div id="profile-setup-banner"
            style="display:flex; align-items:center; gap:14px; background:#FFFBEB; border:1.5px solid #FCD34D; border-radius:16px; padding:14px 18px; margin-bottom:20px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #FEF3C7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #D97706;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            <div style="display:flex; flex-direction:column; gap:2px; flex:1;">
                <strong style="font-size:0.95rem; font-weight:700; color:#92400E;">Lengkapi profilmu dulu!</strong>
                <span style="font-size:0.82rem; color:#B45309; line-height:1.4;">Isi data diri untuk mendapatkan target
                    kalori harian (TDEE) yang dipersonalisasi.</span>
            </div>
            <button onclick="openProfileModal()"
                style="background:#F59E0B; color:#fff; font-weight:700; font-size:0.85rem; border:none; border-radius:10px; padding:9px 16px; cursor:pointer; white-space:nowrap; font-family:inherit;">
                Isi Profil
            </button>
        </div>

        <!-- PENCARIAN MAKANAN MANUAL -->
        <div class="panel shadow-sm anim-up"
            style="margin-bottom: 24px; padding: 14px 20px; background: white; border-radius: 20px; border: 1.5px solid #EEECE8; position: relative; animation-delay: 0.05s; overflow: visible !important; z-index: 1000 !important;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8F8F87" stroke-width="2.5" style="flex-shrink: 0;">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" id="manualSearchInput"
                    placeholder="Cari nama makanan... (misal: Nasi Goreng, Teh Manis)"
                    style="width: 100%; border: none; outline: none; font-family: inherit; font-size: 0.95rem; color: #1C1C1C; background: transparent;">
                <button id="btnClearSearch"
                    style="display: none; background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #A3A39A; padding: 0 4px; line-height: 1;">✕</button>
            </div>
            <!-- Hasil Autocomplete Dropdown -->
            <div id="searchResults"
                style="display: none; position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: white; border: 1.5px solid #EEECE8; border-radius: 16px; box-shadow: 0 12px 30px rgba(0,0,0,0.06); z-index: 100; max-height: 250px; overflow-y: auto;">
            </div>
        </div>



        <!-- WORKSPACE LAYOUT (2 KOLOM DI DESKTOP) -->
        <div class="workspace-layout">
            <!-- KOLOM KIRI -->
            <div class="workspace-left">
                <div class="app-grid">
                    <!-- PANEL KAMERA & UPLOAD -->
                    <div class="panel shadow-lg anim-up" style="animation-delay: 0.1s;">
                        <div id="webcam-container" class="preview-wrap"
                            style="background: #EFEBE7; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                            <img id="image-preview" style="display:none; width:100%; height:100%; object-fit:contain; background:#0F172A;">
                            <canvas id="detection-canvas" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:5;"></canvas>
                            <button id="btnStopCam" class="btn-close-preview" style="display:none; z-index: 10;"
                                title="Tutup Kamera">✕</button>
                            <button id="btnToggleFlash"
                                style="display:none; z-index: 10; position: absolute; bottom: 16px; right: 16px; background: rgba(0, 0, 0, 0.6); color: white; border: none; border-radius: 50%; width: 44px; height: 44px; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s;"
                                title="Aktifkan Senter">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                </svg>
                            </button>
                            <div id="cam-placeholder" class="upload-idle">
                                <div class="upload-circle">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2">
                                        <path
                                            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z">
                                        </path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                </div>
                                <p id="status-text">Siap mendeteksi makanan</p>
                            </div>
                        </div>
                        <div class="camera-actions">
                            <button class="btn btn-primary" onclick="init()" id="btnStartCam">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2" style="margin-right:8px;">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z">
                                    </path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                BUKA KAMERA
                            </button>

                            <button class="btn btn-primary" id="btnCapture" style="display:none; background: #1C1C1C;">
                                JEPRET FOTO
                            </button>

                            <button class="btn btn-outline" id="btnRetry" style="display:none;" onclick="init()">
                                AMBIL ULANG
                            </button>

                            <button class="btn btn-primary" id="btnAnalyze" style="display:none; background: var(--accent);">
                                UNGGAH FOTO
                            </button>

                            <button class="btn btn-outline" onclick="document.getElementById('file-input').click()"
                                id="btnGallery" style="width: 100%;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2" style="margin-right:8px;">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                                DARI GALERI
                            </button>

                            <input type="file" id="file-input" accept="image/*" style="display:none"
                                onchange="handleFileUpload(event)">
                        </div>
                    </div>
                </div>

                <!-- PANDUAN PENGAMBILAN GAMBAR (DESKTOP ONLY) -->
                <div id="guidelines-card-desktop" class="panel shadow-sm anim-up" style="animation-delay: 0.22s; margin-top: 20px; padding: 24px 32px; background: white; border: 1.5px solid #EEECE8; border-radius: 20px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="width: 4px; height: 24px; background: var(--accent); border-radius: 2px;"></div>
                        <h3 style="font-size: 1.1rem; font-weight: 800; color: #1C1C1C; margin: 0; letter-spacing: -0.3px;">Panduan Pengambilan Gambar</h3>
                    </div>
                    <p style="font-size: 0.88rem; color: #6B6B63; line-height: 1.6; margin: 0 0 16px 0;">Untuk mendapatkan hasil deteksi dengan akurasi maksimal, harap ikuti petunjuk berikut:</p>
                    <ol style="font-size: 0.88rem; color: #4A4A45; line-height: 1.8; padding-left: 20px; margin: 0; display: flex; flex-direction: column; gap: 8px;">
                        <li>Pastikan objek makanan atau minuman berada di tengah frame dan dalam kondisi fokus (tidak buram).</li>
                        <li>Gunakan pencahayaan yang cukup dan merata. Hindari bayangan gelap yang menutupi permukaan makanan atau minuman.</li>
                        <li>Posisikan kamera sejajar atau mengarah langsung ke permukaan atas makanan atau minuman.</li>
                        <li>Pastikan tidak ada objek lain yang mendominasi gambar selain makanan atau minuman yang ingin dideteksi.</li>
                    </ol>
                </div>
            </div>

            <!-- KOLOM KANAN -->
            <div class="workspace-right">
                <!-- PANEL HASIL -->
                <div id="result-card" class="panel panel-result shadow-lg anim-up"
                    style="animation-delay: 0.2s; display: none; margin-bottom: 20px;">
                    <div id="nutrition-result"></div>
                </div>

                <!-- PANDUAN PENGAMBILAN GAMBAR (MOBILE ONLY - DITEMPATKAN DI BAWAH INFO GIZI) -->
                <div id="guidelines-card-mobile" class="panel shadow-sm anim-up" style="animation-delay: 0.22s; margin-bottom: 20px; padding: 24px 32px; background: white; border: 1.5px solid #EEECE8; border-radius: 20px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="width: 4px; height: 24px; background: var(--accent); border-radius: 2px;"></div>
                        <h3 style="font-size: 1.1rem; font-weight: 800; color: #1C1C1C; margin: 0; letter-spacing: -0.3px;">Panduan Pengambilan Gambar</h3>
                    </div>
                    <p style="font-size: 0.88rem; color: #6B6B63; line-height: 1.6; margin: 0 0 16px 0;">Untuk mendapatkan hasil deteksi dengan akurasi maksimal, harap ikuti petunjuk berikut:</p>
                    <ol style="font-size: 0.88rem; color: #4A4A45; line-height: 1.8; padding-left: 20px; margin: 0; display: flex; flex-direction: column; gap: 8px;">
                        <li>Pastikan objek makanan atau minuman berada di tengah frame dan dalam kondisi fokus (tidak buram).</li>
                        <li>Gunakan pencahayaan yang cukup dan merata. Hindari bayangan gelap yang menutupi permukaan makanan atau minuman.</li>
                        <li>Posisikan kamera sejajar atau mengarah langsung ke permukaan atas makanan atau minuman.</li>
                        <li>Pastikan tidak ada objek lain yang mendominasi gambar selain makanan atau minuman yang ingin dideteksi.</li>
                    </ol>
                </div>
                
                <div id="daily-log-section"></div>
            </div>
        </div>

    </main>

    <footer class="footer">
        <p>ScanMakan</p>
    </footer>

    <!-- MODAL PROFIL / KALKULATOR BMI & TDEE -->
    <div id="profile-modal" class="modal-overlay" style="display:none;"
        onclick="if(event.target===this) closeProfileModal()">
        <div class="modal-box">
            <div class="modal-handle"></div>
            <div class="modal-header">
                <h2>Kalkulator Gizi Pribadi</h2>
                <button class="modal-close" onclick="closeProfileModal()">✕</button>
            </div>
            <div class="modal-body">
                <div class="modal-form-col">
                    <p class="modal-desc">Isi data dirimu untuk menghitung <b>BMI</b> dan <b>TDEE</b> — target kalori harian
                        yang dipersonalisasi menggunakan rumus <b>Mifflin-St Jeor</b>.</p>

                    <div class="form-grid">
                        <div class="form-group">
                            <label>Jenis Kelamin</label>
                            <select id="pm-gender">
                                <option value="pria">Laki-laki</option>
                                <option value="wanita">Perempuan</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Usia (tahun)</label>
                            <input type="number" id="pm-age" placeholder="Contoh: 20" min="10" max="100">
                        </div>
                        <div class="form-group">
                            <label>Berat Badan (kg)</label>
                            <input type="number" id="pm-weight" placeholder="Contoh: 65" min="20" max="300" step="0.1">
                        </div>
                        <div class="form-group">
                            <label>Tinggi Badan (cm)</label>
                            <input type="number" id="pm-height" placeholder="Contoh: 170" min="100" max="250">
                        </div>
                        <div class="form-group" style="grid-column: 1/-1;">
                            <label>Tingkat Aktivitas</label>
                            <select id="pm-activity">
                                <option value="sedentary">Sedentary (jarang olahraga, kerja kantoran)</option>
                                <option value="light">Lightly Active (olahraga ringan 1–3x/minggu)</option>
                                <option value="moderate" selected>Moderately Active (olahraga sedang 3–5x/minggu)</option>
                                <option value="active">Very Active (olahraga berat 6–7x/minggu)</option>
                            </select>
                        </div>
                    </div>

                    <button class="btn-calculate" onclick="saveProfileFromModal()">
                        Hitung BMI & TDEE
                    </button>
                </div>

                <div id="pm-result"></div>
            </div>
        </div>
    </div>

    <!-- ONNX Runtime Web (CDN) -->
    <script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js"></script>

    <script src="js/tracker.js"></script>
    <script src="js/app.js?v=<?= filemtime('js/app.js') ?>"></script>
</body>

</html>