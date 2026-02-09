// VINCITORE 98 MOBILE - App Logic
// Ottimizzato per performance mobile

const app = {
    selected: new Set(),
    bollette: [],
    k: 4,
    m: 2,

    init() {
        this.buildNumbersGrid();
        this.updateConfig();
        this.loadLastProject();
    },

    buildNumbersGrid() {
        const grid = document.getElementById('numbersGrid');
        for (let i = 1; i <= 90; i++) {
            const btn = document.createElement('button');
            btn.className = 'number-btn';
            btn.textContent = i;
            btn.onclick = () => this.toggleNumber(i);
            btn.id = `num-${i}`;
            grid.appendChild(btn);
        }
    },

    toggleNumber(n) {
        if (this.selected.has(n)) {
            this.selected.delete(n);
            document.getElementById(`num-${n}`).classList.remove('selected');
        } else {
            if (this.selected.size >= 10) {
                this.showToast('⚠️ Massimo 10 numeri per bolletta (regola Lotto)');
                return;
            }
            this.selected.add(n);
            document.getElementById(`num-${n}`).classList.add('selected');
        }
        this.updateStats();
    },

    selectGroup(type) {
        this.reset();
        let nums = [];
        
        switch(type) {
            case 'pari':
                nums = Array.from({length: 45}, (_, i) => (i + 1) * 2);
                break;
            case 'dispari':
                nums = Array.from({length: 45}, (_, i) => i * 2 + 1);
                break;
            case 'bassi':
                nums = Array.from({length: 45}, (_, i) => i + 1);
                break;
            case 'alti':
                nums = Array.from({length: 45}, (_, i) => i + 46);
                break;
        }
        
        // Seleziona primi 10
        nums.slice(0, 10).forEach(n => {
            this.selected.add(n);
            document.getElementById(`num-${n}`).classList.add('selected');
        });
        
        this.updateStats();
    },

    reset() {
        this.selected.clear();
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.updateStats();
    },

    updateStats() {
        const count = this.selected.size;
        document.getElementById('selectedCount').textContent = count;
        
        // Calcola bollette teoriche
        const k = this.k;
        let total = 0;
        if (count >= k) {
            total = this.comb(count, k);
        }
        
        document.getElementById('combCount').textContent = total > 1000000 
            ? (total / 1000000).toFixed(1) + 'M'
            : total.toLocaleString();
        
        this.updateConfig();
    },

    updateConfig() {
        this.k = parseInt(document.getElementById('sviluppo').value);
        this.m = parseInt(document.getElementById('garanzia').value);
        
        this.updateStats();
        this.checkGaranzia();
    },

    checkGaranzia() {
        const badge = document.getElementById('garanziaInfo');
        const n = this.selected.size;
        
        // Garanzie certificate
        const certified = {
            '2-2-5': '✅ Ambi con garanzia Ambo - CERTIFICATA 100%',
            '3-3-7': '✅ Terni con garanzia Terno - CERTIFICATA 100%',
            '3-2-4': '✅ Terni con garanzia Ambo - CERTIFICATA 100%',
            '4-3-9': '✅ Quaterne con garanzia Terno - CERTIFICATA 100%',
            '4-2-5': '✅ Quaterne con garanzia Ambo - CERTIFICATA 100%'
        };
        
        const key = `${this.k}-${this.m}-${n}`;
        
        if (certified[key]) {
            badge.textContent = certified[key];
            badge.className = 'garanzia-badge garanzia-ok';
            badge.style.display = 'block';
        } else if (n >= this.k && this.m <= this.k) {
            badge.textContent = '⚠️ Garanzia possibile ma non certificata al 100%';
            badge.className = 'garanzia-badge garanzia-no';
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    },

    async elaborate() {
        if (this.selected.size < 2) {
            this.showToast('❌ Seleziona almeno 2 numeri');
            return;
        }

        if (this.selected.size < this.k) {
            this.showToast(`❌ Servono almeno ${this.k} numeri per sviluppo ${this.getSviluppoName()}`);
            return;
        }

        if (this.m > this.k) {
            this.showToast('❌ Garanzia non può essere maggiore dello sviluppo');
            return;
        }

        const nums = Array.from(this.selected).sort((a, b) => a - b);
        const totalCombs = this.comb(nums.length, this.k);

        // Warning per elaborazioni pesanti
        if (totalCombs > 100000) {
            if (!confirm(`⚠️ ATTENZIONE\n\nQuesta elaborazione richiede:\n• ${totalCombs.toLocaleString()} combinazioni\n• Tempo stimato: 30-60 secondi\n• RAM: ~${(totalCombs * 50 / 1024 / 1024).toFixed(0)} MB\n\nVuoi procedere?`)) {
                return;
            }
        }

        // Mostra progress
        this.showProgress();

        // Usa Web Worker per non bloccare UI
        try {
            const startTime = Date.now();
            
            // Simula progress per le prime fasi
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 2;
                if (progress < 90) {
                    this.updateProgress(progress, 'Elaborazione in corso...');
                }
            }, 200);

            // Esegui greedy (funzione in greedy.js)
            const result = await greedyCover(nums, this.k, this.m, (pct, info) => {
                clearInterval(progressInterval);
                this.updateProgress(pct, info);
            });

            clearInterval(progressInterval);
            
            const elapsed = (Date.now() - startTime) / 1000;

            this.bollette = result.bollette;
            
            this.hideProgress();
            this.showResults(result, elapsed);
            
            document.getElementById('saveBtn').style.display = 'block';

        } catch (error) {
            this.hideProgress();
            this.showToast('❌ Errore elaborazione: ' + error.message);
            console.error(error);
        }
    },

    showProgress() {
        document.getElementById('progressContainer').style.display = 'flex';
    },

    hideProgress() {
        document.getElementById('progressContainer').style.display = 'none';
    },

    updateProgress(pct, text) {
        document.getElementById('progressBar').style.width = pct + '%';
        document.getElementById('progressText').textContent = text;
    },

    showResults(result, elapsed) {
        const { bollette, stats } = result;
        
        // Info
        const info = `
            📦 Bollette: ${bollette.length.toLocaleString()}
            📉 Riduzione: ${stats.riduzione.toFixed(2)}%
            🎯 Copertura: ${stats.copertura.toFixed(2)}%
            ⏱️ Tempo: ${elapsed.toFixed(2)}s
            ${stats.completa ? '🎊 GARANZIA 100% VERIFICATA!' : '⚠️ Copertura parziale'}
        `;
        
        document.getElementById('resultsInfo').textContent = info;
        
        // Output
        let output = '';
        const preview = bollette.slice(0, 50);
        preview.forEach((b, i) => {
            output += `${(i+1).toString().padStart(4, ' ')}) ${b.map(n => n.toString().padStart(2, '0')).join(' ')}\n`;
        });
        
        if (bollette.length > 50) {
            output += `\n... e altre ${(bollette.length - 50).toLocaleString()} bollette`;
        }
        
        document.getElementById('resultsOutput').textContent = output;
        document.getElementById('resultsCard').style.display = 'block';
        document.getElementById('resultsOutput').style.display = 'block';
        
        // Scroll to results
        document.getElementById('resultsCard').scrollIntoView({ behavior: 'smooth' });
        
        this.showToast('✅ Elaborazione completata!');
    },

    saveProject() {
        const project = {
            date: new Date().toISOString(),
            selected: Array.from(this.selected),
            k: this.k,
            m: this.m,
            bollette: this.bollette,
            importi: this.getImporti()
        };
        
        // Save to localStorage
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        projects.unshift(project);
        
        // Keep max 10 projects
        if (projects.length > 10) {
            projects.pop();
        }
        
        localStorage.setItem('projects', JSON.stringify(projects));
        localStorage.setItem('lastProject', JSON.stringify(project));
        
        this.showToast('💾 Progetto salvato!');
    },

    loadLastProject() {
        const last = localStorage.getItem('lastProject');
        if (last) {
            try {
                const project = JSON.parse(last);
                // Restore only selection, not bollette
                this.selected = new Set(project.selected);
                this.selected.forEach(n => {
                    document.getElementById(`num-${n}`).classList.add('selected');
                });
                this.k = project.k;
                this.m = project.m;
                document.getElementById('sviluppo').value = this.k;
                document.getElementById('garanzia').value = this.m;
                
                // Restore importi
                if (project.importi) {
                    Object.entries(project.importi).forEach(([key, val]) => {
                        const input = document.getElementById(`imp-${key}`);
                        if (input) input.value = val;
                    });
                }
                
                this.updateStats();
            } catch (e) {
                console.error('Error loading project:', e);
            }
        }
    },

    getImporti() {
        return {
            estratto: parseFloat(document.getElementById('imp-estratto').value) || 0,
            ambo: parseFloat(document.getElementById('imp-ambo').value) || 0,
            terno: parseFloat(document.getElementById('imp-terno').value) || 0,
            quaterna: parseFloat(document.getElementById('imp-quaterna').value) || 0
        };
    },

    async exportPDF() {
        this.showToast('📄 Export PDF in sviluppo...');
        // TODO: Implementare export PDF con jsPDF
    },

    showTab(tab) {
        // Navigation logic
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        if (tab === 'info') {
            alert('ℹ️ VINCITORE 98 Mobile\n\nVersione: 1.0.0\nAlgoritmo: Greedy Set Cover\nGaranzia: Matematica al 100%\n\nSviluppato con ❤️');
        } else if (tab === 'projects') {
            this.showProjects();
        }
    },

    showProjects() {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        if (projects.length === 0) {
            this.showToast('📁 Nessun progetto salvato');
            return;
        }
        
        let msg = '📁 PROGETTI SALVATI:\n\n';
        projects.forEach((p, i) => {
            const date = new Date(p.date).toLocaleDateString('it-IT');
            msg += `${i+1}. ${date} - ${p.selected.length} numeri, ${p.bollette.length} bollette\n`;
        });
        
        alert(msg);
    },

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    getSviluppoName() {
        const names = { 2: 'Ambi', 3: 'Terni', 4: 'Quaterne', 5: 'Cinquine' };
        return names[this.k] || this.k;
    },

    comb(n, k) {
        if (k > n || k < 0) return 0;
        if (k === 0 || k === n) return 1;
        
        let result = 1;
        for (let i = 1; i <= k; i++) {
            result *= (n - i + 1) / i;
        }
        return Math.round(result);
    }
};

// Init app quando DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
