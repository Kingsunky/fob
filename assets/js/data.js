// FOB Data Fetcher & Cache Layer (PRD Section 23.5)
import { ENDPOINTS } from "./config.js";

const CACHE_PREFIX = "fob_cache_";
const FETCH_TIMEOUT_MS = 6000;

export async function loadData(endpointKey) {
  const url = ENDPOINTS[endpointKey] || endpointKey;
  const cacheKey = CACHE_PREFIX + endpointKey;

  // 1. Try network fetch with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      // Cache successful response in localStorage
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data
        }));
      } catch (storageErr) {
        // LocalStorage quota or blocked, ignore quietly
      }
      return data;
    }
  } catch (err) {
    // Network failed or timed out; fall back to cache
  }

  // 2. Check localStorage cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.data;
    }
  } catch (cacheErr) {
    // Ignore cache parse error
  }

  // 3. Fallback: direct fetch without cache headers
  try {
    const fallbackRes = await fetch(url);
    if (fallbackRes.ok) {
      return await fallbackRes.json();
    }
  } catch (fallbackErr) {
    console.warn("Could not load data for:", endpointKey);
  }

  return null;
}
