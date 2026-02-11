/**
 * Mock data for development. Replace with real FastAPI calls in production.
 * Toggle NEXT_PUBLIC_USE_MOCK=true to use mock data.
 */

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export const mockStats = {
  total_users: 7265,
  total_transactions: 3671,
  total_revenue: 58211,
  active_users: 2318,
  users_change: 11.01,
  transactions_change: -0.03,
  revenue_change: 15.03,
  active_change: 6.08,
};

export const mockLineChartData = [
  { name: "Jan", users: 1200, transactions: 800, revenue: 4200 },
  { name: "Feb", users: 1900, transactions: 1200, revenue: 5800 },
  { name: "Mar", users: 2100, transactions: 1800, revenue: 7200 },
  { name: "Apr", users: 3200, transactions: 2400, revenue: 9100 },
  { name: "May", users: 2800, transactions: 2100, revenue: 8400 },
  { name: "Jun", users: 3100, transactions: 2600, revenue: 10200 },
];

export const mockBarChartData = [
  { name: "Linux", value: 145000 },
  { name: "Mac", value: 168000 },
  { name: "iOS", value: 172000 },
  { name: "Windows", value: 190000 },
  { name: "Android", value: 243000 },
  { name: "Other", value: 98000 },
];

export const mockLocationData = [
  { name: "US", value: 320000 },
  { name: "Canada", value: 185000 },
  { name: "Mexico", value: 210000 },
  { name: "China", value: 175000 },
  { name: "Japan", value: 145000 },
  { name: "Australia", value: 120000 },
];

export const mockScatterData = Array.from({ length: 50 }, (_, i) => ({
  amount: Math.round(Math.random() * 5000 + 100),
  hour: Math.floor(Math.random() * 24),
  count: Math.floor(Math.random() * 50 + 1),
  id: `scatter-${i}`,
}));

export const mockTransactionsByHour = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, "0")}:00`,
  amount: Math.round(Math.random() * 15000 + 1000),
  count: Math.floor(Math.random() * 120 + 10),
}));

export const mockPaymentSummary = {
  total_payments: 3671,
  successful: 3412,
  failed: 98,
  pending: 161,
  average_amount: 158.6,
};

export const mockFlaggedTransactions = [
  {
    id: "TXN-001",
    amount: 12500,
    status: "review" as const,
    user_email: "john@example.com",
    timestamp: "2026-02-10T14:23:00Z",
    reason: "Unusual amount for this user",
    location: "New York, US",
  },
  {
    id: "TXN-002",
    amount: 8900,
    status: "block" as const,
    user_email: "suspicious@temp.com",
    timestamp: "2026-02-10T13:45:00Z",
    reason: "Multiple rapid transactions detected",
    location: "Unknown VPN",
  },
  {
    id: "TXN-003",
    amount: 25000,
    status: "review" as const,
    user_email: "enterprise@corp.com",
    timestamp: "2026-02-10T12:10:00Z",
    reason: "First transaction above $20,000",
    location: "San Francisco, US",
  },
  {
    id: "TXN-004",
    amount: 4200,
    status: "block" as const,
    user_email: "test@fakeemail.xyz",
    timestamp: "2026-02-10T11:30:00Z",
    reason: "Disposable email domain",
    location: "Lagos, NG",
  },
  {
    id: "TXN-005",
    amount: 15800,
    status: "review" as const,
    user_email: "maria@business.com",
    timestamp: "2026-02-10T10:05:00Z",
    reason: "Geographic anomaly detected",
    location: "Tokyo, JP",
  },
  {
    id: "TXN-006",
    amount: 31000,
    status: "block" as const,
    user_email: "blocked@domain.com",
    timestamp: "2026-02-09T22:15:00Z",
    reason: "Previously flagged account",
    location: "Moscow, RU",
  },
];

export const mockNotifications = [
  {
    id: "n1",
    type: "large_transaction" as const,
    message: "Large transaction of $25,000 detected",
    amount: 25000,
    timestamp: "2026-02-10T14:30:00Z",
    read: false,
  },
  {
    id: "n2",
    type: "block" as const,
    message: "Transaction TXN-002 blocked automatically",
    amount: 8900,
    timestamp: "2026-02-10T13:45:00Z",
    read: false,
  },
  {
    id: "n3",
    type: "review" as const,
    message: "Transaction TXN-001 flagged for review",
    amount: 12500,
    timestamp: "2026-02-10T14:23:00Z",
    read: false,
  },
  {
    id: "n4",
    type: "large_transaction" as const,
    message: "Large transaction of $31,000 blocked",
    amount: 31000,
    timestamp: "2026-02-09T22:15:00Z",
    read: true,
  },
  {
    id: "n5",
    type: "review" as const,
    message: "Geographic anomaly: Tokyo, JP transaction",
    amount: 15800,
    timestamp: "2026-02-10T10:05:00Z",
    read: true,
  },
];

export const mockAnalyticsChartData = {
  revenue: [
    { name: "Jan", current: 32000, previous: 28000 },
    { name: "Feb", current: 38000, previous: 31000 },
    { name: "Mar", current: 42000, previous: 35000 },
    { name: "Apr", current: 51000, previous: 40000 },
    { name: "May", current: 48000, previous: 44000 },
    { name: "Jun", current: 58211, previous: 48768 },
  ],
  conversionFunnel: [
    { name: "Visits", value: 12500 },
    { name: "Cart Added", value: 8200 },
    { name: "Checkout", value: 5100 },
    { name: "Payment", value: 3671 },
    { name: "Completed", value: 3412 },
  ],
  topLocations: [
    { name: "New York", value: 72000, fill: "hsl(var(--chart-1))" },
    { name: "San Francisco", value: 39000, fill: "hsl(var(--chart-2))" },
    { name: "Sydney", value: 25000, fill: "hsl(var(--chart-3))" },
    { name: "Singapore", value: 61000, fill: "hsl(var(--chart-4))" },
    { name: "London", value: 48000, fill: "hsl(var(--chart-5))" },
  ],
};
