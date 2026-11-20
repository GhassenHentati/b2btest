import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InvoiceItem {
  productId?: string | null;
  name: string;
  description?: string;
  unitLabel: string;
  unitPrice: number;
  qty: number;
  discountPercent: number;
  taxRate: number;
  taxLabel?: string;
  lineSubtotal?: number;
  lineTax?: number;
  lineTotal?: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientSnapshot: any;
  orderId?: string | null;
  status: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  items: InvoiceItem[];
  discount?: { type: 'percent' | 'fixed'; value: number } | null;
  payments: any[];
  subtotal: number;
  discountAmount: number;
  taxBreakdown: { label: string; rate: number; amount: number }[];
  taxTotal: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  terms?: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // ── Invoices ──
  list(params?: { status?: string; clientId?: string }): Observable<Invoice[]> {
    const q = new URLSearchParams(params as any).toString();
    return this.http.get<Invoice[]>(`${this.apiUrl}/invoices${q ? '?' + q : ''}`);
  }
  mine(): Observable<Invoice[]> { return this.http.get<Invoice[]>(`${this.apiUrl}/invoices/me`); }
  get(id: string): Observable<Invoice> { return this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`); }
  create(payload: any): Observable<Invoice> { return this.http.post<Invoice>(`${this.apiUrl}/invoices`, payload); }
  createFromOrder(orderId: string): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/invoices/from-order/${orderId}`, {});
  }
  update(id: string, payload: any): Observable<Invoice> { return this.http.patch<Invoice>(`${this.apiUrl}/invoices/${id}`, payload); }
  setStatus(id: string, status: string): Observable<Invoice> {
    return this.http.patch<Invoice>(`${this.apiUrl}/invoices/${id}/status`, { status });
  }
  addPayment(id: string, payload: any): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/invoices/${id}/payments`, payload);
  }
  deletePayment(id: string, paymentId: string): Observable<Invoice> {
    return this.http.delete<Invoice>(`${this.apiUrl}/invoices/${id}/payments/${paymentId}`);
  }
  remove(id: string): Observable<any> { return this.http.delete(`${this.apiUrl}/invoices/${id}`); }
  pdfUrl(id: string): string { return `${this.apiUrl}/invoices/${id}/pdf`; }

  // ── Estimates ──
  listEstimates(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/estimates`); }
  createEstimate(payload: any): Observable<any> { return this.http.post(`${this.apiUrl}/estimates`, payload); }
  convertEstimate(id: string): Observable<any> { return this.http.post(`${this.apiUrl}/estimates/${id}/convert`, {}); }
  setEstimateStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/estimates/${id}/status`, { status });
  }

  // ── Settings & data sources ──
  getSettings(): Observable<any> { return this.http.get(`${this.apiUrl}/invoice-settings`); }
  saveSettings(payload: any): Observable<any> { return this.http.put(`${this.apiUrl}/invoice-settings`, payload); }
  clients(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/users`); }
  products(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/products`); }
}
