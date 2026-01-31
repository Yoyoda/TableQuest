/**
 * Module de gestion de la difficulté
 * Adapte le niveau de difficulté selon les performances du joueur
 */

/**
 * Niveaux de difficulté disponibles
 */
export const NIVEAUX = {
    DEBUTANT: 'debutant',
    INTERMEDIAIRE: 'intermediaire',
    AVANCE: 'avance',
    ADAPTATIF: 'adaptatif'
};

/**
 * Configuration des tables par niveau
 */
const TABLES_PAR_NIVEAU = {
    [NIVEAUX.DEBUTANT]: [1, 2, 5, 10],
    [NIVEAUX.INTERMEDIAIRE]: [3, 4, 6, 7, 8, 9],
    [NIVEAUX.AVANCE]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
};

/**
 * Seuils de réussite pour l'adaptation
 */
const SEUIL_MONTEE = 0.8;  // 80% de réussite
const SEUIL_DESCENTE = 0.5; // 50% de réussite
const TAILLE_HISTORIQUE = 10; // Nombre de réponses à considérer

/**
 * Historique des réponses pour l'adaptation
 */
let historiqueReponses = [];

/**
 * Génère un nombre aléatoire entre min et max (inclus)
 */
function nombreAleatoire(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Obtient les tables disponibles pour un niveau
 * @param {string} niveau - Niveau de difficulté
 * @returns {Array} Liste des tables disponibles
 */
export function obtenirTablesDisponibles(niveau) {
    if (niveau === NIVEAUX.ADAPTATIF) {
        return TABLES_PAR_NIVEAU[NIVEAUX.DEBUTANT];
    }
    return TABLES_PAR_NIVEAU[niveau] || TABLES_PAR_NIVEAU[NIVEAUX.DEBUTANT];
}

/**
 * Génère une question selon le niveau de difficulté
 * @param {number} table - Numéro de la table (optionnel pour mode aléatoire)
 * @param {string} niveau - Niveau de difficulté
 * @param {Array} nombresChoisis - Tableau des nombres choisis (mode nombres personnalisés)
 * @returns {Object} Question avec operande1, operande2 et resultat
 */
export function genererQuestion(table = null, niveau = NIVEAUX.DEBUTANT, nombresChoisis = null) {
    let operande1, operande2;
    
    if (nombresChoisis && nombresChoisis.length >= 2) {
        // Mode nombres personnalisés : choisir 2 nombres parmi ceux sélectionnés
        const index1 = nombreAleatoire(0, nombresChoisis.length - 1);
        let index2 = nombreAleatoire(0, nombresChoisis.length - 1);
        
        // S'assurer que les deux indices sont différents quand il y a plus de 2 nombres
        if (nombresChoisis.length > 2) {
            while (index2 === index1) {
                index2 = nombreAleatoire(0, nombresChoisis.length - 1);
            }
        }
        
        operande1 = nombresChoisis[index1];
        operande2 = nombresChoisis[index2];
    } else if (table !== null) {
        // Mode table spécifique
        operande1 = table;
        operande2 = nombreAleatoire(1, 10);
    } else {
        // Mode aléatoire selon le niveau
        const tablesDisponibles = obtenirTablesDisponibles(niveau);
        operande1 = tablesDisponibles[nombreAleatoire(0, tablesDisponibles.length - 1)];
        operande2 = nombreAleatoire(1, 10);
    }
    
    // Parfois inverser l'ordre pour varier
    if (Math.random() > 0.5) {
        [operande1, operande2] = [operande2, operande1];
    }
    
    return {
        operande1,
        operande2,
        resultat: operande1 * operande2
    };
}

/**
 * Enregistre une réponse dans l'historique
 * @param {boolean} estCorrect - Si la réponse était correcte
 */
export function enregistrerReponse(estCorrect) {
    historiqueReponses.push(estCorrect);
    
    // Garder seulement les N dernières réponses
    if (historiqueReponses.length > TAILLE_HISTORIQUE) {
        historiqueReponses.shift();
    }
}

/**
 * Calcule le taux de réussite récent
 * @returns {number} Taux de réussite entre 0 et 1
 */
export function calculerTauxReussite() {
    if (historiqueReponses.length === 0) return 1;
    
    const reussites = historiqueReponses.filter(r => r).length;
    return reussites / historiqueReponses.length;
}

/**
 * Détermine si le niveau doit être ajusté (mode adaptatif)
 * @param {string} niveauActuel - Niveau actuel
 * @returns {Object} { devraitChanger: boolean, nouveauNiveau: string }
 */
export function evaluerAjustementNiveau(niveauActuel) {
    const tauxReussite = calculerTauxReussite();
    
    // Besoin d'au moins quelques réponses pour ajuster
    if (historiqueReponses.length < 5) {
        return { devraitChanger: false, nouveauNiveau: niveauActuel };
    }
    
    // Montée de niveau
    if (tauxReussite >= SEUIL_MONTEE) {
        if (niveauActuel === NIVEAUX.DEBUTANT) {
            return { devraitChanger: true, nouveauNiveau: NIVEAUX.INTERMEDIAIRE };
        } else if (niveauActuel === NIVEAUX.INTERMEDIAIRE) {
            return { devraitChanger: true, nouveauNiveau: NIVEAUX.AVANCE };
        }
    }
    
    // Descente de niveau
    if (tauxReussite <= SEUIL_DESCENTE) {
        if (niveauActuel === NIVEAUX.AVANCE) {
            return { devraitChanger: true, nouveauNiveau: NIVEAUX.INTERMEDIAIRE };
        } else if (niveauActuel === NIVEAUX.INTERMEDIAIRE) {
            return { devraitChanger: true, nouveauNiveau: NIVEAUX.DEBUTANT };
        }
    }
    
    return { devraitChanger: false, nouveauNiveau: niveauActuel };
}

/**
 * Réinitialise l'historique des réponses
 */
export function reinitialiserHistorique() {
    historiqueReponses = [];
}

/**
 * Obtient des statistiques sur la session en cours
 * @returns {Object} Statistiques de la session
 */
export function obtenirStatistiquesSession() {
    const tauxReussite = calculerTauxReussite();
    const totalReponses = historiqueReponses.length;
    const reussites = historiqueReponses.filter(r => r).length;
    const erreurs = totalReponses - reussites;
    
    return {
        totalReponses,
        reussites,
        erreurs,
        tauxReussite,
        pourcentage: Math.round(tauxReussite * 100)
    };
}
