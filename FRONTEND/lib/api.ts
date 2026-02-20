/**
 * FastAPI Client - Configurable API layer for backend integration
 * All API calls go through this module for centralized error handling and auth.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions extends RequestInit {
  token?: string;
}

interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      credentials: "include", // Para enviar cookies
    });

    let data = null;
    let error = null;

    if (response.ok) {
      data = await response.json();
    } else {
      const errorData = await response.json().catch(() => ({ detail: "Request failed" }));
      error = errorData.detail || errorData.message || "Request failed";
    }

    return { data, error, status: response.status };
  } catch {
    return { data: null, error: "Network error. Please try again.", status: 0 };
  }
}

// ---- Auth Endpoints ----
export async function loginUser(email: string, password: string) {
  return apiRequest<{ userData: { id: number; full_name: string; email: string; role: string } }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
}

export async function logoutUser() {
  return apiRequest("/auth/logout", {
    method: "POST",
  });
}

// ---- Metrics Endpoints ----
export async function fetchMetrics(token?: string) {
  return apiRequest<{
    global: {
      total_transactions: number;
      total_card_transactions: number;
      total_qr_transactions: number;
      total_frauds: number;
      fraud_rate: number;
    };
    fraud_by_hour: Array<{ hour: number; count: number }>;
    fraud_by_country: Array<{ country: string; count: number }>;
    decisions: Array<{ channel: string; decision: string; count: number }>;
  }>("/metrics", { token });
}

// ---- Transaction Endpoints ----
export async function createTransaction(
  transactionData: {
    user_id: number;
    amount: number;
    merchant: string;
    category: string;
    country: string;
    device_type: string;
    hour: number;
    day_of_week: number;
    is_international: boolean;
  },
  token: string,
) {
  return apiRequest("/transactions", {
    method: "POST",
    body: JSON.stringify(transactionData),
    token,
  });
}

export async function createSimpleTransaction(
  transactionData: {
    user_id: number;
    amount: number;
    merchant: string;
    category: string;
  },
  token: string,
) {
  return apiRequest("/transactions/simple", {
    method: "POST",
    body: JSON.stringify(transactionData),
    token,
  });
}

// ---- QR Transaction Endpoints ----
export async function createQRTransaction(
  qrData: {
    user_id: number;
    amount: number;
    merchant: string;
    category: string;
    country: string;
    device_type: string;
    hour: number;
    day_of_week: number;
    is_international: boolean;
    qr_scan_location?: string;
    qr_scan_distance?: number;
  },
  token: string,
) {
  return apiRequest("/qr-transactions", {
    method: "POST",
    body: JSON.stringify(qrData),
    token,
  });
}

export async function createSimpleQRTransaction(
  qrData: {
    user_id: number;
    amount: number;
    merchant: string;
    category: string;
  },
  token: string,
) {
  return apiRequest("/qr-transactions/simple", {
    method: "POST",
    body: JSON.stringify(qrData),
    token,
  });
}

// ---- Fraud Feedback Endpoints ----
export async function submitFraudFeedback(
  feedbackData: {
    prediction_id: number;
    is_true_fraud: boolean;
    notes?: string;
  },
  token: string,
) {
  return apiRequest("/fraud-feedback", {
    method: "POST",
    body: JSON.stringify(feedbackData),
    token,
  });
}

// ---- Dashboard/Stats Endpoint ----
export async function fetchDashboardStats(token?: string) {
  return apiRequest<{
    total_users: number;
    total_transactions: number;
    total_revenue: number;
    active_users: number;
    total_frauds: number;
    users_change: number;
    transactions_change: number;
    revenue_change: number;
    frauds_change: number;
  }>("/metrics/dashboard-stats", { token });
}

export async function fetchChartData(
  token?: string,
  type: "line" | "bar" | "scatter" = "line",
  period: string = "week"
) {
  const metricsResponse = await fetchMetrics(token);
  
  if (metricsResponse.error) {
    return metricsResponse;
  }

  const { fraud_by_hour } = metricsResponse.data!;
  
  return {
    data: {
      labels: fraud_by_hour.map(d => `${d.hour}:00`),
      datasets: [
        {
          label: "Fraudes por hora",
          data: fraud_by_hour.map(d => d.count),
        }
      ]
    },
    error: null,
    status: 200,
  };
}

export async function fetchDeviceTraffic(token?: string) {
  // Placeholder - puedes implementar esto en el backend más adelante
  return {
    data: [
      { name: "Desktop", value: 45 },
      { name: "Mobile", value: 35 },
      { name: "Tablet", value: 20 },
    ],
    error: null,
    status: 200,
  };
}

export async function fetchLocationTraffic(token?: string) {
  const metricsResponse = await fetchMetrics(token);
  
  if (metricsResponse.error) {
    return metricsResponse;
  }

  const { fraud_by_country } = metricsResponse.data!;
  
  return {
    data: fraud_by_country.map(item => ({
      name: item.country,
      value: item.count,
    })),
    error: null,
    status: 200,
  };
}

export async function fetchTransactionsByHour(token?: string) {
  const metricsResponse = await fetchMetrics(token);
  
  if (metricsResponse.error) {
    return metricsResponse;
  }

  const { fraud_by_hour } = metricsResponse.data!;
  
  return {
    data: fraud_by_hour.map(item => ({
      hour: `${item.hour}:00`,
      amount: item.count * 100, // Estimación
      count: item.count,
    })),
    error: null,
    status: 200,
  };
}

export async function fetchPaymentSummary(token?: string) {
  const metricsResponse = await fetchMetrics(token);
  
  if (metricsResponse.error) {
    return metricsResponse;
  }

  const { global, decisions } = metricsResponse.data!;
  
  // Calcular estadísticas basadas en las decisiones
  const approved = decisions
    .filter(d => d.decision === "approved")
    .reduce((sum, d) => sum + d.count, 0);
  
  const declined = decisions
    .filter(d => d.decision === "declined")
    .reduce((sum, d) => sum + d.count, 0);
  
  const pending = decisions
    .filter(d => d.decision === "pending")
    .reduce((sum, d) => sum + d.count, 0);
  
  return {
    data: {
      total_payments: global.total_transactions,
      successful: approved,
      failed: declined,
      pending: pending,
      average_amount: 0, // Placeholder
    },
    error: null,
    status: 200,
  };
}

// ---- Review / Fraud Endpoints (Placeholder) ----
export async function fetchFlaggedTransactions(token?: string, status?: "block" | "review") {
  // Este endpoint necesitaría ser implementado en el backend
  // Por ahora devolvemos un array vacío
  return {
    data: [],
    error: null,
    status: 200,
  };
}

export async function updateTransactionStatus(
  token: string,
  transactionId: string,
  action: "approve" | "block"
) {
  // Este endpoint necesitaría ser implementado en el backend
  return {
    data: { success: true },
    error: null,
    status: 200,
  };
}

// ---- Notifications Endpoint ----
export async function fetchNotifications(token?: string) {
  return apiRequest<Array<{
    id: string;
    prediction_id: number;
    type: "block" | "review";
    message: string;
    amount: number;
    timestamp: string;
    transaction_id: number;
    channel: string;
    fraud_probability: number;
  }>>("/notifications", { token });
}

// ---- Update Notification Decision ----
export async function updateNotificationDecision(
  predictionId: number,
  decision: "approve" | "block" | "review",
  token?: string
) {
  return apiRequest<{
    status: string;
    message: string;
    prediction_id: number;
    new_decision: string;
  }>(`/notifications/${predictionId}/decision`, {
    method: "PATCH",
    body: JSON.stringify({ decision }),
    token,
  });
}

export { API_BASE_URL };
