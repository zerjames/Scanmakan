/**
 * js/tracker.js
 * Modul Kalkulator BMI, TDEE & Log Makanan Harian
 * Rumus: Mifflin-St Jeor & Klasifikasi BMI (Kemenkes RI, 2023)
 */

// Fungsi pembantu untuk mengembalikan icon SVG makanan/minuman secara dinamis
function getFoodIconSvg(name, size = 16) {
    const isDrink = /teh|kopi|es\s|jus|susu|air|soda|drink|minum|sirup/i.test(name);
    if (isDrink) {
        // SVG Glass/Drink dengan warna biru air
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2.5" style="flex-shrink: 0; margin-right: 2px;">
            <path d="M6 3h12l-2 18H8L6 3z"></path>
            <path d="M19 2L13 8"></path>
        </svg>`;
    } else {
        // SVG Hot Bowl dengan warna aksen web
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" style="flex-shrink: 0; margin-right: 2px;">
            <path d="M3 12h18M12 2v3M8 2v3M16 2v3"></path>
            <path d="M3 12a9 9 0 0 0 18 0H3z"></path>
        </svg>`;
    }
}

// Daftarkan fungsi ke global window
window.getFoodIconSvg = getFoodIconSvg;

// ─────────────────────────────────────────
// KALKULASI
// ─────────────────────────────────────────

/**
 * Hitung BMI
 * Sumber: Kemenkes RI (2023) - Pedoman Gizi Seimbang
 */
function calcBMI(weightKg, heightCm) {
    const h = heightCm / 100;
    return weightKg / (h * h);
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return { label: 'Kurus', color: '#3B82F6' };
    if (bmi < 25.0) return { label: 'Normal', color: '#22C55E' };
    if (bmi < 27.0) return { label: 'Overweight', color: '#F59E0B' };
    return { label: 'Obesitas', color: '#EF4444' };
}

/**
 * Hitung BMR dengan Rumus Mifflin-St Jeor
 * Sumber: Mifflin & St Jeor (1990)
 */
function calcBMR(gender, weightKg, heightCm, age) {
    if (gender === 'pria') {
        return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    } else {
        return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }
}

/**
 * Hitung TDEE = BMR × Faktor Aktivitas
 */
const ACTIVITY_FACTORS = {
    sedentary: { label: 'Sedentary (jarang olahraga, kerja kantoran)', factor: 1.2 },
    light: { label: 'Lightly Active (olahraga ringan 1–3x/minggu)', factor: 1.375 },
    moderate: { label: 'Moderately Active (olahraga sedang 3–5x/minggu)', factor: 1.55 },
    active: { label: 'Very Active (olahraga berat 6–7x/minggu)', factor: 1.725 }
};

function calcTDEE(bmr, activityKey) {
    return bmr * (ACTIVITY_FACTORS[activityKey]?.factor || 1.2);
}

// ─────────────────────────────────────────
// LOCALSTORAGE
// ─────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
let isFoodLogExpanded = false; // default: collapsed (tersembunyi)

function toggleFoodLog() {
    isFoodLogExpanded = !isFoodLogExpanded;
    renderDailyLog();
}

// Daftarkan fungsi toggle ke global window
window.toggleFoodLog = toggleFoodLog;

function getProfile() {
    return JSON.parse(localStorage.getItem('sm_profile') || 'null');
}

function saveProfile(data) {
    localStorage.setItem('sm_profile', JSON.stringify(data));
}

function getFoodLog() {
    const raw = JSON.parse(localStorage.getItem('sm_log') || '{}');
    // Reset otomatis jika hari berbeda
    if (raw.date !== TODAY) return { date: TODAY, items: [] };
    return raw;
}

function saveFoodLog(log) {
    localStorage.setItem('sm_log', JSON.stringify({ ...log, date: TODAY }));
}

function addFoodToLog(name, calories, protein, fat, carbs, portion) {
    const log = getFoodLog();
    log.items.push({
        id: Date.now(),
        name, calories: Math.round(calories),
        protein: parseFloat(protein.toFixed(1)),
        fat: parseFloat(fat.toFixed(1)),
        carbs: parseFloat(carbs.toFixed(1)),
        portion,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });
    saveFoodLog(log);
    renderDailyLog();

    // Cek status kalori setelah penambahan & tampilkan toast
    const profile = getProfile();
    const tdee = profile
        ? Math.round(calcTDEE(calcBMR(profile.gender, profile.weight, profile.height, profile.age), profile.activity))
        : 2000;
    const totalCal = log.items.reduce((s, i) => s + i.calories, 0);
    const status   = getCalorieStatus(totalCal, tdee);
    if (status) showCalorieToast(status);
}


function removeFoodFromLog(id) {
    const log = getFoodLog();
    log.items = log.items.filter(i => i.id !== id);
    saveFoodLog(log);
    renderDailyLog();
}

// ─────────────────────────────────────────
// SISTEM PERINGATAN KALORI
// ─────────────────────────────────────────

/**
 * Menentukan status kalori berdasarkan total & target.
 * @returns {object|null} Status object atau null jika belum perlu peringatan
 */
function getCalorieStatus(totalCal, tdee) {
    const pct = (totalCal / tdee) * 100;
    if (pct >= 100) {
        return {
            level: 'exceeded',
            icon: '',
            title: 'Kalori Harian Terlampaui!',
            message: `Asupan kalorimu sudah melebihi target TDEE sebesar ${(totalCal - tdee).toLocaleString('id-ID')} kkal. Pertimbangkan untuk berhenti makan berat hari ini.`,
            color: '#EF4444',
            bg: '#FEF2F2'
        };
    }
    if (pct >= 90) {
        return {
            level: 'reaching',
            icon: '',
            title: 'Hampir Mencapai Batas Kalori',
            message: `Kalorimu sudah ${pct.toFixed(0)}% dari target. Sisa ${(tdee - totalCal).toLocaleString('id-ID')} kkal lagi — pilih makanan ringan selanjutnya.`,
            color: '#D97706',
            bg: '#FFFBEB'
        };
    }
    if (pct >= 80) {
        return {
            level: 'warning',
            icon: '',
            title: 'Sudah 80% Target Kalori',
            message: `Kamu sudah mengonsumsi ${pct.toFixed(0)}% dari kebutuhan harianmu. Tetap jaga porsi ya!`,
            color: '#F59E0B',
            bg: '#FEFCE8'
        };
    }
    return null; // Belum perlu peringatan
}

/**
 * Tampilkan toast notifikasi kalori di pojok layar.
 * Toast otomatis menghilang setelah 5 detik.
 */
function showCalorieToast(status) {
    // Hapus toast sebelumnya jika ada
    const existing = document.getElementById('calorie-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'calorie-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        max-width: 360px;
        background: ${status.bg};
        border: 2px solid ${status.color};
        border-radius: 16px;
        padding: 18px 22px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        z-index: 9999;
        display: flex;
        gap: 14px;
        align-items: flex-start;
        animation: toastSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
        font-family: inherit;
    `;
    toast.innerHTML = `
        <div style="flex:1;">
            <div style="font-weight:700;color:${status.color};margin-bottom:6px;font-size:1.1rem;">${status.title}</div>
            <div style="color:#374151;font-size:0.95rem;line-height:1.45;">${status.message}</div>
        </div>
        <button onclick="this.parentElement.remove()" style="
            background:none;border:none;cursor:pointer;font-size:1.3rem;
            color:${status.color};padding:0;line-height:1;flex-shrink:0;
        ">×</button>
    `;

    // Inject animasi CSS jika belum ada
    if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.textContent = `
            @keyframes toastSlideIn {
                from { opacity:0; transform: translateY(40px) scale(0.9); }
                to   { opacity:1; transform: translateY(0) scale(1); }
            }
            @keyframes toastFadeOut {
                from { opacity:1; transform: translateY(0); }
                to   { opacity:0; transform: translateY(20px); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Auto dismiss setelah 6 detik
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'toastFadeOut 0.4s ease forwards';
            setTimeout(() => toast.remove(), 400);
        }
    }, 6000);
}

// ─────────────────────────────────────────
// RENDER LOG HARIAN
// ─────────────────────────────────────────

function renderDailyLog() {
    const container = document.getElementById('daily-log-section');
    if (!container) return;

    const profile = getProfile();
    const log = getFoodLog();
    const tdee = profile ? Math.round(calcTDEE(calcBMR(profile.gender, profile.weight, profile.height, profile.age), profile.activity)) : 2000;

    const totalCal = log.items.reduce((s, i) => s + i.calories, 0);
    const totalProt = log.items.reduce((s, i) => s + i.protein, 0).toFixed(1);
    const totalFat = log.items.reduce((s, i) => s + i.fat, 0).toFixed(1);
    const totalCarb = log.items.reduce((s, i) => s + i.carbs, 0).toFixed(1);

    const pct = Math.min((totalCal / tdee) * 100, 100);
    const barColor = pct < 70 ? 'var(--accent)' : pct < 90 ? '#F59E0B' : '#EF4444';
    const remaining = tdee - totalCal;
    const isOver = remaining < 0;

    container.innerHTML = `
    <div class="tracker-card">
        <div class="tracker-header" style="display: flex; align-items: center; justify-content: space-between;">
            <span class="tracker-title" style="display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" style="flex-shrink:0;">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Log Kalori Harian
            </span>
            <span class="tracker-date">${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>

        <!-- Progress Kalori -->
        <div class="calorie-progress-wrap">
            <div class="calorie-numbers">
                <span class="cal-consumed">${totalCal.toLocaleString('id-ID')}<small>kkal</small></span>
                <span class="cal-sep">dari</span>
                <span class="cal-target">${tdee.toLocaleString('id-ID')}<small> kkal</small></span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width:${pct}%; background: ${isOver ? '#EF4444' : 'linear-gradient(90deg, var(--accent), #52B788)'};"></div>
            </div>
            <div class="calorie-footer" style="${isOver ? 'font-size: 1.05rem; margin-top: 12px; align-items: center;' : ''}">
                <span style="color:${isOver ? '#EF4444' : barColor}; font-weight:800; ${isOver ? 'font-size: 1.15rem;' : ''}">
                    ${isOver ? `Melebihi ${Math.abs(remaining).toLocaleString('id-ID')} kkal` : `Sisa: ${remaining.toLocaleString('id-ID')} kkal`}
                </span>
                <span style="color: var(--text-muted); font-weight: 700; ${isOver ? 'font-size: 1.05rem;' : ''}">${pct.toFixed(0)}%</span>
            </div>
        </div>

        <!-- Banner Peringatan Kalori Inline -->
        ${(() => {
            const status = getCalorieStatus(totalCal, tdee);
            if (!status || totalCal === 0) return '';
            const isExceeded = status.level === 'exceeded';
            return `
            <div class="calorie-warning-banner" style="
                background: ${status.bg};
                border: ${isExceeded ? '2.5px' : '1.5px'} solid ${status.color};
                border-radius: 14px;
                padding: ${isExceeded ? '18px 22px' : '14px 18px'};
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 14px;
                font-size: ${isExceeded ? '1.05rem' : '0.95rem'};
                box-shadow: ${isExceeded ? '0 4px 14px rgba(239, 68, 68, 0.15)' : 'none'};
            ">
                <div>
                    <div style="font-weight: 800; color: ${status.color}; font-size: ${isExceeded ? '1.25rem' : '1.1rem'}; margin-bottom: 6px;">${status.title}</div>
                    <div style="color: #27272A; line-height: 1.5; font-size: ${isExceeded ? '1.05rem' : '0.95rem'}; font-weight: ${isExceeded ? '600' : 'normal'};">${status.message}</div>
                </div>
            </div>`;
        })()}


        <div class="macro-summary">
            <div class="macro-item" style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981; display: inline-block; flex-shrink: 0;"></span>
                <span class="macro-val">${totalProt}g</span>
                <span class="macro-lbl">Protein</span>
            </div>
            <div class="macro-item" style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #F59E0B; display: inline-block; flex-shrink: 0;"></span>
                <span class="macro-val">${totalFat}g</span>
                <span class="macro-lbl">Lemak</span>
            </div>
            <div class="macro-item" style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #3B82F6; display: inline-block; flex-shrink: 0;"></span>
                <span class="macro-val">${totalCarb}g</span>
                <span class="macro-lbl">Karbo</span>
            </div>
        </div>

        <!-- Daftar Makanan -->
        <div class="food-log-list" style="margin-top: 16px;">
            ${log.items.length > 0 ? `
                <div class="log-list-header" onclick="toggleFoodLog()" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
                    <span style="font-weight: 700; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M3 12h18M12 2v3M8 2v3M16 2v3"></path>
                            <path d="M3 12a9 9 0 0 0 18 0H3z"></path>
                        </svg>
                        MAKANAN HARI INI (${log.items.length} ITEM)
                    </span>
                    <span style="font-size: 0.75rem; color: var(--text-light); background: #F0EFEC; padding: 4px 8px; border-radius: 99px;">
                        ${isFoodLogExpanded ? 'Sembunyikan ▲' : 'Tampilkan ▼'}
                    </span>
                </div>
            ` : ''}
            
            ${log.items.length === 0
            ? `<div class="log-empty">
                    Belum ada makanan yang dicatat hari ini.<br>
                    <small>Scan makanan lalu tekan <b>"Tambah ke Log"</b></small>
                  </div>`
            : `
                <div id="food-log-items-container" style="display: ${isFoodLogExpanded ? 'flex' : 'none'}; flex-direction: column; gap: 8px; margin-top: 10px;">
                    ${log.items.map(item => `
                        <div class="log-item" style="display: flex; align-items: center; gap: 12px;">
                            ${getFoodIconSvg(item.name, 18)}
                            <div class="log-item-info" style="flex:1;">
                                <span class="log-item-name">${item.name}</span>
                                <span class="log-item-meta">${item.portion} • ${item.time}</span>
                            </div>
                            <div class="log-item-right">
                                <span class="log-item-cal">${item.calories} kkal</span>
                                <button class="log-delete-btn" onclick="removeFoodFromLog(${item.id})" title="Hapus">×</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
              `}
        </div>
    </div>`;
}

// ─────────────────────────────────────────
// MODAL PROFIL / KALKULATOR
// ─────────────────────────────────────────

function openProfileModal() {
    const profile = getProfile();
    const modal = document.getElementById('profile-modal');
    const modalBox = modal.querySelector('.modal-box');
    
    // Reset modal ke mode 1-kolom saat pertama kali dibuka
    if (modalBox) modalBox.classList.remove('has-results');
    document.getElementById('pm-result').innerHTML = '';

    if (profile) {
        document.getElementById('pm-gender').value = profile.gender;
        document.getElementById('pm-age').value = profile.age;
        document.getElementById('pm-weight').value = profile.weight;
        document.getElementById('pm-height').value = profile.height;
        document.getElementById('pm-activity').value = profile.activity;
    }
    modal.style.display = 'flex';
}

function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

function saveProfileFromModal() {
    const gender = document.getElementById('pm-gender').value;
    const age = parseInt(document.getElementById('pm-age').value);
    const weight = parseFloat(document.getElementById('pm-weight').value);
    const height = parseFloat(document.getElementById('pm-height').value);
    const activity = document.getElementById('pm-activity').value;

    if (!age || !weight || !height || age < 10 || weight < 20 || height < 100) {
        alert('Mohon isi semua data dengan benar.');
        return;
    }

    const bmi = calcBMI(weight, height);
    const bmr = calcBMR(gender, weight, height, age);
    const tdee = calcTDEE(bmr, activity);
    const bmiCat = getBMICategory(bmi);

    saveProfile({ gender, age, weight, height, activity });
    checkProfileBanner(); // sembunyikan banner setelah profil tersimpan

    // Tambahkan class has-results untuk memicu transisi pelebaran modal
    const modalBox = document.querySelector('#profile-modal .modal-box');
    if (modalBox) modalBox.classList.add('has-results');

    // Tampilkan hasil dengan card layout premium
    document.getElementById('pm-result').innerHTML = `
        <div class="calc-result-box">
            <div class="calc-result-cards">
                <div class="calc-card">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-bottom: 8px; opacity: 0.85;">
                        <path d="M12 3v19M5 12h14M5 12a3 3 0 0 1-3-3m0 0a3 3 0 0 1 3-3m0 6a3 3 0 0 0-3-3m0 0a3 3 0 0 0 3-3M19 12a3 3 0 0 1 3-3m0 0a3 3 0 0 1-3-3m0 6a3 3 0 0 0 3-3m0 0a3 3 0 0 0-3-3"></path>
                    </svg>
                    <span class="calc-card-label">BMI</span>
                    <span class="calc-card-value" style="color:${bmiCat.color};">${bmi.toFixed(1)}</span>
                    <span class="calc-card-sub" style="color:${bmiCat.color}; font-weight:600;">${bmiCat.label}</span>
                </div>
                <div class="calc-card">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-bottom: 8px; opacity: 0.85;">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                    </svg>
                    <span class="calc-card-label">BMR (Basal)</span>
                    <span class="calc-card-value">${Math.round(bmr).toLocaleString('id-ID')}</span>
                    <span class="calc-card-sub">kkal/hari</span>
                </div>
                <div class="calc-card calc-card-tdee">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-bottom: 10px; opacity: 0.95;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                    </svg>
                    <span class="calc-card-label">Target Kalori Harianmu (TDEE)</span>
                    <span class="calc-card-value">${Math.round(tdee).toLocaleString('id-ID')} <small style="font-size:1rem;">kkal</small></span>
                    <span class="calc-card-sub">Berdasarkan aktivitas & metabolismemu</span>
                </div>
            </div>
            <button class="btn-save-profile" onclick="closeProfileModal(); renderDailyLog();">
                Gunakan Target Ini
            </button>
        </div>
    `;
}

// ─────────────────────────────────────────
// INIT SAAT HALAMAN LOAD
// ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    renderDailyLog();
});

// Expose ke global scope
window.addFoodToLog = addFoodToLog;
window.removeFoodFromLog = removeFoodFromLog;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.saveProfileFromModal = saveProfileFromModal;
window.renderDailyLog = renderDailyLog;

// ─────────────────────────────────────────
// BANNER SETUP PROFIL
// ─────────────────────────────────────────

function checkProfileBanner() {
    const banner = document.getElementById('profile-setup-banner');
    if (!banner) return;
    const hasProfile = !!getProfile();
    banner.style.display = hasProfile ? 'none' : 'flex';
}

window.checkProfileBanner = checkProfileBanner;

// Panggil langsung — DOM sudah siap karena script ini ada di bottom of body
checkProfileBanner();
