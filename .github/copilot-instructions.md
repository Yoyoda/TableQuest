# Instructions pour TableQuest

## Vue d'ensemble
TableQuest est un site éducatif ludique en français pour apprendre les tables de multiplication aux enfants. Hébergé sur GitHub Pages, il propose un système de défis, de récompenses et une difficulté adaptative.

## Architecture technique

### Stack
- **HTML5/CSS3/JavaScript vanilla** : pas de framework, code simple et performant
- **LocalStorage** pour sauvegarder la progression sans backend
- **GitHub Pages** pour l'hébergement (static site)
- **Responsive design** prioritaire (tablettes et mobiles)
- **Modules ES6** pour organiser le code (`type="module"` dans les scripts)

### Structure des fichiers
```
/
├── index.html          # Page d'accueil
├── css/                # Styles (thème ludique, coloré)
├── js/
│   ├── game.js         # Logique des défis
│   ├── progression.js  # Système de niveaux et récompenses
│   ├── difficulty.js   # Adaptation de la difficulté
│   └── storage.js      # Gestion LocalStorage
├── assets/
│   ├── images/         # Illustrations, badges, avatars
│   └── sounds/         # Feedback sonore (optionnel)
└── README.md
```

## Conventions de développement

### Langue et vocabulaire
- **Interface utilisateur** : 100% en français
- **Code et commentaires** : français accepté pour la clarté (ex: `calculerScore`, `niveauDifficulte`)
- **Commits** : en français

### Système de progression
- **Défis** : séries de questions avec objectif (ex: "Résous 10 multiplications de la table de 5")
- **Récompenses** : badges, étoiles, déblocage de nouvelles tables
- **Difficulté adaptative** :
  - Suivre le taux de réussite (ex: >80% → niveau supérieur)
  - Proposer des révisions si <50% de réussite
  - Mélanger tables maîtrisées et tables en apprentissage

### UX/UI pour enfants
- **Design ludique** : couleurs vives, animations douces, feedback positif
- **Accessibilité** : grands boutons, police lisible (min 16px), contraste élevé
- **Feedback immédiat** : animation/son à chaque réponse (succès/erreur encourageant)
- **Éviter la frustration** : pas de chronomètre au début, encouragements même en cas d'erreur

### Données et état
```javascript
// Structure de progression (LocalStorage)
{
  "joueur": { "nom": "Alex", "avatar": "dragon" },
  "statistiques": {
    "table_2": { "reussites": 45, "tentatives": 50, "niveau": 3 },
    "table_5": { "reussites": 30, "tentatives": 35, "niveau": 2 }
  },
  "badges": ["debutant", "table_2_master"],
  "parametres": { "son": true, "difficulte": "adaptatif" }
}
```

### Algorithme de difficulté
1. **Débutant** : tables de 1, 2, 5, 10 (ordre séquentiel)
2. **Intermédiaire** : tables de 3, 4, 6, 9 (ordre mélangé)
3. **Avancé** : toutes les tables (mode aléatoire complet)
4. **Adaptatif** : ajuster automatiquement selon le taux de réussite des 10 dernières réponses

### Fonctionnalités futures
- Chronomètre optionnel (mode challenge)
- Calcul mental élargi (additions, soustractions)
- Mode multijoueur (défis entre amis via partage de lien)
- Statistiques détaillées pour les parents
- Thèmes visuels débloquables

## Exemples de code

### Vérification de réponse avec feedback
```javascript
function verifierReponse(operande1, operande2, reponseUtilisateur) {
  const resultatCorrect = operande1 * operande2;
  const estCorrect = reponseUtilisateur === resultatCorrect;
  
  afficherFeedback(estCorrect);
  mettreAJourStatistiques(operande1, estCorrect);
  
  if (estCorrect) {
    ajouterPoints(10);
    jouerSon('success');
  } else {
    afficherIndice(operande1, operande2);
  }
  
  return estCorrect;
}
```

## Commandes utiles

- **Tester localement** : `python -m http.server 8000` ou extension Live Server
- **Déployer** : Activer GitHub Pages dans Settings → Pages → Branch: main
- **Valider HTML** : [validator.w3.org](https://validator.w3.org/)
