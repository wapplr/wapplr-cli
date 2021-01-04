/**
 * Add your files to myFiles array"
 * */

const myFiles = [];

/*contentStart [*/
/**
 * Generated content
 * */

/* eslint-disable no-restricted-globals */

/**
 * Generated cache name
 * */

/*cacheName [*/const cacheName = "buildHash";/*]*/

/**
 * Files to be served from cache
 * bundleFiles will replace with bundle files.
 * */

/*bundleFiles [*/const bundleFiles = [];/*]*/

const files = [...bundleFiles, ...myFiles];

function installListener(event) {
    event.waitUntil(
        caches.open(cacheName)
            .then(function(cache) {
                return cache.addAll(files)
                    .then(function() {
                        return self.skipWaiting();
                    })
                    .catch(function(error) {
                        console.error("Failed to cache", error);
                    })
            })
    );
}

function activateListener(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cache) {
                    if (cache !== cacheName) {
                        return caches.delete(cache);
                    }
                    return null;
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
}

function fetchListener(event) {

    let request = event.request;
    if ((request.url && request.url.match("__webpack_hmr")) ||
        (request.url && request.url.match("browser-sync"))  ||
        (request.url && request.url.match("hot-update")) ) {
        return false;
    }

    event.respondWith(
        /**
         * Add caching strategy here
         * e.g. Cache first
         */
        caches.match(request).then(function(response) {
            if (response) {
                return response;
            }
            return fetch(request).then(function(response) {
                let responseToCache = response.clone();
                caches.open(cacheName).then(function(cache) {
                    cache.put(request, responseToCache).catch(function(err) {
                        console.warn(request.url + ": " + err.message);
                    });
                });
                return response;
            });
        })
    );
}

function pushListener(event) {
    /**
     * event.waitUntil(self.registration.showNotification("test notification", {body: event.body}));
     */
}

function syncListener(event) {
    /**
     * Add logic to send requests to backend when sync happens
     * self.registration.showNotification("Syncing Now");
     */
}

/*overridesStart [*/
/**
* your code here
* */
/*] overridesEnd*/

function addListeners() {
    removeListeners();
    self.addEventListener("install", installListener);
    self.addEventListener("activate", activateListener);
    self.addEventListener("fetch", fetchListener);
    self.addEventListener("push", pushListener);
    self.addEventListener("sync", syncListener);
}

function removeListeners() {
    self.removeEventListener("install", installListener);
    self.removeEventListener("activate", activateListener);
    self.removeEventListener("fetch", fetchListener);
    self.removeEventListener("push", pushListener);
    self.removeEventListener("sync", syncListener);
}

addListeners();

/*] contentEnd*/
