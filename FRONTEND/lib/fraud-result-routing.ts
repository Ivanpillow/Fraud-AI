export interface FraudResultPayload {
  transaction_id: number;
  fraud_probability: number;
  decision: string;
  model_scores: {
    random_forest: number;
    logistic_regression: number;
    kmeans_anomaly: number;
  };
  explanations?: unknown;
}

const STORAGE_KEY = "fraudai:last-fraud-result";

export function persistFraudResult(result: FraudResultPayload) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function readPersistedFraudResult(): FraudResultPayload | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as FraudResultPayload;
  } catch {
    return null;
  }
}

export function clearPersistedFraudResult() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function buildFraudResultUrl(result: FraudResultPayload, backUrl: string) {
  const url = new URL("/fraud-result", window.location.origin);
  url.searchParams.set("backUrl", backUrl);
  // Ensure all numeric values are properly stringified
  url.searchParams.set("transaction_id", String(result.transaction_id));
  url.searchParams.set("fraud_probability", String(Number(result.fraud_probability).toFixed(6)));
  url.searchParams.set("decision", String(result.decision));
  url.searchParams.set("random_forest", String(Number(result.model_scores.random_forest).toFixed(6)));
  url.searchParams.set("logistic_regression", String(Number(result.model_scores.logistic_regression).toFixed(6)));
  url.searchParams.set("kmeans_anomaly", String(Number(result.model_scores.kmeans_anomaly).toFixed(6)));
  return url.toString();
}

export function navigateToFraudResult(result: FraudResultPayload, backUrl: string) {
  if (typeof window === "undefined") return;

  // Validate result before persisting
  if (!result.fraud_probability || result.fraud_probability === 0) {
    console.warn("[FraudResult] Warning: fraud_probability is missing or zero", result);
  }

  persistFraudResult(result);
  window.location.href = buildFraudResultUrl(result, backUrl);
}

export function parseFraudResultFromSearchParams(searchParams: { get(name: string): string | null }): FraudResultPayload | null {
  const transactionIdStr = searchParams.get("transaction_id");
  const fraudProbabilityStr = searchParams.get("fraud_probability");
  const decision = searchParams.get("decision");

  if (!transactionIdStr || !fraudProbabilityStr || !decision) {
    console.warn("[FraudResult] Missing required search params", {
      transactionIdStr,
      fraudProbabilityStr,
      decision,
    });
    return null;
  }

  const transactionId = Number(transactionIdStr);
  const fraudProbability = Number(fraudProbabilityStr);

  if (!Number.isFinite(transactionId) || !Number.isFinite(fraudProbability)) {
    console.warn("[FraudResult] Invalid numeric conversion", {
      transactionId,
      fraudProbability,
    });
    return null;
  }

  return {
    transaction_id: transactionId,
    fraud_probability: fraudProbability,
    decision,
    model_scores: {
      random_forest: Number(searchParams.get("random_forest") || "0"),
      logistic_regression: Number(searchParams.get("logistic_regression") || "0"),
      kmeans_anomaly: Number(searchParams.get("kmeans_anomaly") || "0"),
    },
  };
}