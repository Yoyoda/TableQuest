/**
 * Module de gestion du stockage local (LocalStorage)
 * Gère la sauvegarde et le chargement de la progression du joueur
 */

const CLE_STORAGE = 'tablequest_progression';

/**
 * Structure par défaut de la progression
 */
const PROGRESSION_PAR_DEFAUT = {
    joueur: {
        nom: '',
        avatar: 'dragon'
    },
    statistiques: {},
    badges: [],
    parametres: {
        son: true,
        difficulte: 'adaptatif'
    },
    etoilesTotales: 0
};

/**
 * Charge la progression depuis le localStorage
 * @returns {Object} Objet de progression
 */
export function chargerProgression() {
    try {
        const data = localStorage.getItem(CLE_STORAGE);
        if (data) {
            const progression = JSON.parse(data);
            // Fusion avec les valeurs par défaut pour gérer les nouvelles propriétés
            return { ...PROGRESSION_PAR_DEFAUT, ...progression };
        }
    } catch (error) {
        console.error('Erreur lors du chargement de la progression:', error);
    }
    return { ...PROGRESSION_PAR_DEFAUT };
}

/**
 * Sauvegarde la progression dans le localStorage
 * @param {Object} progression - Objet de progression à sauvegarder
 */
export function sauvegarderProgression(progression) {
    try {
        localStorage.setItem(CLE_STORAGE, JSON.stringify(progression));
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la progression:', error);
        return false;
    }
}

/**
 * Met à jour le profil du joueur
 * @param {string} nom - Nom du joueur
 * @param {string} avatar - Identifiant de l'avatar
 */
export function mettreAJourProfil(nom, avatar) {
    const progression = chargerProgression();
    progression.joueur.nom = nom;
    progression.joueur.avatar = avatar;
    sauvegarderProgression(progression);
    return progression;
}

/**
 * Obtient les statistiques pour une table spécifique
 * @param {number} table - Numéro de la table (1-10)
 * @returns {Object} Statistiques de la table
 */
export function obtenirStatistiquesTable(table) {
    const progression = chargerProgression();
    const cle = `table_${table}`;
    
    if (!progression.statistiques[cle]) {
        progression.statistiques[cle] = {
            reussites: 0,
            tentatives: 0,
            niveau: 1,
            derniereSession: null,
            tempsMoyen: 0,
            historiqueTemps: []
        };
    }
    
    return progression.statistiques[cle];
}

/**
 * Met à jour les statistiques d'une table
 * @param {number} table - Numéro de la table
 * @param {Object} stats - Nouvelles statistiques
 */
export function mettreAJourStatistiquesTable(table, stats) {
    const progression = chargerProgression();
    const cle = `table_${table}`;
    
    progression.statistiques[cle] = {
        ...progression.statistiques[cle],
        ...stats,
        derniereSession: new Date().toISOString()
    };
    
    sauvegarderProgression(progression);
    return progression.statistiques[cle];
}

/**
 * Ajoute des étoiles au total
 * @param {number} nombre - Nombre d'étoiles à ajouter
 */
export function ajouterEtoiles(nombre) {
    const progression = chargerProgression();
    progression.etoilesTotales = (progression.etoilesTotales || 0) + nombre;
    sauvegarderProgression(progression);
    return progression.etoilesTotales;
}

/**
 * Ajoute un badge
 * @param {string} badge - Identifiant du badge
 */
export function ajouterBadge(badge) {
    const progression = chargerProgression();
    if (!progression.badges.includes(badge)) {
        progression.badges.push(badge);
        sauvegarderProgression(progression);
        return true;
    }
    return false;
}

/**
 * Met à jour les paramètres
 * @param {Object} parametres - Nouveaux paramètres
 */
export function mettreAJourParametres(parametres) {
    const progression = chargerProgression();
    progression.parametres = { ...progression.parametres, ...parametres };
    sauvegarderProgression(progression);
    return progression.parametres;
}

/**
 * Réinitialise toute la progression
 */
export function reinitialiserProgression() {
    try {
        localStorage.removeItem(CLE_STORAGE);
        return true;
    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        return false;
    }
}
