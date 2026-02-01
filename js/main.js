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
    nombresChoisis: [], // Pour le mode nombres personnalisés
    modeActuel: 'tables', // 'tables' ou 'nombres'
    statsSession: {
        correct: 0,
        incorrect: 0
    },
    enCoursDeValidation: false,
    profilEnEdition: null // ID du profil en cours d'édition (null si création)
};

/**
 * Initialisation de l'application
 */
function initialiser() {
    console.log('🎮 Initialisation de TableQuest...');
    
    // Enregistrer le service worker pour PWA
    if ('serviceWorker' in navigator) {
        // Déterminer le bon chemin pour le service worker
        const swPath = window.location.pathname.includes('/TableQuest/') 
            ? '/TableQuest/sw.js' 
            : '/sw.js';
        
        navigator.serviceWorker.register(swPath)
            .then(registration => {
                console.log('✅ Service Worker enregistré:', registration.scope);
            })
            .catch(error => {
                console.log('❌ Erreur enregistrement Service Worker:', error);
            });
    }
    
    // Migrer les anciennes données si nécessaire
    Storage.migrerVersMultiProfils();
    
    // Vérifier si un profil est déjà actif
    const profilActif = Storage.obtenirProfilActif();
    
    if (profilActif) {
        // Un profil est actif, aller directement à l'écran de sélection
        const progression = Storage.chargerProgression();
        App.avatarSelectionne = progression.joueur.avatar;
        afficherEcranSelection();
    } else {
        // Pas de profil actif, afficher l'écran de sélection de profil
        afficherEcranProfils();
    }
    
    // Initialiser les écouteurs d'événements
    initialiserEcouteurs();
}

/**
 * Configure tous les écouteurs d'événements
 */
function initialiserEcouteurs() {
    // === Écran de sélection de profil ===
    
    const btnNouveauProfil = document.getElementById('btn-nouveau-profil');
    btnNouveauProfil?.addEventListener('click', () => {
        App.profilEnEdition = null; // Mode création
        afficherEcranAccueil();
    });
    
    // === Écran d'accueil (création/édition de profil) ===
    
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
        
        if (App.profilEnEdition) {
            // Mode édition
            Storage.modifierProfil(App.profilEnEdition, {
                nom: nom,
                avatar: App.avatarSelectionne
            });
            UI.jouerSon('success');
            App.profilEnEdition = null;
            afficherEcranProfils(); // Retourner à la sélection de profils
        } else {
            // Mode création
            const profil = Storage.creerProfil(nom, App.avatarSelectionne);
            Storage.definirProfilActif(profil.id);
            UI.jouerSon('success');
            App.profilEnEdition = null;
            afficherEcranSelection(); // Aller au jeu avec le nouveau profil
        }
    });
    
    // Bouton annuler (édition de profil)
    const btnAnnulerProfil = document.getElementById('btn-annuler-profil');
    btnAnnulerProfil?.addEventListener('click', () => {
        App.profilEnEdition = null;
        if (Storage.obtenirProfilActif()) {
            // Si un profil est actif, retourner à l'écran de sélection
            afficherEcranSelection();
        } else {
            // Sinon, retourner à l'écran de profils
            afficherEcranProfils();
        }
    });
    
    // === Écran de sélection ===
    
    // Bouton changer de profil (logout)
    const btnChangerProfil = document.getElementById('btn-changer-profil');
    btnChangerProfil?.addEventListener('click', () => {
        if (confirm('Changer de profil ?')) {
            Storage.deconnecterProfil();
            afficherEcranProfils();
            UI.jouerSon('click');
        }
    });
    
    // Basculer entre mode tables et mode nombres
    const btnModeTables = document.getElementById('btn-mode-tables');
    const btnModeNombres = document.getElementById('btn-mode-nombres');
    const modeTables = document.getElementById('mode-tables');
    const modeNombres = document.getElementById('mode-nombres');
    
    btnModeTables?.addEventListener('click', () => {
        App.modeActuel = 'tables';
        btnModeTables.classList.add('actif');
        btnModeNombres.classList.remove('actif');
        modeTables.classList.add('actif');
        modeNombres.classList.remove('actif');
        UI.jouerSon('click');
    });
    
    btnModeNombres?.addEventListener('click', () => {
        App.modeActuel = 'nombres';
        btnModeNombres.classList.add('actif');
        btnModeTables.classList.remove('actif');
        modeNombres.classList.add('actif');
        modeTables.classList.remove('actif');
        UI.jouerSon('click');
    });
    
    // Sélection de nombres
    document.querySelectorAll('.nombre-choix').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const nombre = parseInt(e.target.dataset.nombre);
            const index = App.nombresChoisis.indexOf(nombre);
            
            if (index === -1) {
                App.nombresChoisis.push(nombre);
                e.target.classList.add('selectionne');
            } else {
                App.nombresChoisis.splice(index, 1);
                e.target.classList.remove('selectionne');
            }
            
            mettreAJourBoutonLancerNombres();
            UI.jouerSon('click');
        });
    });
    
    // Tout sélectionner
    const btnSelectionnerTout = document.getElementById('btn-selectionner-tout');
    btnSelectionnerTout?.addEventListener('click', () => {
        App.nombresChoisis = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        document.querySelectorAll('.nombre-choix').forEach(btn => {
            btn.classList.add('selectionne');
        });
        mettreAJourBoutonLancerNombres();
        UI.jouerSon('click');
    });
    
    // Tout désélectionner
    const btnDeselectionnerTout = document.getElementById('btn-deselectionner-tout');
    btnDeselectionnerTout?.addEventListener('click', () => {
        App.nombresChoisis = [];
        document.querySelectorAll('.nombre-choix').forEach(btn => {
            btn.classList.remove('selectionne');
        });
        mettreAJourBoutonLancerNombres();
        UI.jouerSon('click');
    });
    
    // Lancer le jeu avec nombres personnalisés
    const btnLancerNombres = document.getElementById('btn-lancer-nombres');
    btnLancerNombres?.addEventListener('click', () => {
        if (App.nombresChoisis.length >= 2) {
            demarrerJeuNombres(App.nombresChoisis);
        }
    });
    
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
        } else if (App.nombresChoisis && App.nombresChoisis.length >= 2) {
            demarrerJeuNombres(App.nombresChoisis);
        }
    });
    
    const btnMenu = document.getElementById('btn-menu');
    btnMenu?.addEventListener('click', () => {
        afficherEcranSelection();
    });
}

/**
 * Affiche l'écran de sélection de profil
 */
function afficherEcranProfils() {
    UI.afficherEcran('ecran-profils');
    
    const listeProfils = document.getElementById('liste-profils');
    if (!listeProfils) return;
    
    const profils = Storage.listerProfils();
    
    if (profils.length === 0) {
        listeProfils.innerHTML = `
            <div class="message-vide">
                <p>Aucun profil pour le moment.</p>
                <p>Crée ton premier profil pour commencer !</p>
            </div>
        `;
        return;
    }
    
    // Trier les profils par dernière connexion (plus récent en premier)
    profils.sort((a, b) => {
        return new Date(b.derniereConnexion) - new Date(a.derniereConnexion);
    });
    
    const emojis = { dragon: '🐉', licorne: '🦄', robot: '🤖', chat: '😺' };
    
    listeProfils.innerHTML = profils.map(profil => {
        const avatar = emojis[profil.avatar] || '🐉';
        const dateConnexion = new Date(profil.derniereConnexion);
        const dateTexte = dateConnexion.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long'
        });
        
        return `
            <div class="carte-profil-selection" data-profil-id="${profil.id}">
                <div class="profil-info">
                    <div class="profil-avatar">${avatar}</div>
                    <div class="profil-details">
                        <div class="profil-nom">${profil.nom}</div>
                        <div class="profil-date">Dernière visite : ${dateTexte}</div>
                    </div>
                </div>
                <div class="profil-actions">
                    <button class="btn-profil-jouer" data-profil-id="${profil.id}" title="Jouer">
                        ▶️
                    </button>
                    <button class="btn-profil-editer" data-profil-id="${profil.id}" title="Éditer">
                        ✏️
                    </button>
                    <button class="btn-profil-supprimer" data-profil-id="${profil.id}" title="Supprimer">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Ajouter les écouteurs pour chaque profil
    listeProfils.querySelectorAll('.btn-profil-jouer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const profilId = e.target.dataset.profilId;
            chargerProfil(profilId);
        });
    });
    
    listeProfils.querySelectorAll('.btn-profil-editer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const profilId = e.target.dataset.profilId;
            editerProfil(profilId);
        });
    });
    
    listeProfils.querySelectorAll('.btn-profil-supprimer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const profilId = e.target.dataset.profilId;
            supprimerProfilConfirmation(profilId);
        });
    });
    
    // Permettre aussi de cliquer sur la carte pour jouer
    listeProfils.querySelectorAll('.carte-profil-selection').forEach(carte => {
        carte.addEventListener('click', (e) => {
            // Ne pas déclencher si on a cliqué sur un bouton d'action
            if (e.target.classList.contains('btn-profil-jouer') ||
                e.target.classList.contains('btn-profil-editer') ||
                e.target.classList.contains('btn-profil-supprimer')) {
                return;
            }
            const profilId = carte.dataset.profilId;
            chargerProfil(profilId);
        });
    });
}

/**
 * Charge un profil et affiche l'écran de sélection
 */
function chargerProfil(profilId) {
    Storage.definirProfilActif(profilId);
    const progression = Storage.chargerProgression();
    App.avatarSelectionne = progression.joueur.avatar;
    UI.jouerSon('click');
    afficherEcranSelection();
}

/**
 * Édite un profil
 */
function editerProfil(profilId) {
    const profils = Storage.listerProfils();
    const profil = profils.find(p => p.id === profilId);
    
    if (!profil) return;
    
    App.profilEnEdition = profilId;
    App.avatarSelectionne = profil.avatar;
    
    UI.jouerSon('click');
    afficherEcranAccueil();
    
    // Pré-remplir le formulaire
    const nomInput = document.getElementById('nom-joueur');
    if (nomInput) nomInput.value = profil.nom;
    
    // Sélectionner l'avatar
    document.querySelectorAll('.avatar').forEach(btn => {
        btn.classList.remove('selectionne');
        if (btn.dataset.avatar === profil.avatar) {
            btn.classList.add('selectionne');
        }
    });
    
    // Changer le titre et afficher le bouton annuler
    const titreProfil = document.getElementById('titre-profil');
    if (titreProfil) titreProfil.textContent = 'Modifier le profil';
    
    const btnAnnuler = document.getElementById('btn-annuler-profil');
    if (btnAnnuler) btnAnnuler.style.display = 'inline-block';
    
    const btnCommencer = document.getElementById('btn-commencer');
    if (btnCommencer) btnCommencer.textContent = 'Enregistrer';
}

/**
 * Supprime un profil après confirmation
 */
function supprimerProfilConfirmation(profilId) {
    const profils = Storage.listerProfils();
    const profil = profils.find(p => p.id === profilId);
    
    if (!profil) return;
    
    if (confirm(`Supprimer le profil de ${profil.nom} ?\nToutes les données seront perdues.`)) {
        Storage.supprimerProfil(profilId);
        UI.jouerSon('click');
        afficherEcranProfils(); // Rafraîchir la liste
    }
}

/**
 * Affiche l'écran d'accueil (création/édition de profil)
 */
function afficherEcranAccueil() {
    UI.afficherEcran('ecran-accueil');
    
    // Réinitialiser le formulaire si création
    if (!App.profilEnEdition) {
        const nomInput = document.getElementById('nom-joueur');
        if (nomInput) nomInput.value = '';
        
        const titreProfil = document.getElementById('titre-profil');
        if (titreProfil) titreProfil.textContent = 'Ton profil';
        
        const btnAnnuler = document.getElementById('btn-annuler-profil');
        if (btnAnnuler) btnAnnuler.style.display = 'inline-block';
        
        const btnCommencer = document.getElementById('btn-commencer');
        if (btnCommencer) btnCommencer.textContent = 'Commencer l\'aventure';
        
        // Sélectionner le premier avatar
        document.querySelectorAll('.avatar').forEach((btn, index) => {
            btn.classList.remove('selectionne');
            if (index === 0) {
                btn.classList.add('selectionne');
                App.avatarSelectionne = btn.dataset.avatar;
            }
        });
    }
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
 * Met à jour l'état du bouton de lancement pour le mode nombres
 */
function mettreAJourBoutonLancerNombres() {
    const btnLancerNombres = document.getElementById('btn-lancer-nombres');
    if (!btnLancerNombres) return;
    
    if (App.nombresChoisis.length >= 2) {
        btnLancerNombres.disabled = false;
        btnLancerNombres.textContent = `Commencer (${App.nombresChoisis.length} nombres)`;
    } else {
        btnLancerNombres.disabled = true;
        btnLancerNombres.textContent = 'Commencer (min. 2 nombres)';
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
        const description = badge.description || 'Badge à débloquer';
        return `
            <div class="badge-carte ${obtenu ? 'obtenu' : ''}" title="${description}">
                <div class="badge-icone">${badge.icone}</div>
                <div class="badge-nom">${badge.nom}</div>
                <div class="badge-description">${description}</div>
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
    Game.demarrerSession(table, niveau, 10, null);
    
    // Réinitialiser l'affichage
    UI.mettreAJourProgression(0, 10);
    UI.mettreAJourEtoiles(0);
    UI.mettreAJourStatistiques(App.statsSession);
    
    // Afficher la première question
    afficherNouvelleQuestion();
}

/**
 * Démarre une partie avec des nombres personnalisés
 * @param {Array} nombres - Tableau des nombres choisis
 */
function demarrerJeuNombres(nombres) {
    UI.jouerSon('click');
    UI.afficherEcran('ecran-jeu');
    
    App.tableEnCours = null;
    App.statsSession = { correct: 0, incorrect: 0 };
    App.enCoursDeValidation = false;
    
    // Obtenir le niveau de difficulté
    const progression = Storage.chargerProgression();
    const niveau = progression.parametres.difficulte;
    
    // Démarrer la session de jeu avec les nombres choisis
    Game.demarrerSession(null, niveau, 10, nombres);
    
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
    
    // Ajouter l'affichage du temps moyen si disponible
    const statsFinalesEl = document.querySelector('.stats-finales');
    if (statsFinalesEl && resultats.tempsMoyen > 0) {
        const iconeVitesse = Progression.obtenirIconeVitesse(resultats.tempsMoyen);
        const tempsDiv = document.createElement('div');
        tempsDiv.innerHTML = `<span class="emoji">${iconeVitesse}</span> ${resultats.tempsMoyen}s par réponse`;
        statsFinalesEl.appendChild(tempsDiv);
    }
    
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
