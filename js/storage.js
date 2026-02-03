/**
 * Module de gestion du stockage local (LocalStorage)
 * Gère la sauvegarde et le chargement de la progression du joueur
 * Supporte plusieurs profils
 */

const CLE_STORAGE = 'tablequest_progression';
const CLE_PROFILS = 'tablequest_profils';
const CLE_PROFIL_ACTIF = 'tablequest_profil_actif';

/**
 * Valeurs par défaut des paramètres
 */
export const PARAMETRES_PAR_DEFAUT = {
    son: true,
    difficulte: 'adaptatif',
    delaiValidation: 1500, // Durée en ms avant passage à la question suivante après une bonne réponse
    nombreQuestions: 10     // Nombre de questions par session
};

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
        ...PARAMETRES_PAR_DEFAUT
    },
    etoilesTotales: 0
};

/**
 * === GESTION DES PROFILS MULTIPLES ===
 */

/**
 * Obtient la liste de tous les profils
 * @returns {Array} Liste des profils {id, nom, avatar, dateCreation, derniereConnexion}
 */
export function listerProfils() {
    try {
        const data = localStorage.getItem(CLE_PROFILS);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des profils:', error);
    }
    return [];
}

/**
 * Obtient l'ID du profil actuellement actif
 * @returns {string|null} ID du profil actif ou null
 */
export function obtenirProfilActif() {
    return localStorage.getItem(CLE_PROFIL_ACTIF);
}

/**
 * Définit le profil actif
 * @param {string} profilId - ID du profil à activer
 */
export function definirProfilActif(profilId) {
    if (profilId) {
        localStorage.setItem(CLE_PROFIL_ACTIF, profilId);
        
        // Mettre à jour la date de dernière connexion
        const profils = listerProfils();
        const profil = profils.find(p => p.id === profilId);
        if (profil) {
            profil.derniereConnexion = new Date().toISOString();
            sauvegarderListeProfils(profils);
        }
    } else {
        localStorage.removeItem(CLE_PROFIL_ACTIF);
    }
}

/**
 * Crée un nouveau profil
 * @param {string} nom - Nom du profil
 * @param {string} avatar - Avatar du profil
 * @returns {Object} Profil créé avec son ID
 */
export function creerProfil(nom, avatar = 'dragon') {
    const profils = listerProfils();
    const id = 'profil_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    
    const nouveauProfil = {
        id,
        nom,
        avatar,
        dateCreation: new Date().toISOString(),
        derniereConnexion: new Date().toISOString()
    };
    
    profils.push(nouveauProfil);
    sauvegarderListeProfils(profils);
    
    // Créer une progression vide pour ce profil
    const progression = {
        ...PROGRESSION_PAR_DEFAUT,
        joueur: { nom, avatar }
    };
    sauvegarderProgressionProfil(id, progression);
    
    return nouveauProfil;
}

/**
 * Modifie un profil existant
 * @param {string} profilId - ID du profil
 * @param {Object} modifications - Modifications à appliquer {nom?, avatar?}
 * @returns {boolean} Succès de l'opération
 */
export function modifierProfil(profilId, modifications) {
    const profils = listerProfils();
    const profil = profils.find(p => p.id === profilId);
    
    if (!profil) return false;
    
    if (modifications.nom) profil.nom = modifications.nom;
    if (modifications.avatar) profil.avatar = modifications.avatar;
    
    sauvegarderListeProfils(profils);
    
    // Mettre à jour aussi la progression
    const progression = chargerProgressionProfil(profilId);
    if (modifications.nom) progression.joueur.nom = modifications.nom;
    if (modifications.avatar) progression.joueur.avatar = modifications.avatar;
    sauvegarderProgressionProfil(profilId, progression);
    
    return true;
}

/**
 * Supprime un profil
 * @param {string} profilId - ID du profil à supprimer
 * @returns {boolean} Succès de l'opération
 */
export function supprimerProfil(profilId) {
    const profils = listerProfils();
    const index = profils.findIndex(p => p.id === profilId);
    
    if (index === -1) return false;
    
    profils.splice(index, 1);
    sauvegarderListeProfils(profils);
    
    // Supprimer aussi la progression
    try {
        localStorage.removeItem(`${CLE_STORAGE}_${profilId}`);
    } catch (error) {
        console.error('Erreur lors de la suppression de la progression:', error);
    }
    
    // Si c'était le profil actif, le désactiver
    if (obtenirProfilActif() === profilId) {
        definirProfilActif(null);
    }
    
    return true;
}

/**
 * Sauvegarde la liste des profils
 * @param {Array} profils - Liste des profils
 */
function sauvegarderListeProfils(profils) {
    try {
        localStorage.setItem(CLE_PROFILS, JSON.stringify(profils));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des profils:', error);
    }
}

/**
 * Charge la progression d'un profil spécifique
 * @param {string} profilId - ID du profil
 * @returns {Object} Progression du profil
 */
export function chargerProgressionProfil(profilId) {
    try {
        const data = localStorage.getItem(`${CLE_STORAGE}_${profilId}`);
        if (data) {
            const progression = JSON.parse(data);
            // Fusionner avec les valeurs par défaut pour assurer la compatibilité
            return {
                ...PROGRESSION_PAR_DEFAUT,
                ...progression,
                parametres: {
                    ...PARAMETRES_PAR_DEFAUT,
                    ...progression.parametres
                }
            };
        }
    } catch (error) {
        console.error('Erreur lors du chargement de la progression du profil:', error);
    }
    return { ...PROGRESSION_PAR_DEFAUT };
}

/**
 * Sauvegarde la progression d'un profil spécifique
 * @param {string} profilId - ID du profil
 * @param {Object} progression - Progression à sauvegarder
 */
export function sauvegarderProgressionProfil(profilId, progression) {
    try {
        localStorage.setItem(`${CLE_STORAGE}_${profilId}`, JSON.stringify(progression));
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la progression du profil:', error);
        return false;
    }
}

/**
 * === FONCTIONS DE COMPATIBILITÉ (utilisent le profil actif) ===
 */

/**
 * Charge la progression depuis le localStorage (profil actif)
 * @returns {Object} Objet de progression
 */
export function chargerProgression() {
    const profilActif = obtenirProfilActif();
    
    if (profilActif) {
        return chargerProgressionProfil(profilActif);
    }
    
    // Compatibilité avec l'ancien système (migration)
    try {
        const data = localStorage.getItem(CLE_STORAGE);
        if (data) {
            const progression = JSON.parse(data);
            return {
                ...PROGRESSION_PAR_DEFAUT,
                ...progression,
                parametres: {
                    ...PARAMETRES_PAR_DEFAUT,
                    ...progression.parametres
                }
            };
        }
    } catch (error) {
        console.error('Erreur lors du chargement de la progression:', error);
    }
    return { ...PROGRESSION_PAR_DEFAUT };
}

/**
 * Sauvegarde la progression dans le localStorage (profil actif)
 * @param {Object} progression - Objet de progression à sauvegarder
 */
export function sauvegarderProgression(progression) {
    const profilActif = obtenirProfilActif();
    
    if (profilActif) {
        return sauvegarderProgressionProfil(profilActif, progression);
    }
    
    // Compatibilité avec l'ancien système
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
 * Réinitialise un paramètre à sa valeur par défaut
 * @param {string} nomParametre - Nom du paramètre à réinitialiser
 */
export function reinitialiserParametre(nomParametre) {
    const progression = chargerProgression();
    if (PARAMETRES_PAR_DEFAUT.hasOwnProperty(nomParametre)) {
        progression.parametres[nomParametre] = PARAMETRES_PAR_DEFAUT[nomParametre];
        sauvegarderProgression(progression);
        return progression.parametres[nomParametre];
    }
    return null;
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

/**
 * Déconnecte le profil actif (logout)
 */
export function deconnecterProfil() {
    definirProfilActif(null);
}

/**
 * Migration des données de l'ancien système vers le nouveau (multi-profils)
 * À appeler au démarrage si nécessaire
 */
export function migrerVersMultiProfils() {
    try {
        const data = localStorage.getItem(CLE_STORAGE);
        
        // Si il y a des données dans l'ancien format et pas de profils
        if (data && listerProfils().length === 0) {
            const progression = JSON.parse(data);
            
            // Si le joueur a un nom, créer un profil pour lui
            if (progression.joueur && progression.joueur.nom) {
                const profil = creerProfil(progression.joueur.nom, progression.joueur.avatar);
                
                // Copier la progression vers le nouveau profil
                sauvegarderProgressionProfil(profil.id, progression);
                
                // Activer ce profil
                definirProfilActif(profil.id);
                
                // Supprimer l'ancienne donnée
                localStorage.removeItem(CLE_STORAGE);
                
                console.log('✅ Migration vers multi-profils réussie');
                return true;
            }
        }
    } catch (error) {
        console.error('Erreur lors de la migration:', error);
    }
    return false;
}
