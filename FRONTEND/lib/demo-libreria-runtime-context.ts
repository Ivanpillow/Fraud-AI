export type DemoRuntimeCheckoutContext = {
  userId: number;
  merchantCategory: string;
  country: string;
  deviceType: "mobile" | "web";
  hour: number;
  dayOfWeek: number;
  latitude: number;
  longitude: number;
  deviceChangeFlag: boolean;
};

const USER_ID_KEY = "demo_libreria_user_id_v1";
const DEVICE_FINGERPRINT_KEY = "demo_libreria_device_fingerprint_v1";

const SUPPORTED_COUNTRIES = new Set(["MX", "US", "CA", "BR", "ES", "FR"]);

const COUNTRY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  MX: { latitude: 19.4326, longitude: -99.1332 },
  US: { latitude: 38.9072, longitude: -77.0369 },
  CA: { latitude: 45.4215, longitude: -75.6972 },
  BR: { latitude: -15.7939, longitude: -47.8828 },
  ES: { latitude: 40.4168, longitude: -3.7038 },
  FR: { latitude: 48.8566, longitude: 2.3522 },
};

function detectCountryFromLocale(): string {
  return "MX";
}

function detectDeviceType(): "mobile" | "web" {
  if (typeof window === "undefined") return "web";
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(ua);
  return isMobile ? "mobile" : "web";
}

function getOrCreateDemoUserId(): number {
  if (typeof window === "undefined") return 1;

  const saved = window.localStorage.getItem(USER_ID_KEY);
  const parsed = Number(saved);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  const generated = Math.floor(Math.random() * 90000) + 10000;
  window.localStorage.setItem(USER_ID_KEY, String(generated));
  return generated;
}

function calculateDeviceChangeFlag(deviceType: "mobile" | "web"): boolean {
  if (typeof window === "undefined") return false;

  const fingerprint = [
    navigator.userAgent,
    navigator.platform,
    navigator.language,
    `${window.screen.width}x${window.screen.height}`,
    deviceType,
  ].join("|");

  const previous = window.localStorage.getItem(DEVICE_FINGERPRINT_KEY);
  window.localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint);

  return Boolean(previous && previous !== fingerprint);
}

function mapCatalogToMerchantCategory(): string {
  // En backend no hay catálogo de libros específico; para un ecommerce de libros se usa la categoría retail.
  return "retail";
}

export function getDemoLibreriaRuntimeCheckoutContext(): DemoRuntimeCheckoutContext {
  const now = new Date();
  const country = detectCountryFromLocale();
  const deviceType = detectDeviceType();
  const coords = COUNTRY_COORDS[country] ?? COUNTRY_COORDS.MX;

  const dayJs = now.getDay();
  const dayOfWeek = dayJs === 0 ? 7 : dayJs;

  return {
    userId: getOrCreateDemoUserId(),
    merchantCategory: mapCatalogToMerchantCategory(),
    country,
    deviceType,
    hour: now.getHours(),
    dayOfWeek,
    latitude: coords.latitude,
    longitude: coords.longitude,
    deviceChangeFlag: calculateDeviceChangeFlag(deviceType),
  };
}
