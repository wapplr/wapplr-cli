/**
 * Add your files to myFiles array"
 * */

const myFiles = [];

/**
 * Add your offline url"
 * */

const myOfflineUrl = "/offline";

/**
 * Add your urls to myUrls array"
 * */

const myUrls = [];

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

const urls = [...myUrls];

function installListener(event) {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(cacheName);
            try {
                await cache.addAll(files);
            } catch (e){
                console.log("[PWA] Failed to cache", e);
            }
            try {

                const request = new Request(myOfflineUrl, {
                    mode: 'cors',
                    credentials: 'omit'
                });

                await cache.add(request);
            } catch (e){
                console.log("[PWA] Failed to cache offline page:", myOfflineUrl, e);
            }
        })()
    );

    self.skipWaiting();

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

    if (event.request.mode === "navigate" || event.request.mode === "no-cors") {
        event.respondWith(

            /**
             * Add caching strategy here
             * e.g. Cache first
             */

            (async () => {

                const cache = await caches.open(cacheName);

                try {
                    // First, try to use the navigation preload response if it's supported.
                    const preloadResponse = await event.preloadResponse;
                    if (preloadResponse) {
                        return preloadResponse;
                    }

                    // Always try the network first.
                    let networkResponse;
                    let networkError;
                    try {

                        const newRequest = new Request(event.request, {
                            mode: 'cors',
                            credentials: 'omit'
                        });

                        networkResponse = await fetch(newRequest);

                    } catch (e){
                        networkError = e;
                        console.log("[PWA] Network fetch failed, it is now trying load it from cache:", request.url, e.message);
                    }
                    if (networkResponse){
                        try {
                            const url = new URL(request.url);
                            if (urls.indexOf(url.pathname) > -1 || files.indexOf(url.pathname) > -1) {
                                const responseToCache = networkResponse.clone();
                                await cache.put(request, responseToCache)
                            }
                        } catch (e){
                            console.log("[PWA] The response could not be saved:", request.url, e.message);
                        }
                    }

                    if (networkError){
                        // noinspection ExceptionCaughtLocallyJS
                        throw networkError;
                    }
                    return networkResponse;

                } catch (error) {

                    let cachedResponse;
                    try {
                        cachedResponse = await caches.match(request);
                    } catch (e){
                        console.log("[PWA] The response could not be loaded from cache, it is now trying load the offline page:", request.url, e.message);
                    }
                    if (cachedResponse){
                        return cachedResponse;
                    }

                    let offlineResponse;

                    try {
                        offlineResponse = await cache.match(myOfflineUrl);
                    } catch (e){
                        console.log("[PWA] The offline page could not be loaded:", myOfflineUrl, e.message);
                    }

                    if (!offlineResponse) {
                        console.log("[PWA] The offline page could not be loaded:", myOfflineUrl, offlineResponse);
                    }

                    return offlineResponse;

                }
            })()
        );
    }
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
