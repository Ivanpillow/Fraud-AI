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
  url.searchParams.set("transaction_id", String(result.transaction_id ?? 0));
  url.searchParams.set("fraud_probability", String(Number(result.fraud_probability ?? 0).toFixed(6)));
  url.searchParams.set("decision", String(result.decision ?? "unknown"));

  const scores = result.model_scores ?? { random_forest: 0, logistic_regression: 0, kmeans_anomaly: 0 };
  url.searchParams.set("random_forest", String(Number(scores.random_forest ?? 0).toFixed(6)));
  url.searchParams.set("logistic_regression", String(Number(scores.logistic_regression ?? 0).toFixed(6)));
  url.searchParams.set("kmeans_anomaly", String(Number(scores.kmeans_anomaly ?? 0).toFixed(6)));
  return url.toString();
}

export function navigateToFraudResult(result: any, backUrl: string) {
  if (typeof window === "undefined") return;

  // Ensure required fields exist and normalize the payload
  const normalized = {
    transaction_id: Number(result?.transaction_id ?? 0),
    fraud_probability: Number(result?.fraud_probability ?? 0),
    decision: String(result?.decision ?? "unknown"),
    model_scores: {
      random_forest: Number(result?.model_scores?.random_forest ?? result?.model_scores?.random_forest ?? 0),
      logistic_regression: Number(result?.model_scores?.logistic_regression ?? result?.model_scores?.logistic_regression ?? 0),
      kmeans_anomaly: Number(result?.model_scores?.kmeans_anomaly ?? result?.model_scores?.kmeans_anomaly ?? 0),
    },
    explanations: result?.explanations,
  } as FraudResultPayload;

  if (!normalized.fraud_probability || normalized.fraud_probability === 0) {
    console.warn("[FraudResult] Warning: fraud_probability is missing or zero", normalized);
  }

  persistFraudResult(normalized);
  window.location.href = buildFraudResultUrl(normalized, backUrl);
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