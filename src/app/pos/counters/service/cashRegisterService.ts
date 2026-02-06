import { api } from "@/services/api";
import { API_ENDPOINTS } from "@/config/api.config";

export interface CashRegister {
  id: number;
  branch_id: number;
  assigned_user_id: number | null;
  name: string;
  code: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  sessions_count?: number;
  assignedUser?: {
    id: number;
    email: string;
    userInfo?: {
      first_name: string;
      last_name: string;
    };
  };
  creator?: {
    id: number;
    email: string;
  };
  open_session?: CashRegisterSession;
}

export interface OpeningOnlinePayment {
  id: number;
  session_id: number;
  payment_method_id: number;
  amount: number;
  type: 'OPENING' | 'CLOSING';
  paymentMethod?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface CashRegisterSession {
  id: number;
  branch_id: number;
  cash_register_id: number;
  user_id: number;
  opening_balance: number;
  expected_closing_balance: number | null;
  counted_closing_balance: number | null;
  variance: number | null;
  status: 'OPEN' | 'CLOSED';
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
  override_id: number | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    email: string;
    userInfo?: {
      first_name: string;
      last_name: string;
    };
  };
  cash_register?: {
    id: number;
    name: string;
    code: string | null;
  };
  opening_online_payments?: OpeningOnlinePayment[];
}

export interface LedgerEntry {
  session_id?: number;
  type: 'opening' | 'closing';
  at: string;
  amount?: number;
  expected_amount?: number;
  counted_amount?: number;
  variance?: number;
  user?: {
    id: number;
    name: string;
  } | null;
  transaction_count?: number;
  case?: 'SALE' | 'NO_SALE' | 'SHORTED' | null;
}

export interface SessionPaymentSummaryMethod {
  payment_method_id: number;
  name: string;
  slug: string;
  amount: number;
  is_cash: boolean;
}

export interface SessionPaymentSummary {
  cash_total: number;
  online_total: number;
  methods: SessionPaymentSummaryMethod[];
}

export type CashRegisterClosingCase = 'SHORTED' | 'NO_SALE' | 'SALE';

export interface ExpectedBalanceByMethod {
  payment_method_id: number;
  opening_balance: number;
  sales_amount: number;
  expected_balance: number;
}

export interface ExpectedBalances {
  expected_cash_balance: number;
  expected_online_balance: number;
  expected_total_balance: number;
  total_sales: number;
  case: CashRegisterClosingCase;
  expected_balances_by_method?: ExpectedBalanceByMethod[];
}

export interface OpenSessionPayload {
  cash_register_id: number;
  opening_balance: number; // Total balance (cash + online)
  opening_cash_balance?: number; // Cash-only balance for cash movement
  opening_bills?: {
    bill_1000?: number;
    bill_500?: number;
    bill_200?: number;
    bill_100?: number;
    bill_50?: number;
    bill_20?: number;
    coin_20?: number;
    coin_10?: number;
    coin_5?: number;
    coin_1?: number;
    coin_0_25?: number;
    coin_0_10?: number;
    coin_0_05?: number;
    coin_0_01?: number;
  };
  opening_online_payments?: Array<{
    payment_method_id: number;
    amount: number;
  }>;
  override_code?: string;
  override_reason?: string;
}

export interface CloseSessionPayload {
  counted_closing_balance: number;
  code?: string;
  closing_bills?: {
    bill_1000?: number;
    bill_500?: number;
    bill_200?: number;
    bill_100?: number;
    bill_50?: number;
    bill_20?: number;
    coin_20?: number;
    coin_10?: number;
    coin_5?: number;
    coin_1?: number;
    coin_0_25?: number;
    coin_0_10?: number;
    coin_0_05?: number;
    coin_0_01?: number;
  };
  closing_online_payments?: Array<{
    payment_method_id: number;
    amount: number;
  }>;
  notes?: string;
}

export interface CashInOutPayload {
  amount: number;
  description?: string;
}

export async function fetchCashRegisters() {
  const endpoint = API_ENDPOINTS.CASH_REGISTERS.BASE;
  
  try {
    const response = await api(endpoint);
    
    if (!response) {
      throw new Error('No response received from server');
    }
    
    return response;
  } catch (error: any) {
    throw error;
  }
}

export async function fetchAvailableCashRegisters() {
  try {
    const response = await api(API_ENDPOINTS.CASH_REGISTERS.AVAILABLE);
    return response;
  } catch (error: any) {
    throw error;
  }
}

export async function fetchCashRegister(id: number) {
  try {
    const url = API_ENDPOINTS.CASH_REGISTERS.GET.replace("{id}", id.toString());
    const response = await api(url);
    return response;
  } catch (error: any) {
    throw error;
  }
}

export async function createCashRegister(payload: {
  branch_id: number;
  assigned_user_id?: number | null;
  name: string;
  code?: string | null;
  is_active?: boolean;
}) {
  const endpoint = API_ENDPOINTS.CASH_REGISTERS.CREATE;
  
  try {
    const response = await api(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    
    return response;
  } catch (error: any) {
    throw error;
  }
}

export async function updateCashRegister(id: number, payload: {
  assigned_user_id?: number | null;
  name?: string;
  code?: string | null;
  is_active?: boolean;
}) {
  try {
    const url = API_ENDPOINTS.CASH_REGISTERS.UPDATE.replace("{id}", id.toString());
    const response = await api(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error: any) {
    throw error;
  }
}

export async function deleteCashRegister(id: number, code: string) {
  try {
    const url = API_ENDPOINTS.CASH_REGISTERS.DELETE.replace("{id}", id.toString());
    const response = await api(url, {
      method: 'DELETE',
      body: JSON.stringify({ code }),
    });
    return response;
  } catch (error: any) {
    throw error;
  }
}

export async function activateCashRegister(id: number, code: string) {
  try {
    const url = API_ENDPOINTS.CASH_REGISTERS.ACTIVATE.replace("{id}", id.toString());
    const response = await api(url, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return response;
  } catch (error: any) {
    throw error;
  }
}

export async function fetchCashRegisterLedger(id: number) {
  try {
    const url = API_ENDPOINTS.CASH_REGISTERS.LEDGER.replace("{id}", id.toString());
    const response = await api(url);
    return response;
  } catch (error: any) {
    throw error;
  }
}

export async function getCurrentSession() {
  try {
    const response = await api(API_ENDPOINTS.CASH_REGISTERS.CURRENT_SESSION);
    return response;
  } catch (error: any) {
    console.error("Failed to fetch current session:", error);
    throw error;
  }
}

export async function fetchSessionPaymentSummary(sessionId: number) {
  try {
    const url = API_ENDPOINTS.CASH_REGISTERS.PAYMENT_SUMMARY.replace("{id}", sessionId.toString());
    const response = await api(url);
    return response;
  } catch (error: any) {
    throw error;
  }
}

export async function fetchExpectedBalances(sessionId: number) {
  try {
    const url = API_ENDPOINTS.CASH_REGISTERS.EXPECTED_BALANCES.replace("{id}", sessionId.toString());
    const response = await api(url);
    return response;
  } catch (error: any) {
    throw error;
  }
}

export interface CashDenomination {
  bill_1000: number;
  bill_500: number;
  bill_200: number;
  bill_100: number;
  bill_50: number;
  bill_20: number;
  coin_20: number;
  coin_10: number;
  coin_5: number;
  coin_1: number;
  coin_0_25: number;
  coin_0_10: number;
  coin_0_05: number;
  coin_0_01: number;
  total: number;
}

export interface LedgerBreakdown {
  cash_denomination: {
    opening: CashDenomination;
    closing: CashDenomination;
  };
  opening_balances: {
    cash: number;
    online: number;
  };
  closing_balances: {
    cash: number;
    online: number;
  };
  gross_sales: number;
  cogs: number;
  net_profit: number;
}

export async function fetchLedgerBreakdown(sessionId: number) {
  try {
    const url = API_ENDPOINTS.CASH_REGISTERS.LEDGER_BREAKDOWN.replace("{id}", sessionId.toString());
    const response = await api(url);
    return response;
  } catch (error: any) {
    throw error;
  }
}

export async function openSession(payload: OpenSessionPayload) {
  try {
    const response = await api(API_ENDPOINTS.CASH_REGISTERS.OPEN_SESSION, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error: any) {
    throw error;
  }
}

export async function closeSession(sessionId: number, payload: CloseSessionPayload) {
  try {
    const url = API_ENDPOINTS.CASH_REGISTERS.CLOSE_SESSION.replace("{id}", sessionId.toString());
    const response = await api(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error: any) {
    throw error;
  }
}

export async function recordCashIn(sessionId: number, payload: CashInOutPayload) {
  try {
    const url = API_ENDPOINTS.CASH_REGISTERS.CASH_IN.replace("{id}", sessionId.toString());
    const response = await api(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error: any) {
    throw error;
  }
}

export async function recordCashOut(sessionId: number, payload: CashInOutPayload) {
  try {
    const url = API_ENDPOINTS.CASH_REGISTERS.CASH_OUT.replace("{id}", sessionId.toString());
    const response = await api(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error: any) {
    throw error;
  }
}
