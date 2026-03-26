// Server-side Nominatim geocoding for Madagascar
// Rate limited to 1 request/second per Nominatim usage policy

let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastRequestTime = Date.now();
}

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

// Forward geocode: address → coordinates
export async function geocodeAddress(
  address: string,
  city?: string
): Promise<GeocodingResult | null> {
  await rateLimit();

  const query = city ? `${address}, ${city}, Madagascar` : `${address}, Madagascar`;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=mg`,
      {
        headers: {
          'User-Agent': 'MadaSpotBot/1.0 (contact@madaspot.mg)',
        },
      }
    );

    if (!response.ok) return null;

    const results = await response.json();
    if (results.length === 0) return null;

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
      displayName: results[0].display_name,
    };
  } catch {
    return null;
  }
}

// Reverse geocode: coordinates → address
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  await rateLimit();

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'MadaSpotBot/1.0 (contact@madaspot.mg)',
        },
      }
    );

    if (!response.ok) return null;

    const result = await response.json();
    return result.display_name || null;
  } catch {
    return null;
  }
}
