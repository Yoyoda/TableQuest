/**
 * Module de gestion de la progression du joueur
 * Gère les niveaux, badges et statistiques
 */

import * as Storage from './storage.js';

/**
 * Définition des badges disponibles
 */
export const BADGES = {
    debutant: {
        id: 'debutant',
        nom: 'Premier pas',
        description: 'Termine ton premier défi',
        icone: '🎯'
    },
    parfait: {
        id: 'parfait',
        nom: 'Perfection',
        description: 'Réussis 10 questions sans erreur',
        icone: '💯'
    },
    rapide: {
        id: 'rapide',
        nom: 'Éclair',
        description: 'Termine un défi en moins de 5 minutes',
        icone: '⚡'
    },
    table_2_master: { id: 'table_2_master', nom: 'Maître du 2', icone: '🥇' },
    table_3_master: { id: 'table_3_master', nom: 'Maître du 3', icone: '🥇' },
    table_4_master: { id: 'table_4_master', nom: 'Maître du 4', icone: '🥇' },
    table_5_master: { id: 'table_5_master', nom: 'Maître du 5', icone: '🥇' },
    table_6_master: { id: 'table_6_master', nom: 'Maître du 6', icone: '🥇' },
    table_7_master: { id: 'table_7_master', nom: 'Maître du 7', icone: '🥇' },
    table_8_master: { id: 'table_8_master', nom: 'Maître du 8', icone: '🥇' },
    table_9_master: { id: 'table_9_master', nom: 'Maître du 9', icone: '🥇' }
};

/**
 * Obtient toutes les statistiques des tables
 * @returns {Object} Statistiques par table
 */
export function obtenirToutesLesStats() {
    const progression = Storage.chargerProgression();
    return progression.statistiques || {};
}

/**
 * Obtient le niveau pour une table spécifique
 * @param {number} table - Numéro de la table
 * @returns {number} Niveau de maîtrise (1-5)
 */
export function obtenirNiveauTable(table) {
    const stats = Storage.obtenirStatistiquesTable(table);
    
    if (stats.tentatives === 0) return 1;
    
    const tauxReussite = stats.reussites / stats.tentatives;
    
    // Calcul du niveau basé sur le taux de réussite et le nombre de tentatives
    if (tauxReussite >= 0.95 && stats.tentatives >= 50) return 5; // Maître
    if (tauxReussite >= 0.85 && stats.tentatives >= 30) return 4; // Expert
    if (tauxReussite >= 0.75 && stats.tentatives >= 20) return 3; // Avancé
    if (tauxReussite >= 0.60 && stats.tentatives >= 10) return 2; // Intermédiaire
    return 1; // Débutant
}

/**
 * Met à jour les statistiques d'une table après une session
 * @param {number} table - Numéro de la table
 * @param {number} reussites - Nombre de réussites
 * @param {number} tentatives - Nombre total de tentatives
 */
export function mettreAJourStatsTable(table, reussites, tentatives) {
    const stats = Storage.obtenirStatistiquesTable(table);
    
    const nouvellesStats = {
        reussites: stats.reussites + reussites,
        tentatives: stats.tentatives + tentatives,
        niveau: 0 // Sera recalculé
    };
    
    Storage.mettreAJourStatistiquesTable(table, nouvellesStats);
    
    // Recalculer le niveau
    const nouveauNiveau = obtenirNiveauTable(table);
    Storage.mettreAJourStatistiquesTable(table, { niveau: nouveauNiveau });
    
    return nouvellesStats;
}

/**
 * Obtient le profil complet du joueur
 * @returns {Object} Profil avec nom, avatar, stats globales
 */
export function obtenirProfilJoueur() {
    const progression = Storage.chargerProgression();
    const stats = obtenirStatistiquesGlobales();
    
    return {
        nom: progression.joueur.nom,
        avatar: progression.joueur.avatar,
        etoilesTotales: progression.etoilesTotales || 0,
        badges: progression.badges || [],
        nombreBadges: (progression.badges || []).length,
        ...stats
    };
}

/**
 * Calcule les statistiques globales
 * @returns {Object} Statistiques agrégées
 */
export function obtenirStatistiquesGlobales() {
    const toutesStats = obtenirToutesLesStats();
    
    let totalReussites = 0;
    let totalTentatives = 0;
    let tablesMaitrisees = 0;
    
    for (let i = 2; i <= 9; i++) {
        const stats = toutesStats[`table_${i}`];
        if (stats) {
            totalReussites += stats.reussites;
            totalTentatives += stats.tentatives;
            if (obtenirNiveauTable(i) >= 4) {
                tablesMaitrisees++;
            }
        }
    }
    
    const tauxReussiteGlobal = totalTentatives > 0 
        ? Math.round((totalReussites / totalTentatives) * 100)
        : 0;
    
    return {
        totalReussites,
        totalTentatives,
        tauxReussiteGlobal,
        tablesMaitrisees
    };
}

/**
 * Ajoute des étoiles au total
 * @param {number} nombre - Nombre d'étoiles à ajouter
 * @returns {number} Nouveau total d'étoiles
 */
export function ajouterEtoiles(nombre) {
    return Storage.ajouterEtoiles(nombre);
}

/**
 * Ajoute un badge au joueur
 * @param {string} badgeId - Identifiant du badge
 * @returns {boolean} True si le badge a été ajouté
 */
export function ajouterBadge(badgeId) {
    return Storage.ajouterBadge(badgeId);
}

/**
 * Vérifie si un badge est débloqué
 * @param {string} badgeId - Identifiant du badge
 * @returns {boolean} True si le badge est possédé
 */
export function possedeBadge(badgeId) {
    const progression = Storage.chargerProgression();
    return (progression.badges || []).includes(badgeId);
}

/**
 * Obtient tous les badges possédés
 * @returns {Array} Liste des badges avec leurs infos
 */
export function obtenirBadgesPossedes() {
    const progression = Storage.chargerProgression();
    return (progression.badges || []).map(id => BADGES[id]).filter(b => b);
}

/**
 * Génère les données pour l'affichage de la grille des tables
 * @returns {Array} Tableau d'objets avec infos pour chaque table
 */
export function genererDonneesGrilleTables() {
    const tables = [];
    
    for (let i = 2; i <= 9; i++) {
        const stats = Storage.obtenirStatistiquesTable(i);
        const niveau = obtenirNiveauTable(i);
        const tauxReussite = stats.tentatives > 0
            ? Math.round((stats.reussites / stats.tentatives) * 100)
            : 0;
        
        tables.push({
            numero: i,
            niveau,
            tentatives: stats.tentatives,
            tauxReussite,
            estDebloque: true, // Toutes les tables sont débloquées
            estMaitrisee: niveau >= 4,
            labelNiveau: obtenirLabelNiveau(niveau)
        });
    }
    
    return tables;
}

/**
 * Obtient le label textuel d'un niveau
 * @param {number} niveau - Niveau (1-5)
 * @returns {string} Label du niveau
 */
function obtenirLabelNiveau(niveau) {
    const labels = {
        1: 'Débutant',
        2: 'Intermédiaire',
        3: 'Avancé',
        4: 'Expert',
        5: 'Maître'
    };
    return labels[niveau] || 'Débutant';
}
