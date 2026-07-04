/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

// The Serwist build injects the precache manifest (content-hashed build assets).
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // Update is user-driven via the in-app toast, never a silent asset swap mid-flow.
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  // defaultCache is NetworkFirst for HTML/RSC, so a fresh deploy shows on the next
  // navigation; only content-hashed assets are cache-first.
  runtimeCaching: defaultCache,
});

// Answers the { type: 'SKIP_WAITING' } message the update prompt posts.
serwist.addEventListeners();
