// ==========================================
// VINCITORE 98 MOBILE - APP.JS
// Versione corretta per touch mobile
// ==========================================

// STATE GLOBALE
const state = {
    selectedNumbers: new Set(),
    maxNumbers: 10,
    sviluppo: 4,
    garanzia: 2,
    importi: {
        estratto: 0,
        ambo: 0.5,
        terno: 0.5,
        quaterna: 1
    },
    risultati: null
};

// DOM ELEMENTS
let elements = {};

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App inizializzata');
    
    // Cache elementi DOM
    elements = {
        numbersGrid: document.getElementById('numbersGrid'),
        numCount: document.getElementById('numCount'),
        bolletteCount: document.getElementById('bolletteCount'),
        costTotal: document.getElementById('costTotal'),
        elaborateBtn: document.getElementById('elaborateBtn'),
        progressContainer: document.getElementById('progressContainer'),
        progressFill: document.getElementById('progressFill'),
        resultsSection: document.getElementById('resultsSection'),
        bolletteContainer: document.getElementById('bolletteContainer'),
        sviluppoSelect: document.getElementById('sviluppo'),
        garanziaSelect: document.getElementById('garanzia'),
        guaranteeBadge: document.getElementById('guaranteeBadge'),
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
        resultCosto: document.getElementById('resultCosto')
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
        
        // IMPORTANTE: Usa touchend per mobile (più reattivo di click)
        btn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Previene doppio click
            toggleNumber(i, btn);
        });
        
        // Fallback per desktop
        btn.addEventListener('click', (e) => {
            if (e.detail === 0) return; // Ignora se già gestito da touch
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
        // Deseleziona
        state.selectedNumbers.delete(num);
        btn.classList.remove('selected');
        console.log(`➖ Rimosso: ${num}`);
    } else {
        // Seleziona (se non superato limite)
        if (state.selectedNumbers.size >= state.maxNumbers) {
            showToast(`Massimo ${state.maxNumbers} numeri!`, 'error');
            return;
        }
        state.selectedNumbers.add(num);
        btn.classList.add('selected');
        console.log(`➕ Aggiunto: ${num}`);
    }
    
    updateStats();
    saveState();
}

// ==========================================
// SETUP EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    
    // PULSANTE ELABORA (CRITICAL FIX!)
    elements.elaborateBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        elaboraSistema();
    });
    
    elements.elaborateBtn.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        elaboraSistema();
    });
    
    // FILTRI (FIX: Logica corretta identica a Python)
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
        saveState();
        console.log(`Sviluppo: ${state.sviluppo}`);
    });
    
    elements.garanziaSelect.addEventListener('change', () => {
        state.garanzia = parseInt(elements.garanziaSelect.value);
        validateGaranzia();
        saveState();
        console.log(`Garanzia: ${state.garanzia}`);
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
// FILTRI (LOGICA CORRETTA - IDENTICA PYTHON)
// ==========================================
function toggleFilterPari() {
    const pariNums = [];
    for (let i = 2; i <= 90; i += 2) pariNums.push(i);
    
    const btn = elements.filterPari;
    const isActive = btn.classList.contains('active');
    
    if (isActive) {
        // Deseleziona tutti i pari
        pariNums.forEach(num => {
            state.selectedNumbers.delete(num);
            const btn = document.querySelector(`[data-number="${num}"]`);
            if (btn) btn.classList.remove('selected');
        });
        btn.classList.remove('active');
        console.log('➖ Deselezionati pari');
    } else {
        // Seleziona pari disponibili (max 10 totali)
        pariNums.forEach(num => {
            if (state.selectedNumbers.size < state.maxNumbers) {
                state.selectedNumbers.add(num);
                const btn = document.querySelector(`[data-number="${num}"]`);
                if (btn) btn.classList.add('selected');
            }
        });
        btn.classList.add('active');
        console.log('➕ Selezionati pari');
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
        console.log('➖ Deselezionati dispari');
    } else {
        dispariNums.forEach(num => {
            if (state.selectedNumbers.size < state.maxNumbers) {
                state.selectedNumbers.add(num);
                const btn = document.querySelector(`[data-number="${num}"]`);
                if (btn) btn.classList.add('selected');
            }
        });
        btn.classList.add('active');
        console.log('➕ Selezionati dispari');
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
        console.log('➖ Deselezionati 1-45');
    } else {
        nums.forEach(num => {
            if (state.selectedNumbers.size < state.maxNumbers) {
                state.selectedNumbers.add(num);
                const btn = document.querySelector(`[data-number="${num}"]`);
                if (btn) btn.classList.add('selected');
            }
        });
        btn.classList.add('active');
        console.log('➕ Selezionati 1-45');
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
        console.log('➖ Deselezionati 46-90');
    } else {
        nums.forEach(num => {
            if (state.selectedNumbers.size < state.maxNumbers) {
                state.selectedNumbers.add(num);
                const btn = document.querySelector(`[data-number="${num}"]`);
                if (btn) btn.classList.add('selected');
            }
        });
        btn.classList.add('active');
        console.log('➕ Selezionati 46-90');
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
    updateStats();
    saveState();
    showToast('Reset completato!', 'success');
    console.log('🔄 Reset totale');
}

// ==========================================
// ELABORA SISTEMA
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
    
    // UI: Disabilita pulsante
    elements.elaborateBtn.disabled = true;
    elements.elaborateBtn.textContent = '⏳ Elaborazione...';
    elements.progressContainer.style.display = 'block';
    elements.resultsSection.style.display = 'none';
    
    console.log(`Numeri: ${Array.from(state.selectedNumbers).sort((a,b) => a-b)}`);
    console.log(`k=${state.sviluppo}, m=${state.garanzia}`);
    
    // Converti Set a Array
    const numeri = Array.from(state.selectedNumbers).sort((a, b) => a - b);
    
    // Callback progresso
    const progressCallback = (progress) => {
        const percent = Math.round(progress * 100);
        elements.progressFill.style.width = `${percent}%`;
        elements.progressFill.textContent = `${percent}%`;
    };
    
    try {
        const startTime = performance.now();
        
        // CHIAMATA ALGORITMO (da greedy.js)
        console.log('Chiamando greedySetCover...');
        const bollette = await greedySetCover(
            numeri,
            state.sviluppo,
            state.garanzia,
            progressCallback
        );
        
        const endTime = performance.now();
        const timeElapsed = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`✅ Elaborazione completata: ${bollette.length} bollette in ${timeElapsed}s`);
        
        // Salva risultati
        state.risultati = {
            bollette: bollette,
            tempo: timeElapsed,
            numBollette: bollette.length
        };
        
        // Mostra risultati
        displayResults();
        
        showToast('✅ Sistema elaborato!', 'success');
        
    } catch (error) {
        console.error('❌ Errore elaborazione:', error);
        showToast('Errore durante elaborazione!', 'error');
    } finally {
        // Ripristina UI
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
    const { bollette, tempo, numBollette } = state.risultati;
    
    // Calcola costo
    const costo = calcolaCosto(bollette);
    
    // Update summary
    elements.resultBollette.textContent = numBollette;
    elements.resultTime.textContent = `${tempo}s`;
    elements.resultGaranzia.textContent = `${state.garanzia} su ${state.sviluppo}`;
    elements.resultCosto.textContent = `€${costo.toFixed(2)}`;
    
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
    
    // Scroll verso risultati
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Update stats header
    elements.bolletteCount.textContent = numBollette;
    elements.costTotal.textContent = `€${costo.toFixed(2)}`;
}

// ==========================================
// CALCOLA COSTO
// ==========================================
function calcolaCosto(bollette) {
    const k = state.sviluppo;
    let costo = 0;
    
    bollette.forEach(bolletta => {
        // Estratti: k
        costo += k * state.importi.estratto;
        
        // Ambi: C(k,2)
        if (k >= 2) {
            const ambi = (k * (k - 1)) / 2;
            costo += ambi * state.importi.ambo;
        }
        
        // Terni: C(k,3)
        if (k >= 3) {
            const terni = (k * (k - 1) * (k - 2)) / 6;
            costo += terni * state.importi.terno;
        }
        
        // Quaterne: C(k,4)
        if (k >= 4) {
            const quaterne = (k * (k - 1) * (k - 2) * (k - 3)) / 24;
            costo += quaterne * state.importi.quaterna;
        }
    });
    
    return costo;
}

// ==========================================
// UPDATE STATS
// ==========================================
function updateStats() {
    elements.numCount.textContent = state.selectedNumbers.size;
    
    // Stima bollette (approssimativa)
    const n = state.selectedNumbers.size;
    const k = state.sviluppo;
    const m = state.garanzia;
    
    let stimaBollette = 0;
    if (n >= m && m <= k) {
        // Formula approssimativa: C(n,m) / C(k,m)
        stimaBollette = Math.ceil(combinazioni(n, m) / combinazioni(k, m));
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
function combinazioni(n, k) {
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
        console.log('💾 Stato salvato');
    } catch (e) {
        console.error('Errore salvataggio:', e);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('vincitore98_state');
        if (saved) {
            const data = JSON.parse(saved);
            
            // Ripristina numeri
            data.selectedNumbers.forEach(num => {
                state.selectedNumbers.add(num);
                const btn = document.querySelector(`[data-number="${num}"]`);
                if (btn) btn.classList.add('selected');
            });
            
            // Ripristina config
            state.sviluppo = data.sviluppo || 4;
            state.garanzia = data.garanzia || 2;
            state.importi = data.importi || state.importi;
            
            // Update UI
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

// ==========================================
// DEBUG
// ==========================================
console.log('✅ app.js caricato correttamente');
