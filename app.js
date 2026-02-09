// ==========================================
// VINCITORE 98 MOBILE - APP.JS v2.0
// Con Cloud Backend + Stampa
// ==========================================

// CONFIGURAZIONE CLOUD
const CLOUD_CONFIG = {
    enabled: true,
    endpoint: 'https://vincitore98.YOUR_WORKER.workers.dev/elaborate',
    threshold: 10000, // Oltre 10K combinazioni → Cloud
    timeout: 300000 // 5 minuti timeout
};

// STATE GLOBALE
const state = {
    selectedNumbers: new Set(),
    maxNumbers: 90, // ✅ AUMENTATO DA 10 A 90
    sviluppo: 4,
    garanzia: 2,
    importi: {
        estratto: 0,
        ambo: 0.5,
        terno: 0.5,
        quaterna: 1
    },
    risultati: null,
    useCloud: false
};

// DOM ELEMENTS
let elements = {};

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App v2.0 inizializzata');
    
    // Cache elementi DOM
    elements = {
        numbersGrid: document.getElementById('numbersGrid'),
        numCount: document.getElementById('numCount'),
        bolletteCount: document.getElementById('bolletteCount'),
        costTotal: document.getElementById('costTotal'),
        elaborateBtn: document.getElementById('elaborateBtn'),
        printBtn: document.getElementById('printBtn'),
        progressContainer: document.getElementById('progressContainer'),
        progressFill: document.getElementById('progressFill'),
        progressText: document.getElementById('progressText'),
        resultsSection: document.getElementById('resultsSection'),
        bolletteContainer: document.getElementById('bolletteContainer'),
        sviluppoSelect: document.getElementById('sviluppo'),
        garanziaSelect: document.getElementById('garanzia'),
        guaranteeBadge: document.getElementById('guaranteeBadge'),
        modeBadge: document.getElementById('modeBadge'),
        toast: document.getElementById('toast'),
        
        // Importi
        importoEstratto: document.getElementById('importoEstratto'),
        importoAmbo: document.getElementById('importoAmbo'),
        importoTerno: document.getElementById('importoTerno'),
        importoQuaterna: document.getElementById('importoQuaterna'),
        
        // Filtri
        filterPari: document.getElementById('filterPari'),
        filterDispari: document.getElementById('filterDispari'),
        filter1_45: document.getElementById('filter1_45'),
        filter46_90: document.getElementById('filter46_90'),
        resetBtn: document.getElementById('resetBtn'),
        
        // Risultati
        resultBollette: document.getElementById('resultBollette'),
        resultTime: document.getElementById('resultTime'),
        resultGaranzia: document.getElementById('resultGaranzia'),
        resultCosto: document.getElementById('resultCosto'),
        resultMode: document.getElementById('resultMode')
    };
    
    // Genera griglia numeri
    generateNumbersGrid();
    
    // Event listeners
    setupEventListeners();
    
    // Carica stato salvato
    loadState();
    
    // Update UI iniziale
    updateStats();
    validateGaranzia();
    
    console.log('✅ Setup completato');
});

// ==========================================
// GENERA GRIGLIA NUMERI
// ==========================================
function generateNumbersGrid() {
    const grid = elements.numbersGrid;
    grid.innerHTML = '';
    
    for (let i = 1; i <= 90; i++) {
        const btn = document.createElement('button');
        btn.className = 'number-btn';
        btn.textContent = i;
        btn.dataset.number = i;
        
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            toggleNumber(i, btn);
        });
        
        btn.addEventListener('click', (e) => {
            if (e.detail === 0) return;
            toggleNumber(i, btn);
        });
        
        grid.appendChild(btn);
    }
    
    console.log('✅ Griglia 90 numeri creata');
}

// ==========================================
// TOGGLE NUMERO
// ==========================================
function toggleNumber(num, btn) {
    if (state.selectedNumbers.has(num)) {
        state.selectedNumbers.delete(num);
        btn.classList.remove('selected');
    } else {
        if (state.selectedNumbers.size >= state.maxNumbers) {
            showToast(`Massimo ${state.maxNumbers} numeri!`, 'error');
            return;
        }
        state.selectedNumbers.add(num);
        btn.classList.add('selected');
    }
    
    updateStats();
    saveState();
}

// ==========================================
// SETUP EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    
    // PULSANTE ELABORA
    elements.elaborateBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        elaboraSistema();
    });
    
    elements.elaborateBtn.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        elaboraSistema();
    });
    
    // PULSANTE STAMPA
    elements.printBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        stampaBollette();
    });
    
    elements.printBtn.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        stampaBollette();
    });
    
    // FILTRI
    elements.filterPari.addEventListener('touchend', (e) => {
        e.preventDefault();
        toggleFilterPari();
    });
    elements.filterPari.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        toggleFilterPari();
    });
    
    elements.filterDispari.addEventListener('touchend', (e) => {
        e.preventDefault();
        toggleFilterDispari();
    });
    elements.filterDispari.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        toggleFilterDispari();
    });
    
    elements.filter1_45.addEventListener('touchend', (e) => {
        e.preventDefault();
        toggleFilter1_45();
    });
    elements.filter1_45.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        toggleFilter1_45();
    });
    
    elements.filter46_90.addEventListener('touchend', (e) => {
        e.preventDefault();
        toggleFilter46_90();
    });
    elements.filter46_90.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        toggleFilter46_90();
    });
    
    // RESET
    elements.resetBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        resetAll();
    });
    elements.resetBtn.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        resetAll();
    });
    
    // CONFIGURAZIONE
    elements.sviluppoSelect.addEventListener('change', () => {
        state.sviluppo = parseInt(elements.sviluppoSelect.value);
        validateGaranzia();
        updateStats();
        saveState();
    });
    
    elements.garanziaSelect.addEventListener('change', () => {
        state.garanzia = parseInt(elements.garanziaSelect.value);
        validateGaranzia();
        updateStats();
        saveState();
    });
    
    // IMPORTI
    [elements.importoEstratto, elements.importoAmbo, elements.importoTerno, elements.importoQuaterna].forEach(input => {
        input.addEventListener('input', () => {
            state.importi = {
                estratto: parseFloat(elements.importoEstratto.value) || 0,
                ambo: parseFloat(elements.importoAmbo.value) || 0,
                terno: parseFloat(elements.importoTerno.value) || 0,
                quaterna: parseFloat(elements.importoQuaterna.value) || 0
            };
            updateStats();
            saveState();
        });
    });
    
    console.log('✅ Event listeners attivati');
}

// ==========================================
// FILTRI (Identici precedenti)
// ==========================================
function toggleFilterPari() {
    const pariNums = [];
    for (let i = 2; i <= 90; i += 2) pariNums.push(i);
    
    const btn = elements.filterPari;
    const isActive = btn.classList.contains('active');
    
    if (isActive) {
        pariNums.forEach(num => {
            state.selectedNumbers.delete(num);
            const btn = document.querySelector(`[data-number="${num}"]`);
            if (btn) btn.classList.remove('selected');
        });
        btn.classList.remove('active');
    } else {
        pariNums.forEach(num => {
            if (state.selectedNumbers.size < state.maxNumbers) {
                state.selectedNumbers.add(num);
                const btn = document.querySelector(`[data-number="${num}"]`);
                if (btn) btn.classList.add('selected');
            }
        });
        btn.classList.add('active');
    }
    
    updateStats();
    saveState();
}

function toggleFilterDispari() {
    const dispariNums = [];
    for (let i = 1; i <= 90; i += 2) dispariNums.push(i);
    
    const btn = elements.filterDispari;
    const isActive = btn.classList.contains('active');
    
    if (isActive) {
        dispariNums.forEach(num => {
            state.selectedNumbers.delete(num);
            const btn = document.querySelector(`[data-number="${num}"]`);
            if (btn) btn.classList.remove('selected');
        });
        btn.classList.remove('active');
    } else {
        dispariNums.forEach(num => {
            if (state.selectedNumbers.size < state.maxNumbers) {
                state.selectedNumbers.add(num);
                const btn = document.querySelector(`[data-number="${num}"]`);
                if (btn) btn.classList.add('selected');
            }
        });
        btn.classList.add('active');
    }
    
    updateStats();
    saveState();
}

function toggleFilter1_45() {
    const nums = [];
    for (let i = 1; i <= 45; i++) nums.push(i);
    
    const btn = elements.filter1_45;
    const isActive = btn.classList.contains('active');
    
    if (isActive) {
        nums.forEach(num => {
            state.selectedNumbers.delete(num);
            const btn = document.querySelector(`[data-number="${num}"]`);
            if (btn) btn.classList.remove('selected');
        });
        btn.classList.remove('active');
    } else {
        nums.forEach(num => {
            if (state.selectedNumbers.size < state.maxNumbers) {
                state.selectedNumbers.add(num);
                const btn = document.querySelector(`[data-number="${num}"]`);
                if (btn) btn.classList.add('selected');
            }
        });
        btn.classList.add('active');
    }
    
    updateStats();
    saveState();
}

function toggleFilter46_90() {
    const nums = [];
    for (let i = 46; i <= 90; i++) nums.push(i);
    
    const btn = elements.filter46_90;
    const isActive = btn.classList.contains('active');
    
    if (isActive) {
        nums.forEach(num => {
            state.selectedNumbers.delete(num);
            const btn = document.querySelector(`[data-number="${num}"]`);
            if (btn) btn.classList.remove('selected');
        });
        btn.classList.remove('active');
    } else {
        nums.forEach(num => {
            if (state.selectedNumbers.size < state.maxNumbers) {
                state.selectedNumbers.add(num);
                const btn = document.querySelector(`[data-number="${num}"]`);
                if (btn) btn.classList.add('selected');
            }
        });
        btn.classList.add('active');
    }
    
    updateStats();
    saveState();
}

function resetAll() {
    state.selectedNumbers.clear();
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    elements.resultsSection.style.display = 'none';
    elements.printBtn.style.display = 'none';
    updateStats();
    saveState();
    showToast('Reset completato!', 'success');
}

// ==========================================
// ELABORA SISTEMA (CON AUTO-SWITCH CLOUD)
// ==========================================
async function elaboraSistema() {
    console.log('🎯 ELABORA CLICCATO!');
    
    // Validazione
    if (state.selectedNumbers.size < state.garanzia) {
        showToast(`Serve almeno ${state.garanzia} numeri per questa garanzia!`, 'error');
        return;
    }
    
    if (state.garanzia > state.sviluppo) {
        showToast('Garanzia non può essere > Sviluppo!', 'error');
        return;
    }
    
    // Calcola complessità
    const n = state.selectedNumbers.size;
    const m = state.garanzia;
    const combinations = comb(n, m);
    
    // Decidi: Locale o Cloud?
    state.useCloud = CLOUD_CONFIG.enabled && combinations > CLOUD_CONFIG.threshold;
    
    if (state.useCloud) {
        console.log(`☁️ MODALITÀ CLOUD (${combinations.toLocaleString()} combinazioni)`);
        elements.modeBadge.textContent = '☁️ Cloud';
        elements.modeBadge.className = 'mode-badge cloud';
        await elaboraCloud();
    } else {
        console.log(`📱 MODALITÀ LOCALE (${combinations.toLocaleString()} combinazioni)`);
        elements.modeBadge.textContent = '📱 Locale';
        elements.modeBadge.className = 'mode-badge local';
        await elaboraLocale();
    }
}

// ==========================================
// ELABORAZIONE LOCALE
// ==========================================
async function elaboraLocale() {
    elements.elaborateBtn.disabled = true;
    elements.elaborateBtn.innerHTML = '⏳ Elaborazione... <span class="spinner"></span>';
    elements.progressContainer.style.display = 'block';
    elements.resultsSection.style.display = 'none';
    elements.printBtn.style.display = 'none';
    
    const numeri = Array.from(state.selectedNumbers).sort((a, b) => a - b);
    
    const progressCallback = (progress) => {
        const percent = Math.round(progress * 100);
        elements.progressFill.style.width = `${percent}%`;
        elements.progressFill.textContent = `${percent}%`;
        elements.progressText.textContent = percent < 100 ? 'Elaborazione in corso...' : 'Finalizzazione...';
    };
    
    try {
        const startTime = performance.now();
        
        const bollette = await greedySetCover(
            numeri,
            state.sviluppo,
            state.garanzia,
            progressCallback
        );
        
        const endTime = performance.now();
        const timeElapsed = ((endTime - startTime) / 1000).toFixed(2);
        
        state.risultati = {
            bollette: bollette,
            tempo: timeElapsed,
            numBollette: bollette.length,
            mode: 'locale'
        };
        
        displayResults();
        showToast('✅ Sistema elaborato!', 'success');
        
    } catch (error) {
        console.error('❌ Errore elaborazione:', error);
        showToast('Errore durante elaborazione!', 'error');
    } finally {
        elements.elaborateBtn.disabled = false;
        elements.elaborateBtn.textContent = '⚙️ ELABORA SISTEMA';
        elements.progressContainer.style.display = 'none';
    }
}

// ==========================================
// ELABORAZIONE CLOUD
// ==========================================
async function elaboraCloud() {
    elements.elaborateBtn.disabled = true;
    elements.elaborateBtn.innerHTML = '☁️ Elaborazione Cloud... <span class="spinner"></span>';
    elements.progressContainer.style.display = 'block';
    elements.progressText.textContent = 'Connessione al server...';
    elements.resultsSection.style.display = 'none';
    elements.printBtn.style.display = 'none';
    
    const numeri = Array.from(state.selectedNumbers).sort((a, b) => a - b);
    
    try {
        const startTime = performance.now();
        
        // Simulazione progress (non abbiamo streaming reale)
        const progressInterval = setInterval(() => {
            const currentProgress = parseInt(elements.progressFill.style.width) || 0;
            if (currentProgress < 90) {
                const newProgress = currentProgress + Math.random() * 5;
                elements.progressFill.style.width = `${newProgress}%`;
                elements.progressFill.textContent = `${Math.round(newProgress)}%`;
            }
        }, 500);
        
        elements.progressText.textContent = 'Elaborazione server in corso...';
        
        // Chiamata API Cloud
        const response = await fetch(CLOUD_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                numeri: numeri,
                k: state.sviluppo,
                m: state.garanzia
            }),
            signal: AbortSignal.timeout(CLOUD_CONFIG.timeout)
        });
        
        clearInterval(progressInterval);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        const endTime = performance.now();
        const timeElapsed = ((endTime - startTime) / 1000).toFixed(2);
        
        state.risultati = {
            bollette: data.bollette,
            tempo: timeElapsed,
            numBollette: data.bollette.length,
            mode: 'cloud'
        };
        
        displayResults();
        showToast('✅ Sistema elaborato su cloud!', 'success');
        
    } catch (error) {
        console.error('❌ Errore cloud:', error);
        
        if (error.name === 'AbortError') {
            showToast('Timeout: prova con meno numeri', 'error');
        } else {
            showToast('Errore cloud: fallback a locale...', 'info');
            // Fallback: prova locale
            await elaboraLocale();
            return;
        }
    } finally {
        elements.elaborateBtn.disabled = false;
        elements.elaborateBtn.textContent = '⚙️ ELABORA SISTEMA';
        elements.progressContainer.style.display = 'none';
        elements.progressFill.style.width = '0%';
    }
}

// ==========================================
// DISPLAY RISULTATI
// ==========================================
function displayResults() {
    const { bollette, tempo, numBollette, mode } = state.risultati;
    
    const costo = calcolaCosto(bollette);
    
    elements.resultBollette.textContent = numBollette;
    elements.resultTime.textContent = `${tempo}s`;
    elements.resultGaranzia.textContent = `${state.garanzia} su ${state.sviluppo}`;
    elements.resultCosto.textContent = `€${costo.toFixed(2)}`;
    elements.resultMode.textContent = mode === 'cloud' ? '☁️ Cloud' : '📱 Locale';
    
    // Mostra bollette
    elements.bolletteContainer.innerHTML = '';
    bollette.forEach((bolletta, idx) => {
        const div = document.createElement('div');
        div.className = 'bolletta';
        
        const header = document.createElement('div');
        header.className = 'bolletta-header';
        header.textContent = `Bolletta ${idx + 1}`;
        
        const numbers = document.createElement('div');
        numbers.className = 'bolletta-numbers';
        
        bolletta.forEach(num => {
            const span = document.createElement('span');
            span.className = 'bolletta-number';
            span.textContent = num;
            numbers.appendChild(span);
        });
        
        div.appendChild(header);
        div.appendChild(numbers);
        elements.bolletteContainer.appendChild(div);
    });
    
    // Mostra sezione
    elements.resultsSection.style.display = 'block';
    elements.printBtn.style.display = 'block';
    
    // Scroll verso risultati
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Update stats header
    elements.bolletteCount.textContent = numBollette;
    elements.costTotal.textContent = `€${costo.toFixed(2)}`;
}

// ==========================================
// STAMPA BOLLETTE
// ==========================================
function stampaBollette() {
    console.log('🖨️ Stampa richiesta');
    
    if (!state.risultati) {
        showToast('Nessun risultato da stampare!', 'error');
        return;
    }
    
    const { bollette } = state.risultati;
    const numeri = Array.from(state.selectedNumbers).sort((a, b) => a - b);
    
    // Crea pagina stampabile
    const printWindow = window.open('', '_blank');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Vincitore 98 - Bollette</title>
    <style>
        @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
        }
        
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .header h1 {
            margin: 0;
            color: #1a1a2e;
        }
        
        .info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
        }
        
        .numeri-selezionati {
            background: #e3f2fd;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        .numeri-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        
        .numero-badge {
            background: #2196F3;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-weight: bold;
        }
        
        .bolletta {
            background: #fff;
            border: 1px solid #ddd;
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
            page-break-inside: avoid;
        }
        
        .bolletta-header {
            font-weight: bold;
            color: #1a1a2e;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .bolletta-numbers {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .bolletta-number {
            background: #667eea;
            color: white;
            padding: 8px 15px;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            min-width: 40px;
            text-align: center;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        
        .no-print {
            text-align: center;
            margin: 20px 0;
        }
        
        .print-btn {
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
        }
        
        .print-btn:hover {
            background: #45a049;
        }
        
        @media print {
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Vincitore 98 Mobile</h1>
        <p>Sistema Ridotto Lotto</p>
    </div>
    
    <div class="info">
        <div class="info-row">
            <strong>Data:</strong>
            <span>${new Date().toLocaleDateString('it-IT')}</span>
        </div>
        <div class="info-row">
            <strong>Sviluppo:</strong>
            <span>${state.sviluppo === 2 ? 'Ambi' : state.sviluppo === 3 ? 'Terni' : state.sviluppo === 4 ? 'Quaterne' : 'Cinquine'} (k=${state.sviluppo})</span>
        </div>
        <div class="info-row">
            <strong>Garanzia:</strong>
            <span>${state.garanzia === 1 ? 'Estratto' : state.garanzia === 2 ? 'Ambo' : state.garanzia === 3 ? 'Terno' : 'Quaterna'} (m=${state.garanzia})</span>
        </div>
        <div class="info-row">
            <strong>Bollette totali:</strong>
            <span>${bollette.length}</span>
        </div>
        <div class="info-row">
            <strong>Costo totale:</strong>
            <span>€${calcolaCosto(bollette).toFixed(2)}</span>
        </div>
    </div>
    
    <div class="numeri-selezionati">
        <strong>Numeri selezionati (${numeri.length}):</strong>
        <div class="numeri-list">
            ${numeri.map(n => `<span class="numero-badge">${n}</span>`).join('')}
        </div>
    </div>
    
    <div class="no-print">
        <button class="print-btn" onclick="window.print()">🖨️ STAMPA</button>
    </div>
    
    <h2 style="margin-top: 30px;">Bollette (${bollette.length})</h2>
    
    ${bollette.map((bolletta, idx) => `
        <div class="bolletta">
            <div class="bolletta-header">Bolletta ${idx + 1}</div>
            <div class="bolletta-numbers">
                ${bolletta.map(num => `<span class="bolletta-number">${num}</span>`).join('')}
            </div>
        </div>
    `).join('')}
    
    <div class="footer">
        <p>Generato da Vincitore 98 Mobile</p>
        <p>Garanzia matematica certificata al 100%</p>
        <p style="font-size: 10px; margin-top: 10px;">
            Gioca responsabilmente. Il sistema garantisce la copertura matematica ma non può prevedere i numeri estratti.
        </p>
    </div>
</body>
</html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    showToast('✅ Pagina stampa aperta!', 'success');
}

// ==========================================
// CALCOLA COSTO
// ==========================================
function calcolaCosto(bollette) {
    const k = state.sviluppo;
    let costo = 0;
    
    bollette.forEach(() => {
        costo += k * state.importi.estratto;
        if (k >= 2) costo += (k * (k - 1)) / 2 * state.importi.ambo;
        if (k >= 3) costo += (k * (k - 1) * (k - 2)) / 6 * state.importi.terno;
        if (k >= 4) costo += (k * (k - 1) * (k - 2) * (k - 3)) / 24 * state.importi.quaterna;
    });
    
    return costo;
}

// ==========================================
// UPDATE STATS
// ==========================================
function updateStats() {
    elements.numCount.textContent = state.selectedNumbers.size;
    
    const n = state.selectedNumbers.size;
    const k = state.sviluppo;
    const m = state.garanzia;
    
    let stimaBollette = 0;
    if (n >= m && m <= k) {
        stimaBollette = Math.ceil(comb(n, m) / comb(k, m));
    }
    
    if (state.risultati) {
        elements.bolletteCount.textContent = state.risultati.numBollette;
        const costo = calcolaCosto(state.risultati.bollette);
        elements.costTotal.textContent = `€${costo.toFixed(2)}`;
    } else {
        elements.bolletteCount.textContent = stimaBollette > 0 ? `~${stimaBollette}` : '0';
        elements.costTotal.textContent = '€0';
    }
}

// ==========================================
// VALIDA GARANZIA
// ==========================================
function validateGaranzia() {
    const badge = elements.guaranteeBadge;
    
    if (state.garanzia > state.sviluppo) {
        badge.textContent = '✗ Non valida';
        badge.classList.add('invalid');
        elements.elaborateBtn.disabled = true;
    } else {
        badge.textContent = '✓ Valida';
        badge.classList.remove('invalid');
        elements.elaborateBtn.disabled = false;
    }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'success') {
    const toast = elements.toast;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==========================================
// UTILITY: COMBINAZIONI
// ==========================================
function comb(n, k) {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;
    
    let result = 1;
    for (let i = 0; i < k; i++) {
        result *= (n - i);
        result /= (i + 1);
    }
    return Math.round(result);
}

// ==========================================
// SALVATAGGIO/CARICAMENTO STATO
// ==========================================
function saveState() {
    try {
        const data = {
            selectedNumbers: Array.from(state.selectedNumbers),
            sviluppo: state.sviluppo,
            garanzia: state.garanzia,
            importi: state.importi
        };
        localStorage.setItem('vincitore98_state', JSON.stringify(data));
    } catch (e) {
        console.error('Errore salvataggio:', e);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('vincitore98_state');
        if (saved) {
            const data = JSON.parse(saved);
            
            data.selectedNumbers.forEach(num => {
                state.selectedNumbers.add(num);
                const btn = document.querySelector(`[data-number="${num}"]`);
                if (btn) btn.classList.add('selected');
            });
            
            state.sviluppo = data.sviluppo || 4;
            state.garanzia = data.garanzia || 2;
            state.importi = data.importi || state.importi;
            
            elements.sviluppoSelect.value = state.sviluppo;
            elements.garanziaSelect.value = state.garanzia;
            elements.importoEstratto.value = state.importi.estratto;
            elements.importoAmbo.value = state.importi.ambo;
            elements.importoTerno.value = state.importi.terno;
            elements.importoQuaterna.value = state.importi.quaterna;
            
            console.log('📂 Stato caricato');
        }
    } catch (e) {
        console.error('Errore caricamento:', e);
    }
}

console.log('✅ app.js v2.0 caricato');


// ==========================================
// DEBUG
// ==========================================
console.log('✅ app.js caricato correttamente');
