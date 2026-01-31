// Service Worker pour TableQuest
const CACHE_NAME = 'tablequest-v1';

// Déterminer le chemin de base (local ou GitHub Pages)
const BASE_PATH = self.location.pathname.includes('/TableQuest/') ? '/TableQuest' : '';

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/parents.html`,
  `${BASE_PATH}/css/style.css`,
  `${BASE_PATH}/js/main.js`,
  `${BASE_PATH}/js/game.js`,
  `${BASE_PATH}/js/difficulty.js`,
  `${BASE_PATH}/js/progression.js`,
  `${BASE_PATH}/js/storage.js`,
  `${BASE_PATH}/js/ui.js`
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error('Erreur lors de la mise en cache:', err);
        throw err;
      })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Stratégie de cache: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la requête réussit, on met à jour le cache
        if (response && response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si le réseau échoue, on utilise le cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Si pas de cache disponible, retourner une page d'erreur basique
          if (event.request.mode === 'navigate') {
            return caches.match(`${BASE_PATH}/index.html`);
          }
        });
      })
  );
});
