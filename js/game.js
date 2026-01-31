/**
 * Module de gestion du jeu
 * Logique principale des défis et des questions
 */

import * as Difficulte from './difficulty.js';
import * as Progression from './progression.js';

/**
 * Configuration d'une session de jeu
 */
let sessionEnCours = {
    table: null,
    nombresChoisis: null, // Nouveau: pour le mode nombres personnalisés
    niveau: 'debutant',
    questionActuelle: null,
    questionsRepondues: 0,
    questionsCorrectes: 0,
    objectifQuestions: 10,
    etoilesSession: 0,
    debutSession: null,
    debutQuestion: null,
    tempsReponses: []
};

/**
 * Démarre une nouvelle session de jeu
 * @param {number|null} table - Numéro de la table à jouer (null pour mode nombres)
 * @param {string} niveau - Niveau de difficulté
 * @param {number} objectif - Nombre de questions à répondre
 * @param {Array|null} nombresChoisis - Tableau des nombres choisis pour le mode nombres
 */
export function demarrerSession(table, niveau = 'debutant', objectif = 10, nombresChoisis = null) {
    sessionEnCours = {
        table,
        nombresChoisis,
        niveau,
        questionActuelle: null,
        questionsRepondues: 0,
        questionsCorrectes: 0,
        objectifQuestions: objectif,
        etoilesSession: 0,
        debutSession: new Date(),
        debutQuestion: null,
        tempsReponses: []
    };
    
    Difficulte.reinitialiserHistorique();
    
    return sessionEnCours;
}

/**
 * Obtient la session en cours
 * @returns {Object} Session actuelle
 */
export function obtenirSession() {
    return { ...sessionEnCours };
}

/**
 * Génère une nouvelle question
 * @returns {Object} Question générée
 */
export function nouvelleQuestion() {
    const question = Difficulte.genererQuestion(
        sessionEnCours.table,
        sessionEnCours.niveau,
        sessionEnCours.nombresChoisis
    );
    
    sessionEnCours.questionActuelle = question;
    sessionEnCours.debutQuestion = new Date();
    return question;
}

/**
 * Vérifie une réponse
 * @param {number} reponseUtilisateur - Réponse fournie par le joueur
 * @returns {Object} Résultat de la vérification
 */
export function verifierReponse(reponseUtilisateur) {
    if (!sessionEnCours.questionActuelle) {
        return { estCorrect: false, message: 'Pas de question en cours' };
    }
    
    const { resultat, operande1, operande2 } = sessionEnCours.questionActuelle;
    const estCorrect = reponseUtilisateur === resultat;
    
    // Calculer le temps de réponse
    const tempsReponse = sessionEnCours.debutQuestion 
        ? (new Date() - sessionEnCours.debutQuestion) / 1000 
        : 0;
    sessionEnCours.tempsReponses.push({
        temps: tempsReponse,
        estCorrect
    });
    
    // Mise à jour des compteurs
    sessionEnCours.questionsRepondues++;
    if (estCorrect) {
        sessionEnCours.questionsCorrectes++;
        sessionEnCours.etoilesSession += calculerEtoilesGagnees(estCorrect);
    }
    
    // Enregistrement pour l'adaptation
    Difficulte.enregistrerReponse(estCorrect);
    
    // Vérifier si la session est terminée
    const sessionTerminee = sessionEnCours.questionsRepondues >= sessionEnCours.objectifQuestions;
    
    return {
        estCorrect,
        resultat,
        operande1,
        operande2,
        reponseUtilisateur,
        message: estCorrect ? obtenirMessageSucces() : obtenirMessageErreur(),
        indice: estCorrect ? null : genererIndice(operande1, operande2),
        sessionTerminee,
        tempsReponse,
        progression: {
            repondues: sessionEnCours.questionsRepondues,
            correctes: sessionEnCours.questionsCorrectes,
            objectif: sessionEnCours.objectifQuestions,
            etoiles: sessionEnCours.etoilesSession
        }
    };
}

/**
 * Calcule le nombre d'étoiles gagnées pour une réponse
 * @param {boolean} estCorrect - Si la réponse est correcte
 * @returns {number} Nombre d'étoiles
 */
function calculerEtoilesGagnees(estCorrect) {
    if (!estCorrect) return 0;
    
    // Bonus pour les séries de bonnes réponses
    const stats = Difficulte.obtenirStatistiquesSession();
    if (stats.reussites >= 5 && stats.tauxReussite === 1) {
        return 15; // Série parfaite
    }
    
    return 10; // Étoiles par défaut
}

/**
 * Génère un message de succès aléatoire
 * @returns {string} Message encourageant
 */
function obtenirMessageSucces() {
    const messages = [
        'Excellent ! 🎉',
        'Bravo ! 🌟',
        'Parfait ! 👏',
        'Super ! 🎊',
        'Formidable ! ✨',
        'Génial ! 🚀',
        'Continue comme ça ! 💪',
        'Tu es un champion ! 🏆'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Génère un message d'erreur encourageant
 * @returns {string} Message positif
 */
function obtenirMessageErreur() {
    const messages = [
        'Presque ! Réessaye ! 💡',
        'Pas grave, continue ! 🌈',
        'Tu vas y arriver ! 💪',
        'Encore un petit effort ! ⭐',
        'N\'abandonne pas ! 🎯',
        'Regarde l\'indice ! 🔍'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Génère un indice pour aider le joueur
 * @param {number} operande1 - Premier nombre
 * @param {number} operande2 - Deuxième nombre
 * @returns {string} Indice pédagogique
 */
function genererIndice(operande1, operande2) {
    const resultat = operande1 * operande2;
    const min = Math.min(operande1, operande2);
    const max = Math.max(operande1, operande2);
    
    // Indice par addition répétée pour les petits nombres
    if (min <= 3) {
        const additions = [];
        for (let i = 0; i < min; i++) {
            additions.push(max);
        }
        return `💡 ${min} fois ${max}, c'est comme ${additions.join(' + ')} = ${resultat}`;
    }
    
    // Indice par décomposition
    if (operande2 === 5) {
        return `💡 Pour multiplier par 5, divise par 2 et ajoute un 0 ! ${operande1} ÷ 2 × 10 = ${resultat}`;
    }
    
    if (operande2 === 9) {
        return `💡 Pour multiplier par 9, multiplie par 10 et enlève le nombre ! ${operande1} × 10 - ${operande1} = ${resultat}`;
    }
    
    // Indice générique
    return `💡 Réfléchis bien... C'est ${min} groupes de ${max} !`;
}

/**
 * Termine la session et retourne les résultats
 * @returns {Object} Résultats de la session
 */
export function terminerSession() {
    const stats = Difficulte.obtenirStatistiquesSession();
    const duree = new Date() - sessionEnCours.debutSession;
    
    // Calculer les statistiques de temps
    const tempsCorrects = sessionEnCours.tempsReponses
        .filter(r => r.estCorrect)
        .map(r => r.temps);
    
    const tempsMoyen = tempsCorrects.length > 0
        ? tempsCorrects.reduce((a, b) => a + b, 0) / tempsCorrects.length
        : 0;
    
    const resultats = {
        table: sessionEnCours.table,
        nombresChoisis: sessionEnCours.nombresChoisis,
        questionsRepondues: sessionEnCours.questionsRepondues,
        questionsCorrectes: sessionEnCours.questionsCorrectes,
        etoilesGagnees: sessionEnCours.etoilesSession,
        tauxReussite: stats.pourcentage,
        duree: Math.floor(duree / 1000), // en secondes
        tempsMoyen: Math.round(tempsMoyen * 10) / 10, // arrondi à 1 décimale
        tempsReponses: sessionEnCours.tempsReponses,
        badges: evaluerBadges()
    };
    
    // Sauvegarder les résultats seulement si c'est une table spécifique
    if (sessionEnCours.table) {
        Progression.mettreAJourStatsTable(
            sessionEnCours.table,
            sessionEnCours.questionsCorrectes,
            sessionEnCours.questionsRepondues,
            tempsMoyen
        );
    }
    
    Progression.ajouterEtoiles(sessionEnCours.etoilesSession);
    
    // Ajouter les badges gagnés
    resultats.badges.forEach(badge => Progression.ajouterBadge(badge));
    
    return resultats;
}

/**
 * Évalue les badges gagnés pendant la session
 * @returns {Array} Liste des badges gagnés
 */
function evaluerBadges() {
    const badges = [];
    const stats = Difficulte.obtenirStatistiquesSession();
    
    // Badge première session
    if (sessionEnCours.questionsRepondues >= sessionEnCours.objectifQuestions) {
        badges.push('debutant');
    }
    
    // Badge perfection
    if (stats.tauxReussite === 1 && sessionEnCours.questionsRepondues >= 10) {
        badges.push('parfait');
    }
    
    // Badge table maîtrisée
    if (sessionEnCours.table && stats.tauxReussite >= 0.9) {
        badges.push(`table_${sessionEnCours.table}_master`);
    }
    
    // Badge rapidité (si répondu en moins de 5 minutes)
    const duree = (new Date() - sessionEnCours.debutSession) / 1000;
    if (duree < 300 && sessionEnCours.questionsRepondues >= 10) {
        badges.push('rapide');
    }
    
    return badges;
}

/**
 * Vérifie si la difficulté doit être ajustée (mode adaptatif)
 * @returns {Object|null} Nouvel ajustement ou null
 */
export function verifierAjustementDifficulte() {
    if (sessionEnCours.niveau !== Difficulte.NIVEAUX.ADAPTATIF) {
        return null;
    }
    
    const ajustement = Difficulte.evaluerAjustementNiveau(sessionEnCours.niveau);
    
    if (ajustement.devraitChanger) {
        sessionEnCours.niveau = ajustement.nouveauNiveau;
        return ajustement;
    }
    
    return null;
}
