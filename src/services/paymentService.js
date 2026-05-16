/**
 * Lumiere AI — Payment Service (SePay VietQR)
 * Endpoints: /api/payments/*
 */
import apiClient from './apiClient.js';

export const paymentService = {
  /** Lấy danh sách gói */
  async getPlans() {
    const res = await apiClient.get('/api/payments/plans');
    return res.data.plans;
  },

  /** Lấy quota hiện tại của user */
  async getQuota() {
    const res = await apiClient.get('/api/payments/quota');
    return res.data;
  },

  /**
   * Tạo payment record và lấy thông tin VietQR.
   * Returns: { order_id, amount, qr_url, transfer_content, bank_code, bank_account, ... }
   */
  async createPayment(planId) {
    const res = await apiClient.post('/api/payments/create', { plan_id: planId });
    return res.data;
  },

  /**
   * Polling: kiểm tra trạng thái thanh toán.
   * Backend gọi SePay transaction API để verify.
   * Returns: { order_id, status: 'PENDING'|'PAID'|'FAILED'|'CANCELLED', ... }
   */
  async verifyPayment(orderId) {
    const res = await apiClient.get(`/api/payments/verify/${orderId}`);
    return res.data;
  },

  /** Lịch sử thanh toán */
  async getHistory() {
    const res = await apiClient.get('/api/payments/history');
    return res.data.payments;
  },
};
