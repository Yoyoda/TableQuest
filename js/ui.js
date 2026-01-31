/**
 * Module de gestion de l'interface utilisateur
 * Gère les interactions, animations et feedbacks visuels/sonores
 */

/**
 * Contexte audio pour les sons
 */
let contextAudio = null;
let sonActive = true;

/**
 * Initialise le contexte audio
 */
function initialiserAudio() {
    try {
        contextAudio = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Audio non supporté:', e);
    }
}

/**
 * Joue un son de feedback
 * @param {string} type - Type de son ('success', 'error', 'click', 'badge')
 */
export function jouerSon(type) {
    if (!sonActive || !contextAudio) return;
    
    const oscillator = contextAudio.createOscillator();
    const gainNode = contextAudio.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(contextAudio.destination);
    
    // Configuration selon le type
    switch (type) {
        case 'success':
            oscillator.frequency.value = 523.25; // Do
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, contextAudio.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, contextAudio.currentTime + 0.3);
            oscillator.start(contextAudio.currentTime);
            oscillator.stop(contextAudio.currentTime + 0.3);
            break;
            
        case 'error':
            oscillator.frequency.value = 200;
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.2, contextAudio.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, contextAudio.currentTime + 0.2);
            oscillator.start(contextAudio.currentTime);
            oscillator.stop(contextAudio.currentTime + 0.2);
            break;
            
        case 'click':
            oscillator.frequency.value = 800;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.1, contextAudio.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, contextAudio.currentTime + 0.05);
            oscillator.start(contextAudio.currentTime);
            oscillator.stop(contextAudio.currentTime + 0.05);
            break;
            
        case 'badge':
            // Mélodie pour nouveau badge
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = contextAudio.createOscillator();
                const gain = contextAudio.createGain();
                osc.connect(gain);
                gain.connect(contextAudio.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.2, contextAudio.currentTime + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, contextAudio.currentTime + i * 0.15 + 0.3);
                osc.start(contextAudio.currentTime + i * 0.15);
                osc.stop(contextAudio.currentTime + i * 0.15 + 0.3);
            });
            break;
    }
}

/**
 * Active ou désactive le son
 * @param {boolean} actif - État du son
 */
export function toggleSon(actif) {
    sonActive = actif;
    if (actif && !contextAudio) {
        initialiserAudio();
    }
}

/**
 * Affiche un écran et cache les autres
 * @param {string} idEcran - ID de l'écran à afficher
 */
export function afficherEcran(idEcran) {
    document.querySelectorAll('.ecran').forEach(ecran => {
        ecran.classList.remove('actif');
    });
    
    const ecran = document.getElementById(idEcran);
    if (ecran) {
        ecran.classList.add('actif');
    }
}

/**
 * Affiche un feedback visuel pour une réponse
 * @param {boolean} estCorrect - Si la réponse est correcte
 * @param {string} message - Message à afficher
 * @param {string} indice - Indice optionnel
 */
export function afficherFeedback(estCorrect, message, indice = null) {
    const feedbackEl = document.getElementById('feedback');
    if (!feedbackEl) return;
    
    feedbackEl.className = 'feedback ' + (estCorrect ? 'correct' : 'incorrect');
    
    let html = `<div class="feedback-message">${message}</div>`;
    if (indice) {
        html += `<div class="feedback-indice">${indice}</div>`;
    }
    
    feedbackEl.innerHTML = html;
    feedbackEl.classList.add('visible');
    
    // Jouer le son approprié
    jouerSon(estCorrect ? 'success' : 'error');
    
    // Animation de disparition
    setTimeout(() => {
        feedbackEl.classList.remove('visible');
    }, 3000);
}

/**
 * Anime un élément (shake, pulse, etc.)
 * @param {HTMLElement} element - Élément à animer
 * @param {string} animation - Type d'animation
 */
export function animer(element, animation) {
    element.classList.add('anime-' + animation);
    
    setTimeout(() => {
        element.classList.remove('anime-' + animation);
    }, 600);
}

/**
 * Met à jour l'affichage de la progression
 * @param {number} actuel - Nombre actuel
 * @param {number} total - Total à atteindre
 */
export function mettreAJourProgression(actuel, total) {
    const reussiesEl = document.getElementById('questions-reussies');
    const totalesEl = document.getElementById('questions-totales');
    
    if (reussiesEl) {
        reussiesEl.textContent = actuel;
        animer(reussiesEl, 'pulse');
    }
    if (totalesEl) totalesEl.textContent = total;
}

/**
 * Met à jour l'affichage des étoiles
 * @param {number} nombre - Nombre d'étoiles
 * @param {string} idElement - ID de l'élément à mettre à jour
 */
export function mettreAJourEtoiles(nombre, idElement = 'etoiles-session') {
    const el = document.getElementById(idElement);
    if (el) {
        el.textContent = nombre;
        animer(el, 'pulse');
    }
}

/**
 * Met à jour les statistiques de session
 * @param {Object} stats - Statistiques {correct, incorrect, precision}
 */
export function mettreAJourStatistiques(stats) {
    const correctEl = document.getElementById('stat-correct');
    const incorrectEl = document.getElementById('stat-incorrect');
    const precisionEl = document.getElementById('stat-precision');
    
    if (correctEl) correctEl.textContent = stats.correct || 0;
    if (incorrectEl) incorrectEl.textContent = stats.incorrect || 0;
    if (precisionEl) {
        const precision = stats.correct + stats.incorrect > 0
            ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)
            : 100;
        precisionEl.textContent = precision + '%';
    }
}

/**
 * Affiche une notification temporaire
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification ('info', 'success', 'warning')
 */
export function afficherNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.textContent = message;
    
    document.body.appendChild(notif);
    
    setTimeout(() => notif.classList.add('visible'), 10);
    
    setTimeout(() => {
        notif.classList.remove('visible');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

/**
 * Affiche un badge gagné avec animation
 * @param {Object} badge - Objet badge
 */
export function afficherNouveauBadge(badge) {
    afficherNotification(`Nouveau badge : ${badge.icone} ${badge.nom}`, 'success');
    jouerSon('badge');
}

/**
 * Vide un champ de saisie et le focus
 * @param {string} idInput - ID de l'input
 */
export function viderEtFocusInput(idInput) {
    const input = document.getElementById(idInput);
    if (input) {
        input.value = '';
        input.focus();
    }
}

/**
 * Désactive un bouton temporairement
 * @param {HTMLElement} bouton - Bouton à désactiver
 * @param {number} duree - Durée en ms
 */
export function desactiverTemporairement(bouton, duree = 500) {
    bouton.disabled = true;
    setTimeout(() => {
        bouton.disabled = false;
    }, duree);
}

/**
 * Formate une durée en secondes en texte lisible
 * @param {number} secondes - Durée en secondes
 * @returns {string} Texte formaté
 */
export function formaterDuree(secondes) {
    const minutes = Math.floor(secondes / 60);
    const sec = secondes % 60;
    
    if (minutes > 0) {
        return `${minutes} min ${sec} sec`;
    }
    return `${sec} sec`;
}

/**
 * Génère du HTML pour une carte de table
 * @param {Object} donneesTable - Données de la table
 * @returns {string} HTML de la carte
 */
export function genererCarteTable(donneesTable) {
    const etoiles = '⭐'.repeat(donneesTable.niveau);
    const classeNiveau = `niveau-${donneesTable.niveau}`;
    
    return `
        <button class="carte-table ${classeNiveau}" data-table="${donneesTable.numero}">
            <div class="numero-table">Table de ${donneesTable.numero}</div>
            <div class="etoiles-table">${etoiles}</div>
            <div class="stats-table">
                ${donneesTable.tentatives > 0 ? `
                    <span class="taux-reussite">${donneesTable.tauxReussite}%</span>
                    <span class="label-niveau">${donneesTable.labelNiveau}</span>
                ` : '<span class="nouveau">Nouveau</span>'}
            </div>
        </button>
    `;
}

// Initialiser l'audio au chargement
if (typeof window !== 'undefined') {
    window.addEventListener('load', initialiserAudio);
}
