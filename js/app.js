/**
 * js/app.js
 * Logika Utama ScanMakan - ONNX Runtime Web Integration
 */

const statusText = document.getElementById('status-text');
const nutritionResult = document.getElementById('nutrition-result');
const resultCard = document.getElementById('result-card');
const appStatus = document.getElementById('app-status');
const imagePreview = document.getElementById('image-preview');
const camPlaceholder = document.getElementById('cam-placeholder');
const btnAnalyze = document.getElementById('btnAnalyze');
const btnStartCam = document.getElementById('btnStartCam');
const btnStopCam = document.getElementById('btnStopCam');
const btnCapture = document.getElementById('btnCapture');
const btnRetry = document.getElementById('btnRetry');
const btnGallery = document.getElementById('btnGallery');
const btnToggleFlash = document.getElementById('btnToggleFlash');
let isFlashOn = false;

let ortSession = null;
let classifierReady = false;

let stream = null;
let videoEl = null;
let displayCanvas = null;
let animFrameId = null;
let isPaused = false;

const MODEL_WIDTH          = 640;         // Input size model (px)
const MODEL_HEIGHT         = 640;         // Input size model (px)
const MODEL_URL            = 'best.onnx'; // Path file model ONNX
const DETECT_THRESHOLD     = 0.5;        // Pre-NMS confidence (Ultralytics default)
const CONFIDENCE_THRESHOLD = 0.35;        // Post-NMS, filter tampilan UI
const IOU_THRESHOLD        = 0.7;         // NMS IoU threshold (Ultralytics default)


// Label kelas — urutan PERSIS sesuai metadata model best.onnx (12 kelas)
// Sumber: custom_metadata_map 'names' dari onnxruntime session
const CLASS_LABELS = [
    'ayam_geprek',     // 0
    'bakso',           // 1
    'bubur_ayam',      // 2
    'burger',          // 3
    'dimsum',          // 4
    'kentang_goreng',  // 5
    'kopi_susu',       // 6
    'martabak_manis',  // 7
    'nasi_goreng',     // 8
    'sate',            // 9
    'seblak',          // 10
    'teh',             // 11
];

function fmt(val, decimals = 1) {
    return Number(val).toFixed(decimals).replace(',', '.');
}

// Display Name ramah pengguna untuk bounding box dan UI
const DISPLAY_NAMES = {
    'ayam_geprek': 'Ayam Geprek',
    'bakso': 'Bakso',
    'bubur_ayam': 'Bubur Ayam',
    'burger': 'Burger',
    'dimsum': 'Dimsum',
    'kentang_goreng': 'Kentang Goreng',
    'kopi_susu': 'Kopi Susu',
    'martabak_manis': 'Martabak Manis',
    'nasi_goreng': 'Nasi Goreng',
    'sate': 'Sate',
    'seblak': 'Seblak',
    'teh': 'Teh'
};

// Mapping nama kelas model ke ID di database MySQL
const CLASS_TO_DB_ID = {
    'ayam_geprek': 'ayam_geprek',
    'bakso': 'bakso',
    'bubur_ayam': 'bubur_ayam',
    'burger': 'burger',
    'dimsum': 'dimsum',
    'kentang_goreng': 'kentang_goreng',
    'kopi_susu': 'kopi_susu',
    'martabak_manis': 'martabak_manis',
    'nasi_goreng': 'nasi_goreng',
    'sate': 'sate',
    'seblak': 'seblak',
    'teh': 'teh'
};

// LOAD MODEL (ONNX Runtime Web)
async function loadModel() {
    if (classifierReady) return;
    try {
        appStatus.innerHTML = '<div class="dot" style="background:#F59E0B"></div> Loading YOLOv8...';
        statusText.innerText = 'Memuat model YOLOv8 (membutuhkan waktu pada koneksi seluler)...';

        // Konfigurasi WebAssembly agar kompatibel dengan iOS Safari & Brave (single thread untuk menghindari isu SharedArrayBuffer)
        if (typeof ort !== 'undefined' && ort.env && ort.env.wasm) {
            ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
            ort.env.wasm.numThreads = 1; // Wajib 1 thread untuk Safari iOS & Brave agar tidak 'Failed to fetch' / memory crash
        }

        ortSession = await ort.InferenceSession.create(MODEL_URL, {
            executionProviders: ['wasm']
        });

        classifierReady = true;
        appStatus.className = 'status-badge ready';
        appStatus.innerHTML = '<div class="dot"></div> YOLOv8 Ready';
        statusText.innerText = 'Siap mendeteksi makanan';
        console.log('ONNX model siap:', MODEL_URL);
        console.log('Input names:', ortSession.inputNames);
        console.log('Output names:', ortSession.outputNames);
    } catch (e) {
        appStatus.className = 'status-badge error';
        appStatus.innerHTML = '<div class="dot" style="background:#ef4444"></div> YOLOv8 Error';
        statusText.innerHTML = `Gagal memuat model YOLOv8: <br><small style="color:#ef4444;font-family:monospace;word-break:break-all;">${e.message || e}</small>`;
        console.error('ONNX model load gagal:', e);
    }
}

// Preload model segera saat halaman selesai load
window.addEventListener('load', () => loadModel());

// LETTERBOX PREPROCESSING — Identik dengan Ultralytics YOLOv8
// Resize dengan mempertahankan aspect ratio, padding abu-abu (114,114,114)
// Return: { tensor, padX, padY, scale, imgW, imgH }
function letterboxPreprocess(imageSource) {
    // Dimensi asli gambar sumber
    const imgW = imageSource.naturalWidth || imageSource.videoWidth || imageSource.width || MODEL_WIDTH;
    const imgH = imageSource.naturalHeight || imageSource.videoHeight || imageSource.height || MODEL_HEIGHT;

    // Hitung scale agar sisi terpanjang pas ke MODEL_WIDTH/HEIGHT
    const scale = Math.min(MODEL_WIDTH / imgW, MODEL_HEIGHT / imgH);
    const newW  = Math.round(imgW * scale);
    const newH  = Math.round(imgH * scale);

    // Padding center (persis Ultralytics)
    const padX = Math.round((MODEL_WIDTH  - newW) / 2);
    const padY = Math.round((MODEL_HEIGHT - newH) / 2);

    const canvas = document.createElement('canvas');
    canvas.width  = MODEL_WIDTH;
    canvas.height = MODEL_HEIGHT;
    const ctx = canvas.getContext('2d');

    // Isi dengan warna abu-abu Ultralytics (114, 114, 114)
    ctx.fillStyle = 'rgb(114,114,114)';
    ctx.fillRect(0, 0, MODEL_WIDTH, MODEL_HEIGHT);

    // Gambar di tengah dengan ukuran hasil scale
    ctx.drawImage(imageSource, padX, padY, newW, newH);

    const imgData = ctx.getImageData(0, 0, MODEL_WIDTH, MODEL_HEIGHT);
    const pixels  = imgData.data;
    const N       = MODEL_WIDTH * MODEL_HEIGHT;

    // NCHW Float32, normalized [0, 1], channel order RGB
    const float32 = new Float32Array(3 * N);
    for (let i = 0; i < N; i++) {
        float32[0 * N + i] = pixels[i * 4 + 0] / 255.0; // R
        float32[1 * N + i] = pixels[i * 4 + 1] / 255.0; // G
        float32[2 * N + i] = pixels[i * 4 + 2] / 255.0; // B
    }

    console.log(`[Letterbox] imgW=${imgW} imgH=${imgH} scale=${scale.toFixed(3)} padX=${padX} padY=${padY}`);

    return {
        tensor: new ort.Tensor('float32', float32, [1, 3, MODEL_WIDTH, MODEL_HEIGHT]),
        padX, padY, scale, imgW, imgH
    };
}

// HELPER: IoU (Intersection over Union)
function iou(a, b) {
    const x1 = Math.max(a.x1, b.x1), y1 = Math.max(a.y1, b.y1);
    const x2 = Math.min(a.x2, b.x2), y2 = Math.min(a.y2, b.y2);
    const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
    const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
    return inter / (areaA + areaB - inter + 1e-6);
}

// HELPER: Non-Maximum Suppression
function nms(boxes, iouThreshold = IOU_THRESHOLD) {
    // Urutkan dari skor tertinggi
    boxes.sort((a, b) => b.score - a.score);
    const keep = [];
    const suppressed = new Set();
    for (let i = 0; i < boxes.length; i++) {
        if (suppressed.has(i)) continue;
        keep.push(boxes[i]);
        for (let j = i + 1; j < boxes.length; j++) {
            if (!suppressed.has(j) && iou(boxes[i], boxes[j]) > iouThreshold) {
                suppressed.add(j);
            }
        }
    }
    return keep;
}

// Warna per kelas (HSL auto-generate)
const CLASS_COLORS = CLASS_LABELS.map((_, i) =>
    `hsl(${Math.round(i * 360 / CLASS_LABELS.length)}, 80%, 50%)`
);

// HELPER: Gambar bounding box di canvas overlay
function drawDetections(detections, displayEl) {
    const detCanvas = document.getElementById('detection-canvas');
    if (!detCanvas) return;

    // Sinkronkan ukuran canvas dengan elemen tampilan
    const rect = displayEl.getBoundingClientRect();
    const containerRect = displayEl.parentElement.getBoundingClientRect();

    detCanvas.width = rect.width;
    detCanvas.height = rect.height;
    detCanvas.style.left = (rect.left - containerRect.left) + 'px';
    detCanvas.style.top = (rect.top - containerRect.top) + 'px';
    detCanvas.style.width = rect.width + 'px';
    detCanvas.style.height = rect.height + 'px';
    detCanvas.style.display = 'block';

    const ctx = detCanvas.getContext('2d');
    ctx.clearRect(0, 0, detCanvas.width, detCanvas.height);

    // Ambil dimensi asli gambar / video
    const imgW = displayEl.naturalWidth || displayEl.videoWidth || displayEl.width || MODEL_WIDTH;
    const imgH = displayEl.naturalHeight || displayEl.videoHeight || displayEl.height || MODEL_HEIGHT;

    const elementW = rect.width;
    const elementH = rect.height;

    // Cek mode object-fit dari CSS
    const computedFit = window.getComputedStyle(displayEl).objectFit || 'cover';

    let renderW, renderH;
    const imgAspect = imgW / imgH;
    const containerAspect = elementW / elementH;

    if (computedFit === 'contain') {
        if (imgAspect > containerAspect) {
            renderW = elementW;
            renderH = elementW / imgAspect;
        } else {
            renderH = elementH;
            renderW = elementH * imgAspect;
        }
    } else {
        // Default: object-fit: cover
        if (imgAspect > containerAspect) {
            renderH = elementH;
            renderW = elementH * imgAspect;
        } else {
            renderW = elementW;
            renderH = elementW / imgAspect;
        }
    }

    const offsetX = (elementW - renderW) / 2;
    const offsetY = (elementH - renderH) / 2;

    // Scale dari koordinat gambar asli (imgW×imgH) ke layar — bukan dari 640×640
    const scaleX = renderW / imgW;
    const scaleY = renderH / imgH;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, elementW, elementH);
    ctx.clip();

    for (const det of detections) {
        const x = offsetX + det.x1 * scaleX;
        const y = offsetY + det.y1 * scaleY;
        const w = (det.x2 - det.x1) * scaleX;
        const h = (det.y2 - det.y1) * scaleY;
        const color = CLASS_COLORS[det.classIdx] || '#52B788';

        // Gambar Kotak
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        // Label teks & background
        const nameToShow = det.displayName || DISPLAY_NAMES[det.label] || det.label;
        const label = `${nameToShow} ${(det.score * 100).toFixed(0)}%`;
        ctx.font = 'bold 13px Inter, sans-serif';
        const textW = ctx.measureText(label).width + 12;
        const textH = 22;

        // Tentukan posisi vertikal label agar tidak terpotong di atas canvas (y < 22)
        let labelY = y - textH;
        if (labelY < 0) {
            labelY = Math.max(0, y); // gambar di dalam bagian atas bounding box
        }

        // Tentukan posisi horizontal label agar tidak terpotong di tepi kiri/kanan
        let labelX = Math.max(0, Math.min(x, elementW - textW));

        ctx.fillStyle = color;
        ctx.fillRect(labelX, labelY, textW, textH);

        // Teks label
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, labelX + 6, labelY + 15);
    }

    ctx.restore();
}

// PREDIKSI (YOLOv8 Multi-Object Detection)
// Output ONNX: [1, 16, 8400]
//   - 4 nilai pertama per anchor: bbox (cx, cy, w, h) dalam px model
//   - 12 nilai berikutnya: skor per kelas
// Threshold dikonfigurasi di blok konfigurasi atas (DETECT_THRESHOLD, CONFIDENCE_THRESHOLD, IOU_THRESHOLD)

async function predict(imageSource) {
    if (!classifierReady || !ortSession) return;
    try {

        const { tensor, padX, padY, scale, imgW, imgH } = letterboxPreprocess(imageSource);
        const feeds = { [ortSession.inputNames[0]]: tensor };
        const results = await ortSession.run(feeds);
        const output = results[ortSession.outputNames[0]]; // [1, NUM_CLASSES+4, 8400]

        const [, , anchors] = output.dims;
        const data = output.data;
        const NUM_CLASSES = CLASS_LABELS.length;


        const rawBoxes = [];
        for (let a = 0; a < anchors; a++) {
            // Cari kelas dengan skor tertinggi untuk anchor ini
            let bestScore = 0, bestClass = -1;
            for (let c = 0; c < NUM_CLASSES; c++) {
                const score = data[(4 + c) * anchors + a];
                if (score > bestScore) { bestScore = score; bestClass = c; }
            }
            // Filter pre-NMS dengan threshold rendah (0.25) — sama dengan Ultralytics
            if (bestScore < DETECT_THRESHOLD) continue;

            // Koordinat bbox (cx,cy,w,h) dalam ruang piksel letterboxed 640×640
            const cx = data[0 * anchors + a];
            const cy = data[1 * anchors + a];
            const bw = data[2 * anchors + a];
            const bh = data[3 * anchors + a];


            const x1 = Math.max(0, Math.min((cx - bw / 2 - padX) / scale, imgW));
            const y1 = Math.max(0, Math.min((cy - bh / 2 - padY) / scale, imgH));
            const x2 = Math.max(0, Math.min((cx + bw / 2 - padX) / scale, imgW));
            const y2 = Math.max(0, Math.min((cy + bh / 2 - padY) / scale, imgH));

            // Abaikan box yang degenerasi (lebar/tinggi nol)
            if (x2 <= x1 || y2 <= y1) continue;

            rawBoxes.push({
                x1, y1, x2, y2,
                score: bestScore, classIdx: bestClass,
                label: CLASS_LABELS[bestClass],
                displayName: DISPLAY_NAMES[CLASS_LABELS[bestClass]] || CLASS_LABELS[bestClass],
                imgW, imgH
            });
        }


        const rawDetections = nms(rawBoxes);
        // Post-NMS filter dengan CONFIDENCE_THRESHOLD untuk tampilan UI
        const detections = rawDetections.filter(d => d.score >= CONFIDENCE_THRESHOLD);
        console.log(`[Deteksi >= ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}%]: ${detections.length} objek`, detections.map(d => `${d.displayName} ${(d.score * 100).toFixed(0)}%`));

        currentDetections = detections;


        if (detections.length > 0) {
            drawDetections(detections, imageSource);
        } else {
            const detCanvas = document.getElementById('detection-canvas');
            if (detCanvas) detCanvas.style.display = 'none';
        }


        if (detections.length === 0) {
            resultCard.style.display = 'block';
            nutritionResult.innerHTML = `
                <div class="food-header">
                    <div class="food-title">
                        <h2>Tidak Ada Makanan Terdeteksi</h2>
                        <div class="confidence-tag" style="background:#ef4444; color:white;">Batas Confidence Score Min. ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}%</div>
                    </div>
                </div>
                <p style="padding:15px; color:#ef4444; font-size:0.95rem; font-weight:600; line-height:1.5; margin:0;">
                    Tidak ada makanan terdeteksi dengan confidence score di atas ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}%.
                </p>
                <p style="padding:0 15px 15px; color:#6B6B63; font-size:0.9rem; line-height:1.4; margin:0;">
                    Silakan ambil ulang foto dengan baik sesuai dengan panduan pengambilan foto di bawah ini agar makanan dapat terdeteksi dengan benar.
                </p>
            `;
            statusText.innerText = `Tidak ada makanan terdeteksi (min. ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}%).`;
            return;
        }

        // Tampilkan deteksi pertama secara default
        await displaySelectedDetection(0);
    } catch (e) {
        console.error('[predict] Error:', e);
    }
}

// MULTI-OBJECT DETECTION SELECTION LOGIC
let currentDetections = [];
let selectedDetectionIdx = 0;

function renderMultiObjectTabs(activeIdx = 0) {
    if (!currentDetections || currentDetections.length <= 1) return '';
    return `
        <div style="background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:14px; padding:12px 14px; margin-bottom:20px;">
                <div style="font-size:0.75rem; font-weight:800; color:#64748B; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                    Objek Terdeteksi pada Foto (${currentDetections.length}):
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
                ${currentDetections.map((d, idx) => {
        const color = CLASS_COLORS[d.classIdx] || '#2D6A4F';
        const isActive = (idx === activeIdx);
        return `
                        <button type="button" onclick="displaySelectedDetection(${idx})" style="
                            background: ${isActive ? color : '#FFFFFF'};
                            color: ${isActive ? '#FFFFFF' : '#1E293B'};
                            border: 1.5px solid ${color};
                            padding: 6px 14px;
                            border-radius: 99px;
                            font-size: 0.82rem;
                            font-weight: 700;
                            cursor: pointer;
                            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            box-shadow: ${isActive ? '0 4px 10px rgba(0,0,0,0.15)' : 'none'};
                        ">
                            <span style="width:8px; height:8px; border-radius:50%; background:${isActive ? '#FFFFFF' : color};"></span>
                            ${d.displayName || d.label} (${(d.score * 100).toFixed(0)}%)
                        </button>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

async function displaySelectedDetection(index = 0) {
    if (!currentDetections || currentDetections.length === 0) return;
    selectedDetectionIdx = index;
    const top = currentDetections[index];
    const topName = top.displayName || top.label;
    const dbId = CLASS_TO_DB_ID[top.label];

    if (dbId) {
        await showNutrition(dbId, top.score, index);
    } else {
        resultCard.style.display = 'block';
        
        let headerIconHtml = '';
        let alertTagHtml = '';
        let infoTextHtml = '';

        if (isTidakDiketahui) {
            headerIconHtml = `
                <div class="food-emoji" style="color: #ef4444; display:flex; align-items:center; justify-content:center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
            `;
            alertTagHtml = `<div class="confidence-tag" style="background:#ef4444; color:white;">Tidak Diketahui</div>`;
            infoTextHtml = `
                <p style="padding:15px; color:#ef4444; font-size:0.95rem; font-weight:600; line-height:1.5; margin:0;">
                    Objek tidak dikenal. Silakan ambil ulang foto dengan baik sesuai dengan panduan pengambilan foto di bawah ini agar makanan dapat terdeteksi dengan benar.
                </p>
            `;
        } else {
            headerIconHtml = `
                <div class="food-emoji" style="color: var(--accent); display:flex; align-items:center; justify-content:center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M3 12h18M12 2v3M8 2v3M16 2v3"></path>
                        <path d="M3 12a9 9 0 0 0 18 0H3z"></path>
                    </svg>
                </div>
            `;
            alertTagHtml = `<div class="confidence-tag" style="background:#52B788; color:white;">Keyakinan AI: ${(top.score * 100).toFixed(0)}%</div>`;
            infoTextHtml = `
                <p style="padding:15px; color:#374151; font-size:0.95rem; font-weight:600; line-height:1.5; margin:0;">
                    Makanan berhasil dideteksi, namun data nutrisi untuk <b>${topName}</b> belum tersedia di database.
                </p>
                <p style="padding:0 15px 15px; color:#6B6B63; font-size:0.9rem; line-height:1.4; margin:0;">
                    Gunakan fitur <b>Pencarian Manual</b> untuk mencari makanan serupa.
                </p>
            `;
        }

        nutritionResult.innerHTML = `
            ${renderMultiObjectTabs(index)}
            <div class="food-header" style="display: flex; align-items: center; gap: 14px;">
                ${headerIconHtml}
                <div class="food-title">
                    <h2>${topName}</h2>
                    ${alertTagHtml}
                </div>
            </div>
            ${infoTextHtml}
        `;
        statusText.innerText = `Terdeteksi: ${topName} (data belum tersedia)`;
    }
}

// MODE A: KAMERA (native getUserMedia)
async function init() {
    await loadModel();
    try {
        statusText.innerText = 'Membuka Kamera...';
        isPaused = false;

        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 400 }, height: { ideal: 400 } }
        });

        videoEl = document.createElement('video');
        videoEl.srcObject = stream;
        videoEl.setAttribute('playsinline', '');
        videoEl.muted = true;
        await videoEl.play();

        const container = document.getElementById('webcam-container');
        const oldCanvas = container.querySelector('canvas');
        if (oldCanvas) oldCanvas.remove();

        displayCanvas = document.createElement('canvas');
        displayCanvas.width = 400;
        displayCanvas.height = 400;
        displayCanvas.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        container.appendChild(displayCanvas);

        // Tampilkan tombol senter secara default saat kamera aktif
        btnToggleFlash.style.display = 'flex';
        isFlashOn = false;
        btnToggleFlash.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
        btnToggleFlash.title = 'Aktifkan Senter';
        btnToggleFlash.style.background = 'rgba(0, 0, 0, 0.6)';

        imagePreview.style.display = 'none';
        camPlaceholder.style.display = 'none';
        resultCard.style.display = 'none';
        btnAnalyze.style.display = 'none';
        btnRetry.style.display = 'none';
        btnGallery.style.display = 'none';
        btnStartCam.style.display = 'none';
        btnCapture.style.display = 'block';
        btnStopCam.style.display = 'block';
        statusText.innerText = 'Kamera Aktif. Silakan ambil foto.';

        camLoop();
    } catch (e) {
        statusText.innerText = 'Koneksi Kamera Gagal.';
        console.error('[kamera] Error:', e);
    }
}

function camLoop() {
    if (isPaused || !stream || !videoEl || !displayCanvas) return;
    const ctx = displayCanvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, displayCanvas.width, displayCanvas.height);
    animFrameId = requestAnimationFrame(camLoop);
}

// STOP KAMERA
function closeCamera() {
    isPaused = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    videoEl = null;

    // Hapus hanya canvas kamera live (displayCanvas), bukan detection-canvas
    const container = document.getElementById('webcam-container');
    if (displayCanvas && container.contains(displayCanvas)) displayCanvas.remove();
    displayCanvas = null;

    // Sembunyikan detection-canvas dan bersihkan
    const detCanvas = document.getElementById('detection-canvas');
    if (detCanvas) {
        detCanvas.style.display = 'none';
        detCanvas.getContext('2d').clearRect(0, 0, detCanvas.width, detCanvas.height);
    }

    imagePreview.style.display = 'none';
    camPlaceholder.style.display = 'flex';
    resultCard.style.display = 'none'; // Sembunyikan info gizi saat foto di-X-in
    btnStopCam.style.display = 'none';
    btnStartCam.style.display = 'block';
    btnCapture.style.display = 'none';
    btnRetry.style.display = 'none';
    btnAnalyze.style.display = 'none';
    btnGallery.style.display = 'block';

    if (btnToggleFlash) {
        btnToggleFlash.style.display = 'none';
        isFlashOn = false;
    }

    statusText.innerText = 'Kamera ditutup.';
    setTimeout(() => { statusText.innerText = 'Siap mendeteksi makanan'; }, 2000);
}

btnStopCam.addEventListener('click', closeCamera);

if (btnToggleFlash) {
    btnToggleFlash.addEventListener('click', async () => {
        const track = stream ? stream.getVideoTracks()[0] : null;
        if (!track) return;
        try {
            isFlashOn = !isFlashOn;
            await track.applyConstraints({
                advanced: [{ torch: isFlashOn }]
            });
            btnToggleFlash.innerHTML = isFlashOn 
                ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                   </svg>`
                : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                   </svg>`;
            btnToggleFlash.title = isFlashOn ? 'Matikan Senter' : 'Aktifkan Senter';
            btnToggleFlash.style.background = isFlashOn ? 'var(--accent)' : 'rgba(0, 0, 0, 0.6)';
        } catch (e) {
            console.error("Gagal mengontrol flash:", e);
            alert("Fitur senter tidak didukung oleh browser, kamera belakang, atau sistem perangkat Anda.");
            btnToggleFlash.style.display = 'none';
            isFlashOn = false;
        }
    });
}

// JEPRET FOTO
btnCapture.addEventListener('click', () => {
    if (!stream) return;
    isPaused = true;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }

    // Matikan senter jika aktif saat dijepret
    const track = stream.getVideoTracks()[0];
    if (track && isFlashOn && typeof track.applyConstraints === 'function') {
        track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => { });
    }
    if (btnToggleFlash) {
        btnToggleFlash.style.display = 'none';
        isFlashOn = false;
    }

    // Simpan frame saat ini ke imagePreview sebelum stream dimatikan
    if (displayCanvas) {
        imagePreview.src = displayCanvas.toDataURL('image/jpeg', 0.95);
        imagePreview.style.display = 'block';
    }

    // Matikan stream agar lampu kamera mati
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }

    // Sembunyikan live canvas, tampilkan foto hasil jepret
    const container = document.getElementById('webcam-container');
    if (displayCanvas && container.contains(displayCanvas)) displayCanvas.remove();
    displayCanvas = null;

    btnCapture.style.display = 'none';
    btnRetry.style.display = 'block';
    btnAnalyze.style.display = 'block';
    btnGallery.style.display = 'block';
    btnStopCam.style.display = 'block';
    statusText.innerText = 'Foto berhasil diambil! Klik UNGGAH FOTO.';
});

// UPLOAD GALERI
async function handleFileUpload(event) {
    const file = event.target.files[0]; if (!file) return;
    closeCamera();

    const reader = new FileReader();
    reader.onload = async function (e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
        camPlaceholder.style.display = 'none';
        resultCard.style.display = 'none';
        btnStartCam.style.display = 'block';
        btnCapture.style.display = 'none';
        btnRetry.style.display = 'none';
        btnAnalyze.style.display = 'block';
        btnGallery.style.display = 'block';
        btnStopCam.style.display = 'block';
        statusText.innerText = 'Foto Galeri terpilih.';
    };
    reader.readAsDataURL(file);
}

btnAnalyze.addEventListener('click', async () => {
    btnAnalyze.innerText = 'Mengunggah...';
    btnAnalyze.disabled = true;
    await loadModel();

    let source = null;
    if (imagePreview.style.display !== 'none') {
        source = imagePreview;
        if (!imagePreview.complete) {
            await new Promise(r => { imagePreview.onload = r; });
        }
    } else if (displayCanvas) {
        source = displayCanvas;
    }

    if (source) {
        statusText.innerText = 'Menganalisis foto...';
        await predict(source);
        statusText.innerText = 'Analisis selesai.';
    } else {
        statusText.innerText = 'Tidak ada foto untuk dianalisis.';
    }

    btnAnalyze.innerText = 'UNGGAH FOTO';
    btnAnalyze.disabled = false;
});

// SHOW NUTRITION (dari MySQL via PHP API)
async function showNutrition(foodId, confidenceScore = null, detectionIdx = 0) {
    const id = foodId.toLowerCase().trim().replace(/\s+/g, '_');
    console.log('[showNutrition] Model mendeteksi:', foodId);

    try {
        const response = await fetch(`api/foods.php?id=${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error('Database request failed');
        const data = await response.json();

        if (data) {
            renderNutritionUI(id, data, 'penuh', 'default', confidenceScore, detectionIdx);
        } else {
            resultCard.style.display = 'block';
            nutritionResult.innerHTML = `
                ${renderMultiObjectTabs(detectionIdx)}
                <div class="food-header">
                    <div class="food-title">
                        <h2>${foodId}</h2>
                        <div class="confidence-tag" style="background:#ef4444; color:white;">Data Belum Ada di Database</div>
                    </div>
                </div>
                <p style="padding:15px; color:#666; font-size:0.9rem;">
                    Sistem mendeteksi ini sebagai <b>${foodId}</b>, namun informasi gizinya belum ditambahkan ke database (Key: <code>${id}</code>).
                </p>
            `;
            console.warn('[showNutrition] Data tidak ditemukan di database:', id);
        }
    } catch (err) {
        console.error('[showNutrition] Error DB:', err);
    }
}

// KALKULASI ESTIMASI NUTRISI BERDASARKAN UKURAN PORSI
function calcNutrisi(data, activePortion = 'penuh', activeVar = 'default') {
    // 1. Tentukan factor porsi (default 1.0 = porsi penuh)
    let factor = 1.0;
    let label  = data.serving_size || '1 Porsi';

    if (data.portion_factors && data.portion_factors[activePortion]) {
        factor = data.portion_factors[activePortion];
    }
    if (data.portion_labels && data.portion_labels[activePortion]) {
        label = data.portion_labels[activePortion];
    }

    // 2. Jika variasi aktif, gabungkan data variasi ke data dasar
    let baseData = data;
    if (activeVar !== 'default' && data.variations && data.variations[activeVar]) {
        baseData = { ...data, ...data.variations[activeVar] };
    }

    // 3. Hitung estimasi nutrisi = nilai dasar × factor porsi
    const cal  = Math.round((baseData.calories || 0) * factor);
    const prot = parseFloat(fmt((baseData.protein  || 0) * factor));
    const fat  = parseFloat(fmt((baseData.fat      || 0) * factor));
    const carb = parseFloat(fmt((baseData.carbs    || 0) * factor));

    return { factor, label, baseData, cal, prot, fat, carb };
}

// RENDER UI NUTRISI
function renderNutritionUI(id, data, activePortion = 'penuh', activeVar = 'default', confidenceScore = null, detectionIdx = 0) {
    resultCard.style.display = 'block';

    const { factor, label, baseData, cal, prot, fat, carb } = calcNutrisi(data, activePortion, activeVar);


    const isMinuman = (data.type === 'minuman');

    const typeIconSvg = isMinuman
        ? `<div class="food-emoji" style="color: #0284C7; display:flex; align-items:center; justify-content:center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M6 3h12l-2 18H8L6 3z"></path>
                <path d="M19 2L13 8"></path>
            </svg>
           </div>`
        : `<div class="food-emoji" style="color: var(--accent); display:flex; align-items:center; justify-content:center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M3 12h18M12 2v3M8 2v3M16 2v3"></path>
                <path d="M3 12a9 9 0 0 0 18 0H3z"></path>
            </svg>
           </div>`;

    nutritionResult.innerHTML = `
        ${renderMultiObjectTabs(detectionIdx)}
        <div class="food-header" style="display: flex; align-items: center; gap: 14px;">
            ${typeIconSvg}
            <div class="food-title">
                <h2>${baseData.name || baseData.name_id || id}</h2>
                <div class="confidence-tag">${isMinuman ? 'Minuman' : 'Makanan'} · ${baseData.serving_size || label}</div>
                ${confidenceScore !== null ? `<div class="confidence-tag" style="background: ${confidenceScore >= 0.90 ? '#D1FAE5; color:#065F46' : confidenceScore >= 0.80 ? '#FEF3C7; color:#92400E' : '#FEE2E2; color:#991B1B'}; margin-top: 4px;">Keyakinan AI: ${fmt(confidenceScore * 100, 1)}%</div>` : ''}
            </div>
        </div>
        <div class="nutri-grid">
            <div class="nutri-card calories"><div><div class="n-label">Kalori</div><div class="n-val">${Math.round((baseData.calories || 0) * factor)}</div></div></div>
            <div class="nutri-card protein"><div class="n-label">Protein</div><div class="n-val">${fmt((baseData.protein || 0) * factor)}g</div></div>
            <div class="nutri-card fat"><div class="n-label">Lemak</div><div class="n-val">${fmt((baseData.fat || 0) * factor)}g</div></div>
            <div class="nutri-card carbs"><div class="n-label">Karbo</div><div class="n-val">${fmt((baseData.carbs || 0) * factor)}g</div></div>
        </div>
        ${(() => {
            // Tampilkan source_url dari variasi jika ada, fallback ke data utama
            const sourceUrl = (activeVar !== 'default' && data.variations && data.variations[activeVar] && data.variations[activeVar].source_url)
                ? data.variations[activeVar].source_url
                : (data.source_url || null);
            if (!sourceUrl) return '';
            let hostname = sourceUrl;
            try { hostname = new URL(sourceUrl).hostname; } catch(e) {}
            return `
        <div style="padding:10px 16px; margin-top:8px; border-top: 1px solid #F0EFEC; display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.78rem; color:#A3A39A; flex-shrink:0;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Sumber data:
            </span>
            <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer"
               style="font-size:0.78rem; color:#52B788; text-decoration:underline; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"
               title="${sourceUrl}">${hostname}</a>
        </div>`;
        })()}
    `;

    if (data.variations && data.variations.length > 0) {
        nutritionResult.innerHTML += `
            <div class="portion-box">
                <div class="section-label">Pilih Variasi</div>
                <div class="variation-grid">
                    <button class="var-btn ${activeVar === 'default' ? 'active' : ''}" onclick="updatePortionData('${id}', 'var', 'default', '${activePortion}')" title="${data.serving_size || '1 Porsi'}">Original</button>
                    ${data.variations.map((v, i) => `<button class="var-btn ${activeVar == i ? 'active' : ''}" onclick="updatePortionData('${id}', 'var', ${i}, '${activePortion}')" title="${v.serving_size || ''}">${v.name}${v.serving_size ? `<span style="display:block;font-size:0.65rem;opacity:0.75;font-weight:500;margin-top:2px;">${v.serving_size}</span>` : ''}</button>`).join('')}
                </div>
            </div>`;
    }

    if (data.portions && data.portions.length > 1 && data.portion_labels) {
        nutritionResult.innerHTML += `
            <div class="portion-box">
                <div class="section-label">Pilih Ukuran</div>
                <div class="portion-grid">
                    ${data.portions.map(p => {
            const pLabel = data.portion_labels[p] || p;
            return `<button class="port-btn ${p === activePortion ? 'active' : ''}" onclick="updatePortionData('${id}', 'portion', '${p}', '${activeVar}')"><span class="p-label">${pLabel}</span></button>`;
        }).join('')}
                </div>
            </div>`;
    }

    const name = (baseData.name || baseData.name_id || id).replace(/'/g, "\\'");

    nutritionResult.innerHTML += `
        <button class="btn-add-log" id="btnAddLog"
            onclick="handleAddToLog('${name}', ${cal}, ${prot}, ${fat}, ${carb}, '${label}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tambah ke Log Harian
        </button>
    `;
}

window.handleAddToLog = function (name, cal, prot, fat, carb, portion) {
    addFoodToLog(name, cal, prot, fat, carb, portion);
    const btn = document.getElementById('btnAddLog');
    if (btn) {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Ditambahkan!`;
        btn.style.background = '#22C55E';
        btn.disabled = true;
        setTimeout(() => {
            btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Tambah ke Log Harian`;
            btn.style.background = '';
            btn.disabled = false;
        }, 2000);
    }
    document.getElementById('daily-log-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.updatePortionData = async function (foodId, type, value, otherState) {
    try {
        const response = await fetch(`api/foods.php?id=${encodeURIComponent(foodId)}`);
        if (response.ok) {
            const data = await response.json();
            if (data) {
                renderNutritionUI(foodId, data, type === 'portion' ? value : otherState, type === 'var' ? value : otherState);
            }
        }
    } catch (err) {
        console.error('[updatePortionData] Error:', err);
    }
};

// PENCARIAN MAKANAN MANUAL
const manualSearchInput = document.getElementById('manualSearchInput');
const searchResults = document.getElementById('searchResults');
const btnClearSearch = document.getElementById('btnClearSearch');

if (manualSearchInput) {
    let debounceTimeout = null;

    manualSearchInput.addEventListener('input', () => {
        const query = manualSearchInput.value.trim();
        if (btnClearSearch) {
            btnClearSearch.style.display = query.length > 0 ? 'block' : 'none';
        }

        clearTimeout(debounceTimeout);
        if (query.length < 1) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
        }

        debounceTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`api/foods.php?q=${encodeURIComponent(query)}`);
                if (!response.ok) throw new Error('Search failed');
                const foods = await response.json();

                if (foods && foods.length > 0) {
                    searchResults.innerHTML = foods.map(food => {
                        const isMinuman = (food.type === 'minuman');
                        const typeIconSvg = isMinuman
                            ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2h8l1 10H7L8 2z"/><path d="M7 12c0 4 2 7 5 7s5-3 5-7"/><line x1="12" y1="2" x2="12" y2="7"/></svg>`
                            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M12 2v3M8 2v3M16 2v3"/><path d="M3 12a9 9 0 0 0 18 0H3z"/></svg>`;
                        return `
                            <div class="search-result-item" onclick="selectSearchResult('${food.id}')">
                                <div class="item-emoji-name">
                                    ${typeIconSvg}
                                    <span>${food.name_id}</span>
                                </div>
                                <div class="item-cal">${Math.round(food.calories)} kkal</div>
                            </div>
                        `;
                    }).join('');
                    searchResults.style.display = 'block';
                } else {
                    searchResults.innerHTML = `<div style="padding:14px 18px; font-size:0.9rem; color:#A3A39A; text-align:center;">Makanan tidak ditemukan</div>`;
                    searchResults.style.display = 'block';
                }
            } catch (err) {
                console.error('[search] Error:', err);
            }
        }, 200);
    });

    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            manualSearchInput.value = '';
            btnClearSearch.style.display = 'none';
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            manualSearchInput.focus();
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!manualSearchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

window.selectSearchResult = function (foodId) {
    if (manualSearchInput) {
        const itemEl = searchResults.querySelector(`[onclick="selectSearchResult('${foodId}')"]`);
        if (itemEl) {
            const nameSpan = itemEl.querySelector('.item-emoji-name span:last-child');
            if (nameSpan) {
                manualSearchInput.value = nameSpan.innerText;
            }
        }
    }
    searchResults.style.display = 'none';
    showNutrition(foodId);
    // Scroll to result card
    setTimeout(() => {
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
};
