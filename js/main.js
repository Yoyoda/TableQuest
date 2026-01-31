/**
 * TableQuest - Point d'entrée principal
 * Orchestre tous les modules et gère le flux de l'application
 */

import * as Storage from './storage.js';
import * as Progression from './progression.js';
import * as Game from './game.js';
import * as UI from './ui.js';

/**
 * État global de l'application
 */
const App = {
    avatarSelectionne: 'dragon',
    tableEnCours: null,
    statsSession: {
        correct: 0,
        incorrect: 0
    },
    enCoursDeValidation: false
};

/**
 * Initialisation de l'application
 */
function initialiser() {
    console.log('🎮 Initialisation de TableQuest...');
    
    // Charger la progression existante
    const progression = Storage.chargerProgression();
    
    // Si un joueur existe, aller directement à l'écran de sélection
    if (progression.joueur.nom) {
        App.avatarSelectionne = progression.joueur.avatar;
        afficherEcranSelection();
    } else {
        UI.afficherEcran('ecran-accueil');
    }
    
    // Initialiser les écouteurs d'événements
    initialiserEcouteurs();
}

/**
 * Configure tous les écouteurs d'événements
 */
function initialiserEcouteurs() {
    // === Écran d'accueil ===
    
    // Sélection d'avatar
    document.querySelectorAll('.avatar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.avatar').forEach(b => b.classList.remove('selectionne'));
            e.target.classList.add('selectionne');
            App.avatarSelectionne = e.target.dataset.avatar;
            UI.jouerSon('click');
        });
    });
    
    // Sélectionner le premier avatar par défaut
    const premierAvatar = document.querySelector('.avatar');
    if (premierAvatar) {
        premierAvatar.classList.add('selectionne');
    }
    
    // Bouton commencer
    const btnCommencer = document.getElementById('btn-commencer');
    btnCommencer?.addEventListener('click', () => {
        const nomInput = document.getElementById('nom-joueur');
        const nom = nomInput.value.trim();
        
        if (!nom) {
            UI.animer(nomInput, 'shake');
            return;
        }
        
        // Sauvegarder le profil
        Storage.mettreAJourProfil(nom, App.avatarSelectionne);
        UI.jouerSon('success');
        afficherEcranSelection();
    });
    
    // === Écran de sélection ===
    
    // Paramètres
    const toggleSon = document.getElementById('toggle-son');
    toggleSon?.addEventListener('change', (e) => {
        UI.toggleSon(e.target.checked);
        Storage.mettreAJourParametres({ son: e.target.checked });
    });
    
    const selectDifficulte = document.getElementById('select-difficulte');
    selectDifficulte?.addEventListener('change', (e) => {
        Storage.mettreAJourParametres({ difficulte: e.target.value });
    });
    
    // === Écran de jeu ===
    
    // Bouton retour
    const btnRetour = document.getElementById('btn-retour');
    btnRetour?.addEventListener('click', () => {
        if (confirm('Abandonner la partie en cours ?')) {
            afficherEcranSelection();
        }
    });
    
    // Validation de réponse
    const btnValider = document.getElementById('btn-valider');
    const inputReponse = document.getElementById('input-reponse');
    
    btnValider?.addEventListener('click', () => validerReponse());
    
    inputReponse?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validerReponse();
        }
    });
    
    // === Écran de résultats ===
    
    const btnRejouer = document.getElementById('btn-rejouer');
    btnRejouer?.addEventListener('click', () => {
        if (App.tableEnCours) {
            demarrerJeu(App.tableEnCours);
        }
    });
    
    const btnMenu = document.getElementById('btn-menu');
    btnMenu?.addEventListener('click', () => {
        afficherEcranSelection();
    });
}

/**
 * Affiche l'écran de sélection des tables
 */
function afficherEcranSelection() {
    UI.afficherEcran('ecran-selection');
    
    // Mettre à jour le profil du joueur
    const profil = Progression.obtenirProfilJoueur();
    const avatarEl = document.querySelector('.avatar-joueur');
    const nomEl = document.querySelector('.nom-joueur');
    const etoilesEl = document.getElementById('total-etoiles');
    
    if (avatarEl) {
        const emojis = { dragon: '🐉', licorne: '🦄', robot: '🤖', chat: '😺' };
        avatarEl.textContent = emojis[profil.avatar] || '🐉';
    }
    if (nomEl) nomEl.textContent = profil.nom;
    if (etoilesEl) etoilesEl.textContent = profil.etoilesTotales;
    
    // Afficher les badges
    afficherCollectionBadges();
    
    // Générer la grille des tables
    const grilleTables = document.getElementById('grille-tables');
    if (grilleTables) {
        const donneesTables = Progression.genererDonneesGrilleTables();
        grilleTables.innerHTML = donneesTables.map(t => UI.genererCarteTable(t)).join('');
        
        // Ajouter les écouteurs sur les cartes
        grilleTables.querySelectorAll('.carte-table').forEach(carte => {
            carte.addEventListener('click', (e) => {
                const table = parseInt(e.currentTarget.dataset.table);
                demarrerJeu(table);
            });
        });
    }
    
    // Charger les paramètres
    const progression = Storage.chargerProgression();
    const toggleSon = document.getElementById('toggle-son');
    const selectDifficulte = document.getElementById('select-difficulte');
    
    if (toggleSon) {
        toggleSon.checked = progression.parametres.son;
        UI.toggleSon(progression.parametres.son);
    }
    if (selectDifficulte) {
        selectDifficulte.value = progression.parametres.difficulte;
    }
}

/**
 * Affiche la collection de badges du joueur
 */
function afficherCollectionBadges() {
    const collectionEl = document.getElementById('collection-badges');
    if (!collectionEl) return;
    
    const badgesPossedes = Progression.obtenirBadgesPossedes().map(b => b.id);
    
    // Liste de tous les badges principaux
    const badgesPrincipaux = [
        Progression.BADGES.debutant,
        Progression.BADGES.parfait,
        Progression.BADGES.rapide,
        Progression.BADGES.table_2_master,
        Progression.BADGES.table_3_master,
        Progression.BADGES.table_4_master,
        Progression.BADGES.table_5_master,
        Progression.BADGES.table_6_master,
        Progression.BADGES.table_7_master,
        Progression.BADGES.table_8_master,
        Progression.BADGES.table_9_master
    ];
    
    if (badgesPossedes.length === 0) {
        collectionEl.innerHTML = '<p class="aucun-badge">Joue pour gagner des badges ! 🎯</p>';
        return;
    }
    
    const html = badgesPrincipaux.map(badge => {
        const obtenu = badgesPossedes.includes(badge.id);
        return `
            <div class="badge-carte ${obtenu ? 'obtenu' : ''}">
                <div class="badge-icone">${badge.icone}</div>
                <div class="badge-nom">${badge.nom}</div>
            </div>
        `;
    }).join('');
    
    collectionEl.innerHTML = html;
}

/**
 * Démarre une partie pour une table donnée
 * @param {number} table - Numéro de la table
 */
function demarrerJeu(table) {
    UI.jouerSon('click');
    UI.afficherEcran('ecran-jeu');
    
    App.tableEnCours = table;
    App.statsSession = { correct: 0, incorrect: 0 };
    App.enCoursDeValidation = false;
    
    // Obtenir le niveau de difficulté
    const progression = Storage.chargerProgression();
    const niveau = progression.parametres.difficulte;
    
    // Démarrer la session de jeu
    Game.demarrerSession(table, niveau, 10);
    
    // Réinitialiser l'affichage
    UI.mettreAJourProgression(0, 10);
    UI.mettreAJourEtoiles(0);
    UI.mettreAJourStatistiques(App.statsSession);
    
    // Afficher la première question
    afficherNouvelleQuestion();
}

/**
 * Affiche une nouvelle question
 */
function afficherNouvelleQuestion() {
    const question = Game.nouvelleQuestion();
    
    const op1El = document.getElementById('operande1');
    const op2El = document.getElementById('operande2');
    const resultatEl = document.getElementById('resultat');
    const inputReponse = document.getElementById('input-reponse');
    
    if (op1El) op1El.textContent = question.operande1;
    if (op2El) op2El.textContent = question.operande2;
    if (resultatEl) resultatEl.textContent = '?';
    
    // Réactiver l'input et le flag
    if (inputReponse) inputReponse.disabled = false;
    App.enCoursDeValidation = false;
    
    UI.viderEtFocusInput('input-reponse');
    
    // Cacher le feedback précédent
    const feedback = document.getElementById('feedback');
    if (feedback) feedback.classList.remove('visible');
}

/**
 * Valide la réponse du joueur
 */
function validerReponse() {
    // Empêcher les validations multiples
    if (App.enCoursDeValidation) {
        return;
    }
    
    const inputReponse = document.getElementById('input-reponse');
    const reponse = parseInt(inputReponse.value);
    
    if (isNaN(reponse)) {
        UI.animer(inputReponse, 'shake');
        return;
    }
    
    // Verrouiller la validation et désactiver l'input
    App.enCoursDeValidation = true;
    if (inputReponse) inputReponse.disabled = true;
    
    // Vérifier la réponse
    const resultat = Game.verifierReponse(reponse);
    
    // Afficher le résultat correct
    const resultatEl = document.getElementById('resultat');
    if (resultatEl) {
        resultatEl.textContent = resultat.resultat;
    }
    
    // Mettre à jour les statistiques
    if (resultat.estCorrect) {
        App.statsSession.correct++;
    } else {
        App.statsSession.incorrect++;
    }
    
    UI.mettreAJourStatistiques(App.statsSession);
    UI.mettreAJourProgression(resultat.progression.correctes, resultat.progression.objectif);
    UI.mettreAJourEtoiles(resultat.progression.etoiles);
    
    // Afficher le feedback
    UI.afficherFeedback(resultat.estCorrect, resultat.message, resultat.indice);
    
    // Désactiver temporairement le bouton
    const btnValider = document.getElementById('btn-valider');
    if (btnValider) UI.desactiverTemporairement(btnValider, 1500);
    
    // Si session terminée, afficher les résultats
    if (resultat.sessionTerminee) {
        setTimeout(() => {
            afficherResultats();
        }, 2000);
    } else {
        // Sinon, nouvelle question après un délai
        setTimeout(() => {
            afficherNouvelleQuestion();
        }, 1500);
    }
}

/**
 * Affiche l'écran de résultats
 */
function afficherResultats() {
    const resultats = Game.terminerSession();
    
    UI.afficherEcran('ecran-resultats');
    
    // Titre selon la performance
    const titreEl = document.getElementById('titre-resultats');
    if (titreEl) {
        if (resultats.tauxReussite === 100) {
            titreEl.textContent = 'Parfait ! 🏆';
        } else if (resultats.tauxReussite >= 80) {
            titreEl.textContent = 'Excellent ! 🌟';
        } else if (resultats.tauxReussite >= 60) {
            titreEl.textContent = 'Bien joué ! 👏';
        } else {
            titreEl.textContent = 'Continue à t\'entraîner ! 💪';
        }
    }
    
    // Animation
    const animationEl = document.getElementById('animation-resultat');
    if (animationEl) {
        animationEl.textContent = resultats.tauxReussite >= 80 ? '🎉' : '🎊';
    }
    
    // Scores
    const scoreFinalEl = document.getElementById('score-final');
    const totalCorrectEl = document.getElementById('total-correct');
    const totalIncorrectEl = document.getElementById('total-incorrect');
    const precisionFinaleEl = document.getElementById('precision-finale');
    
    if (scoreFinalEl) scoreFinalEl.textContent = resultats.etoilesGagnees;
    if (totalCorrectEl) totalCorrectEl.textContent = resultats.questionsCorrectes;
    if (totalIncorrectEl) totalIncorrectEl.textContent = resultats.questionsRepondues - resultats.questionsCorrectes;
    if (precisionFinaleEl) precisionFinaleEl.textContent = resultats.tauxReussite;
    
    // Badges gagnés
    const badgesEl = document.getElementById('badges-gagnes');
    if (badgesEl && resultats.badges.length > 0) {
        const badgesHTML = resultats.badges.map(badgeId => {
            const badge = Progression.BADGES[badgeId];
            if (!badge) return '';
            return `
                <div class="badge-item nouveau">
                    <div class="badge-icone">${badge.icone}</div>
                    <div class="badge-nom">${badge.nom}</div>
                    ${badge.description ? `<div class="badge-description">${badge.description}</div>` : ''}
                </div>
            `;
        }).join('');
        
        badgesEl.innerHTML = `
            <h3 style="width: 100%; text-align: center; margin-bottom: var(--espacement-md);">
                🏅 Nouveaux badges gagnés !
            </h3>
            ${badgesHTML}
        `;
        
        // Afficher une notification pour chaque badge
        resultats.badges.forEach((badgeId, index) => {
            const badge = Progression.BADGES[badgeId];
            if (badge) {
                setTimeout(() => UI.afficherNouveauBadge(badge), 500 + index * 300);
            }
        });
    } else if (badgesEl) {
        badgesEl.innerHTML = '';
    }
}

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiser);
} else {
    initialiser();
}

// Exporter pour debug
window.TableQuest = {
    App,
    Storage,
    Progression,
    Game,
    UI
};
