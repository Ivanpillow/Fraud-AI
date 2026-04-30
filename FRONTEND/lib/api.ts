/**
 * FastAPI Client - Configurable API layer for backend integration
 * All API calls go through this module for centralized error handling and auth.
 */

const API_BASE_URL = "/api";

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

// Endpoint para login
export async function loginUser(email: string, password: string) {
  return apiRequest<{ userData: { id: number; full_name: string; email: string; role: string; merchant_name?: string; is_admin?: boolean; is_superadmin?: boolean } }>(
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

// Endpoint para metricas generales del dashboard
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

// Endpoints para crear transacciones (usados en el simulador de transacciones)
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
    card_number: string;
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

// Endpoint para crear transaccion a través de QR pero tiene datos adicionales para análisis
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

export type QrSessionStatus = "pending" | "cancelled" | "completed" | "returned";

async function qrSessionRequest<T = unknown>(
  endpoint: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (!apiKey) {
    return { data: null, error: "Missing API key", status: 0 };
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
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

export async function createQrSession(
  apiKey: string,
  transactionId: number,
  status: QrSessionStatus = "pending"
) {
  return qrSessionRequest<{ transaction_id: number; status: QrSessionStatus }>(
    "/qr-sessions",
    apiKey,
    {
      method: "POST",
      body: JSON.stringify({ transaction_id: transactionId, status }),
    }
  );
}

export async function fetchQrSessionStatus(apiKey: string, transactionId: number) {
  return qrSessionRequest<{ transaction_id: number; status: QrSessionStatus; updated_at: string }>(
    `/qr-sessions/${transactionId}`,
    apiKey,
    {
      method: "GET",
    }
  );
}

export async function updateQrSessionStatus(
  apiKey: string,
  transactionId: number,
  status: QrSessionStatus
) {
  return qrSessionRequest<{ transaction_id: number; status: QrSessionStatus }>(
    `/qr-sessions/${transactionId}`,
    apiKey,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

// Retroalimentación de fraude
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

// Endpoint para estadisticas del dashboard
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

// De momento esto es de prueba

export async function fetchDeviceTraffic(token?: string) {
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
      amount: item.count * 100, 
      count: item.count,
    })),
    error: null,
    status: 200,
  };
}

// Aqui terminan los endpoints de prueba

export async function fetchPaymentSummary(token?: string) {
  const metricsResponse = await fetchMetrics(token);
  
  if (metricsResponse.error) {
    return metricsResponse;
  }

  const { global, decisions } = metricsResponse.data!;
  
  // Calcular estadísticas basadas en las decisiones
  const approved = decisions
    .filter(d => d.decision === "allow")
    .reduce((sum, d) => sum + d.count, 0);
  
  const declined = decisions
    .filter(d => d.decision === "block")
    .reduce((sum, d) => sum + d.count, 0);
  
  const pending = decisions
    .filter(d => d.decision === "review")
    .reduce((sum, d) => sum + d.count, 0);
  
  return {
    data: {
      total_payments: global.total_transactions,
      successful: approved,
      failed: declined,
      pending: pending,
      average_amount: 0, 
    },
    error: null,
    status: 200,
  };
}

// Endpoint para obtener transacciones marcadas para revisión o bloqueo (lo de la sección de review)
export async function fetchFlaggedTransactions(token?: string, status?: "block" | "review") {
  // Falta implementacion en el backend
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
// Endpoint para obtener las notificaciones
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
    decision?: string | null;
    final_decision?: "allow" | "block" | "review" | null;
    reviewed?: boolean;
    shipping_country?: string | null;
    shipping_state?: string | null;
    shipping_city?: string | null;
    shipping_postal_code?: string | null;
    shipping_street?: string | null;
    shipping_reference?: string | null;
    shipping_full_name?: string | null;
    shipping_phone?: string | null;
    explanations?: Array<{
      feature_name?: string;
      contribution_value?: number;
      direction?: string;
    }>;
  }>>("/notifications", {
    method: "GET",
    token,
  });
}

// Endpoint para obtener el historial de transacciones revisadas
export async function fetchFraudHistory(token?: string) {
  return apiRequest<Array<{
    id: string;
    prediction_id: number;
    type: "block" | "review" | "allow";
    message: string;
    amount: number;
    timestamp: string;
    transaction_id: number;
    channel: string;
    fraud_probability: number;
    decision?: string | null;
    final_decision?: "allow" | "block" | "review" | null;
    reviewed?: boolean;
    shipping_country?: string | null;
    shipping_state?: string | null;
    shipping_city?: string | null;
    shipping_postal_code?: string | null;
    shipping_street?: string | null;
    shipping_reference?: string | null;
    shipping_full_name?: string | null;
    shipping_phone?: string | null;
    explanations?: Array<{
      feature_name?: string;
      contribution_value?: number;
      direction?: string;
    }>;
  }>>("/notifications/history", {
    method: "GET",
    token,
  });
}
// Endpoint para actualizacion de decision dentro de la notificacion (Falta implementar)
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





// Endpoints para métricas específicas del dashboard (usados en las cards y gráficos individuales)

export async function fetchWeeklyTransactions(token?: string) {
  return apiRequest<
    Array<{ date: string; total: number }>
  >("/metrics/weekly-transactions", { token });
}

export async function fetchFraudFunnel(token?: string, merchantId?: number) {
  return apiRequest<{
    total: number;
    decisions: Array<{ name: string; value: number }>;
  }>(withMerchantQuery("/metrics/fraud-funnel", merchantId), { token });
}

export async function fetchTransactionsByCountry(token?: string, merchantId?: number) {
  return apiRequest<
    Array<{ name: string; value: number }>
  >(withMerchantQuery("/metrics/transactions-by-country", merchantId), { token });
}


// 
export async function fetchOverviewMetrics(token?: string, merchantId?: number) {
  return apiRequest<{
    stats: {
      total_users: number;
      total_transactions: number;
      total_revenue: number;
      active_users: number;
    };
    decisions: Record<string, number>;
    transactions_by_hour: Array<{
      hour: number;
      amount: number;
      count: number;
    }>;
  }>(withMerchantQuery("/metrics/overview", merchantId), { token });
}

export async function fetchTrends(merchantId?: number) {
  return apiRequest<{
    line: any[];
    bar: any[];
    scatter: any[];
  }>(withMerchantQuery("/metrics/trends", merchantId));
}


// ==============================
// Gestionar usuarios
// ==============================


export type User = {
  id: number
  email: string
  full_name: string
  role: string
  merchant: string
  is_active: boolean
  is_admin: boolean
}

function withMerchantQuery(endpoint: string, merchantId?: number): string {
  if (merchantId === undefined || merchantId === null) {
    return endpoint
  }

  return `${endpoint}?merchant_id=${merchantId}`
}

// Obtener usuarios del merchant
export async function fetchMerchantUsers(merchantId?: number): Promise<User[]> {
  const response = await apiRequest<{ data: User[] }>(withMerchantQuery("/users", merchantId))

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to load users")
  }

  return response.data.data
}


  // Endpoint para crear un nuevo usuario
  export async function createUser(data: {
    email: string
    full_name: string
    password: string
    role: string
  }, merchantId?: number) {
    return apiRequest(withMerchantQuery("/users", merchantId), {
      method: "POST",
      body: JSON.stringify(data)
    })
  }


  export async function toggleUser(userId: number, merchantId?: number) {
    return apiRequest(withMerchantQuery(`/users/${userId}/toggle`, merchantId), {
      method: "PATCH"
    })
  }


  // Endpoint para actualizar un usuario existente
  export async function updateUser(
    userId: number,
    data: {
      email: string
      full_name: string
      role: string
    },
    merchantId?: number
  ) {
    return apiRequest(withMerchantQuery(`/users/${userId}`, merchantId), {
      method: "PUT",
      body: JSON.stringify(data)
    })
  }

  // Endpoint para eliminar un usuario
  export async function deleteUser(userId: number, merchantId?: number) {
    return apiRequest(withMerchantQuery(`/users/${userId}`, merchantId), {
      method: "DELETE"
    })
  }

  export async function resetUserPassword(
    userId: number,
    newPassword: string,
    merchantId?: number
  ) {
    return apiRequest(withMerchantQuery(`/users/${userId}/reset-password`, merchantId), {
      method: "PATCH",
      body: JSON.stringify({ new_password: newPassword })
    })
  }





// ============================
// Roles
// ============================

// Endpoint para obtener roles de la empresa
export async function fetchRoles(merchantId?: number) {
  const res = await apiRequest<{ 
    data: { role_id: number; name: string; is_admin: boolean }[] 
  }>(withMerchantQuery("/roles", merchantId))

  if (res.error || !res.data) {
    throw new Error(res.error || "Failed to load roles")
  }

  return res.data.data
}

// Endpoint para crear un nuevo rol
export async function createRole(name: string, merchantId?: number, is_admin: boolean = false) {
  return apiRequest(withMerchantQuery("/roles", merchantId), {
    method: "POST",
    body: JSON.stringify({ name, is_admin })
  })
}

// Endpoint para actualizar un rol existente
export async function updateRole(roleId: number, name: string, merchantId?: number) {
  return apiRequest(withMerchantQuery(`/roles/${roleId}`, merchantId), {
    method: "PUT",
    body: JSON.stringify({ name })
  })
}


// Endpoint para eliminar un rol
export async function deleteRole(roleId: number, merchantId?: number) {

  const res = await apiRequest(withMerchantQuery(`/roles/${roleId}`, merchantId), {
    method: "DELETE"
  })

  if (res.error) {
    throw new Error(res.error)
  }

  return res.data
}


// ============================
// Gestionar Comercios (Merchants)
// ============================

export type APIKey = {
  api_key_id: number;
  key_hash: string;
  label: string | null;
  status: string;
  created_at: string;
};

export type Merchant = {
  merchant_id: number;
  name: string;
  status: string;
  plan_type: string;
  created_at: string;
  api_keys: APIKey[];
};

// Obtener todos los comercios
export async function fetchMerchants() {
  const res = await apiRequest<{ data: Merchant[] }>("/merchants")

  if (res.error || !res.data) {
    throw new Error(res.error || "Failed to load merchants")
  }

  return res.data.data
}

// Crear un nuevo comercio
export async function createMerchant(data: {
  name: string;
  status: string;
  plan_type: string;
  key: string;
}) {
  return apiRequest("/merchants", {
    method: "POST",
    body: JSON.stringify(data)
  })
}

// Obtener un comercio específico
export async function getMerchant(merchantId: number) {
  return apiRequest(`/merchants/${merchantId}`, {
    method: "GET"
  })
}

// Actualizar comercio
export async function updateMerchant(
  merchantId: number,
  data: {
    name: string;
    label?: string;
  }
){
  return apiRequest(`/merchants/${merchantId}`, {
    method: "PUT",
    body: JSON.stringify(data)
  })
}

// Cambiar estado de comercio
export async function toggleMerchantStatus(
  merchantId: number,
  status: string
) {
  return apiRequest(`/merchants/${merchantId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  })
}

// Eliminar comercio
export async function deleteMerchant(merchantId: number) {
  const res = await apiRequest(`/merchants/${merchantId}`, {
    method: "DELETE"
  })

  if (res.error) {
    throw new Error(res.error)
  }

  return res.data
}

// ============================
// Perfil del usuario
// ============================

export async function updateUserProfile(full_name: string) {
  return apiRequest("/auth/profile", {
    method: "PUT",
    body: JSON.stringify({ full_name })
  })
}

export async function changeUserPassword(current_password: string, new_password: string) {
  return apiRequest("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ current_password, new_password })
  })
}

export { API_BASE_URL };
