// ==========================================
// VINCITORE 98 - GREEDY SET COVER ALGORITHM
// Ottimizzato per Mobile JavaScript
// ==========================================

console.log('📦 Caricamento greedy.js...');

// ==========================================
// UTILITY: GENERATORE COMBINAZIONI
// ==========================================
function combinations(arr, k) {
    const result = [];
    
    function helper(start, combo) {
        if (combo.length === k) {
            result.push([...combo]);
            return;
        }
        
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            helper(i + 1, combo);
            combo.pop();
        }
    }
    
    helper(0, []);
    return result;
}

// ==========================================
// UTILITY: CALCOLO COMBINAZIONI (formula)
// ==========================================
function comb(n, k) {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    
    let result = 1;
    for (let i = 1; i <= k; i++) {
        result *= (n - i + 1) / i;
    }
    return Math.round(result);
}

// ==========================================
// ALGORITMO PRINCIPALE: greedySetCover
// (nome compatibile con app.js)
// ==========================================
async function greedySetCover(nums, k, m, progressCallback = null) {
    console.log(`🎯 greedySetCover START: n=${nums.length}, k=${k}, m=${m}`);
    
    return new Promise((resolve, reject) => {
        // Usa setTimeout per non bloccare UI
        setTimeout(async () => {
            try {
                const startTime = Date.now();
                
                // Ordina numeri
                nums = nums.sort((a, b) => a - b);
                const n = nums.length;
                
                // ========================================
                // VALIDAZIONE
                // ========================================
                if (n < k) {
                    reject(new Error(`Numeri insufficienti: ${n} < ${k}`));
                    return;
                }
                
                if (m > k) {
                    reject(new Error(`Garanzia impossibile: m=${m} > k=${k}`));
                    return;
                }
                
                if (n < m) {
                    reject(new Error(`Serve almeno ${m} numeri`));
                    return;
                }
                
                console.log(`✅ Validazione OK`);
                
                // ========================================
                // FASE 1: CALCOLO UNIVERSO
                // ========================================
                if (progressCallback) progressCallback(0.05);
                
                console.log(`📊 Calcolo universo m-sottoinsiemi (m=${m})...`);
                const universe = combinations(nums, m);
                const universeSize = universe.length;
                const remaining = new Set(universe.map(JSON.stringify));
                
                console.log(`✅ Universo: ${universeSize.toLocaleString()} combinazioni`);
                
                // ========================================
                // FASE 2: PRE-CALCOLO K-COMBINAZIONI
                // ========================================
                if (progressCallback) progressCallback(0.10);
                
                console.log(`📦 Calcolo k-combinazioni (k=${k})...`);
                const allKCombs = combinations(nums, k);
                const totalK = allKCombs.length;
                
                console.log(`✅ Pool bollette: ${totalK.toLocaleString()} possibili`);
                
                // ========================================
                // FASE 3: PRE-CALCOLO COVERAGE MAP
                // ========================================
                if (progressCallback) progressCallback(0.15);
                
                console.log(`🗺️ Pre-calcolo coverage map...`);
                const coverageMap = new Map();
                
                for (let i = 0; i < allKCombs.length; i++) {
                    const kComb = allKCombs[i];
                    const mCombs = combinations(kComb, m);
                    coverageMap.set(
                        JSON.stringify(kComb), 
                        new Set(mCombs.map(JSON.stringify))
                    );
                    
                    // Progress ogni 10%
                    if (i % Math.max(1, Math.floor(totalK / 10)) === 0) {
                        const progress = 0.15 + (i / totalK * 0.30);
                        if (progressCallback) progressCallback(progress);
                    }
                    
                    // Yield ogni 100 iterazioni per non bloccare UI
                    if (i % 100 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }
                
                console.log(`✅ Coverage map: ${coverageMap.size.toLocaleString()} entries`);
                
                // ========================================
                // FASE 4: GREEDY SET COVER
                // ========================================
                if (progressCallback) progressCallback(0.45);
                
                console.log(`🎯 Avvio algoritmo greedy...`);
                
                const solution = [];
                let iteration = 0;
                let candidatePool = [...allKCombs];
                
                while (remaining.size > 0 && candidatePool.length > 0) {
                    iteration++;
                    
                    // Trova la migliore k-combinazione (quella che copre più m-sottoinsiemi)
                    let bestComb = null;
                    let bestScore = 0;
                    let bestCoverage = new Set();
                    
                    for (const kComb of candidatePool) {
                        const coverage = coverageMap.get(JSON.stringify(kComb));
                        
                        // Calcola intersezione con remaining
                        const hits = new Set([...coverage].filter(x => remaining.has(x)));
                        const score = hits.size;
                        
                        if (score > bestScore) {
                            bestScore = score;
                            bestComb = kComb;
                            bestCoverage = hits;
                        }
                        
                        // Ottimizzazione: early exit se copre tutto
                        if (score === remaining.size) {
                            break;
                        }
                    }
                    
                    // Nessuna combinazione copre più nulla → STOP
                    if (bestScore === 0) {
                        console.warn('⚠️ Greedy terminato, residui non coperti');
                        break;
                    }
                    
                    // Aggiungi bolletta alla soluzione
                    solution.push(bestComb);
                    
                    // Rimuovi m-sottoinsiemi coperti
                    for (const item of bestCoverage) {
                        remaining.delete(item);
                    }
                    
                    // Pulizia pool ogni 10 iterazioni (rimuovi bollette inutili)
                    if (iteration % 10 === 0) {
                        candidatePool = candidatePool.filter(kComb => {
                            const coverage = coverageMap.get(JSON.stringify(kComb));
                            return [...coverage].some(x => remaining.has(x));
                        });
                    }
                    
                    // Progress update
                    const covered = universeSize - remaining.size;
                    const progress = 0.45 + (covered / universeSize * 0.45);
                    
                    if (progressCallback && iteration % Math.max(1, Math.floor(universeSize / 100)) === 0) {
                        progressCallback(progress);
                    }
                    
                    // Yield ogni 50 iterazioni
                    if (iteration % 50 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                    
                    // Log ogni 100 iterazioni
                    if (iteration % 100 === 0) {
                        console.log(`Iterazione ${iteration}: bollette=${solution.length}, coperti=${covered}/${universeSize} (${(covered/universeSize*100).toFixed(1)}%)`);
                    }
                }
                
                const bolletteFase1 = solution.length;
                console.log(`✅ Fase 1 completata: ${bolletteFase1} bollette`);
                
                // ========================================
                // FASE 5: COPERTURA FORZATA RESIDUI
                // ========================================
                if (remaining.size > 0) {
                    console.log(`🔧 Fase 2: ${remaining.size} residui da coprire forzatamente`);
                    
                    if (progressCallback) progressCallback(0.90);
                    
                    const remainingArray = Array.from(remaining);
                    
                    for (let i = 0; i < remainingArray.length; i++) {
                        const mSub = remainingArray[i];
                        
                        if (!remaining.has(mSub)) continue; // Già coperto
                        
                        // Trova una bolletta che copre questo m-sottinsieme
                        let found = false;
                        for (const kComb of allKCombs) {
                            const coverage = coverageMap.get(JSON.stringify(kComb));
                            if (coverage.has(mSub)) {
                                solution.push(kComb);
                                
                                // Rimuovi tutti i coperti da questa bolletta
                                for (const item of coverage) {
                                    remaining.delete(item);
                                }
                                
                                found = true;
                                break;
                            }
                        }
                        
                        if (!found) {
                            console.error('❌ IMPOSSIBILE coprire:', JSON.parse(mSub));
                        }
                        
                        // Yield ogni 10 residui
                        if (i % 10 === 0) {
                            await new Promise(resolve => setTimeout(resolve, 0));
                        }
                    }
                }
                
                // ========================================
                // FASE 6: STATISTICHE FINALI
                // ========================================
                const elapsed = (Date.now() - startTime) / 1000;
                const covered = universeSize - remaining.size;
                const coveragePct = (covered / universeSize * 100);
                
                const stats = {
                    bolletteFase1: bolletteFase1,
                    bolletteFase2: solution.length - bolletteFase1,
                    bolletteTotali: solution.length,
                    copertura: coveragePct,
                    mCoperti: covered,
                    mTotali: universeSize,
                    mResidui: remaining.size,
                    tempoSecondi: elapsed,
                    completa: remaining.size === 0,
                    riduzione: ((1 - solution.length / totalK) * 100).toFixed(2)
                };
                
                console.log('========================================');
                console.log('✅ ELABORAZIONE COMPLETATA!');
                console.log('========================================');
                console.log(`📦 Bollette totali: ${solution.length.toLocaleString()}`);
                console.log(`   - Fase 1 (greedy): ${bolletteFase1}`);
                console.log(`   - Fase 2 (forzata): ${solution.length - bolletteFase1}`);
                console.log(`🎯 Copertura: ${coveragePct.toFixed(2)}% (${covered}/${universeSize})`);
                console.log(`⏱️ Tempo: ${elapsed.toFixed(2)}s`);
                console.log(`📉 Riduzione: ${stats.riduzione}%`);
                
                if (remaining.size === 0) {
                    console.log('🎊 GARANZIA MATEMATICA 100% CERTIFICATA!');
                } else {
                    console.warn(`⚠️ Residui: ${remaining.size} non coperti`);
                }
                console.log('========================================');
                
                // Progress finale
                if (progressCallback) progressCallback(1.0);
                
                // Resolve con risultati
                resolve(solution);
                
            } catch (error) {
                console.error('❌ ERRORE in greedySetCover:', error);
                reject(error);
            }
        }, 100); // Piccolo delay per permettere aggiornamento UI
    });
}

// ==========================================
// ALIAS: greedyCover (retrocompatibilità)
// ==========================================
async function greedyCover(nums, k, m, progressCallback) {
    console.log('⚠️ greedyCover chiamato (retrocompatibilità) → redirigo a greedySetCover');
    
    // Wrapper per adattare il callback
    const wrappedCallback = progressCallback ? (progress) => {
        const pct = Math.round(progress * 100);
        const msg = pct < 100 ? `Elaborazione ${pct}%` : 'Completato!';
        progressCallback(pct, msg);
    } : null;
    
    const bollette = await greedySetCover(nums, k, m, wrappedCallback);
    
    return {
        bollette: bollette,
        stats: {
            bolletteTotali: bollette.length,
            completa: true
        }
    };
}

// ==========================================
// EXPORT (per compatibilità moduli)
// ==========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        greedySetCover,
        greedyCover,
        combinations, 
        comb 
    };
}

console.log('✅ greedy.js caricato correttamente');
console.log('📌 Funzioni disponibili: greedySetCover, greedyCover, combinations, comb');
