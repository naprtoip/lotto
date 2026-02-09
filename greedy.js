// GREEDY COVER ALGORITHM - Ottimizzato per Mobile JavaScript
// Performance ottimizzate per dispositivi mobili

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

function comb(n, k) {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    
    let result = 1;
    for (let i = 1; i <= k; i++) {
        result *= (n - i + 1) / i;
    }
    return Math.round(result);
}

async function greedyCover(nums, k, m, progressCallback) {
    return new Promise((resolve, reject) => {
        // Usa setTimeout per non bloccare UI
        setTimeout(() => {
            try {
                const startTime = Date.now();
                
                nums = nums.sort((a, b) => a - b);
                const n = nums.length;
                
                // Validazione
                if (n < k) {
                    reject(new Error(`Numeri insufficienti: ${n} < ${k}`));
                    return;
                }
                
                if (m > k) {
                    reject(new Error(`Garanzia impossibile: m=${m} > k=${k}`));
                    return;
                }
                
                // 1. UNIVERSO: tutti gli m-sottoinsiemi
                progressCallback(5, 'Calcolo universo m-sottoinsiemi...');
                
                const universe = combinations(nums, m);
                const universeSize = universe.length;
                const remaining = new Set(universe.map(JSON.stringify));
                
                console.log(`📊 M-sottoinsiemi: ${universeSize.toLocaleString()}`);
                
                // 2. PRE-CALCOLO k-combinazioni
                progressCallback(10, 'Pre-calcolo k-combinazioni...');
                
                const allKCombs = combinations(nums, k);
                const totalK = allKCombs.length;
                
                console.log(`📦 K-combinazioni: ${totalK.toLocaleString()}`);
                
                // 3. PRE-CALCOLO COVERAGE MAP
                progressCallback(15, 'Pre-calcolo coverage map...');
                
                const coverageMap = new Map();
                
                for (let i = 0; i < allKCombs.length; i++) {
                    const kComb = allKCombs[i];
                    const mCombs = combinations(kComb, m);
                    coverageMap.set(JSON.stringify(kComb), new Set(mCombs.map(JSON.stringify)));
                    
                    // Progress ogni 10%
                    if (i % Math.max(1, Math.floor(totalK / 10)) === 0) {
                        const pct = 15 + (i / totalK * 30);
                        progressCallback(pct, `Pre-calcolo: ${((i/totalK)*100).toFixed(0)}%`);
                    }
                }
                
                console.log(`✅ Coverage map: ${coverageMap.size.toLocaleString()} entries`);
                
                // 4. GREEDY SET COVER
                progressCallback(45, 'Avvio greedy set cover...');
                
                const solution = [];
                let iteration = 0;
                let candidatePool = [...allKCombs];
                
                while (remaining.size > 0 && candidatePool.length > 0) {
                    iteration++;
                    
                    // Trova la migliore k-combinazione
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
                        
                        // Early exit optimization
                        if (score === remaining.size) {
                            break;
                        }
                    }
                    
                    // Nessuna combinazione copre più nulla
                    if (bestScore === 0) {
                        console.log('⚠️ Greedy terminato, rimangono residui');
                        break;
                    }
                    
                    // Aggiungi alla soluzione
                    solution.push(bestComb);
                    
                    // Rimuovi coperti da remaining
                    for (const item of bestCoverage) {
                        remaining.delete(item);
                    }
                    
                    // Pulizia pool ogni 10 iterazioni
                    if (iteration % 10 === 0) {
                        candidatePool = candidatePool.filter(kComb => {
                            const coverage = coverageMap.get(JSON.stringify(kComb));
                            return [...coverage].some(x => remaining.has(x));
                        });
                    }
                    
                    // Progress update
                    const covered = universeSize - remaining.size;
                    const pct = 45 + (covered / universeSize * 45);
                    
                    if (iteration % Math.max(1, Math.floor(universeSize / 100)) === 0) {
                        progressCallback(
                            pct,
                            `Fase 1: ${((covered/universeSize)*100).toFixed(1)}% | Bol: ${solution.length}`
                        );
                    }
                }
                
                const bolletteFase1 = solution.length;
                
                // 5. FASE 2: Copertura forzata residui (se necessario)
                if (remaining.size > 0) {
                    console.log(`🔧 Fase 2: ${remaining.size} residui da coprire`);
                    
                    progressCallback(90, 'Fase 2: copertura residui...');
                    
                    const remainingArray = Array.from(remaining);
                    
                    for (let i = 0; i < remainingArray.length; i++) {
                        const mSub = remainingArray[i];
                        
                        if (!remaining.has(mSub)) continue;
                        
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
                            console.warn('⚠️ Impossibile coprire:', JSON.parse(mSub));
                        }
                    }
                }
                
                // 6. STATISTICHE
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
                    riduzione: ((1 - solution.length / totalK) * 100)
                };
                
                console.log('✅ COMPLETATO!');
                console.log(`📦 Bollette: ${solution.length.toLocaleString()}`);
                console.log(`🎯 Copertura: ${coveragePct.toFixed(2)}%`);
                console.log(`⏱️ Tempo: ${elapsed.toFixed(2)}s`);
                
                if (remaining.size === 0) {
                    console.log('🎊 GARANZIA 100% VERIFICATA!');
                }
                
                progressCallback(100, 'Completato!');
                
                resolve({
                    bollette: solution,
                    stats: stats
                });
                
            } catch (error) {
                reject(error);
            }
        }, 100); // Piccolo delay per permettere aggiornamento UI
    });
}

// Export per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { greedyCover, combinations, comb };
}
