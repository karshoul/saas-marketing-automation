class AdaptiveScheduler {
  /**
   * Tính toán điểm Priority động cho Job BullMQ
   * Trong BullMQ: giá trị càng nhỏ -> Job càng được ưu tiên xử lý trước (1 là cao nhất)
   *
   * @param {Object} params
   * @param {number} params.slaSeconds - Thời hạn cam kết SLA (ví dụ: OTP = 5s, Transactional = 15s, Bulk = 60s)
   * @param {string} params.planCode - Gói cước của Tenant ('ENTERPRISE', 'PRO', 'FREE')
   * @param {number} params.waitingTimeSeconds - Thời gian tác vụ đã chờ trong queue (dùng cho Aging)
   * @param {boolean} params.isUrgent - Cờ đánh dấu khẩn cấp tối đa (OTP)
   */
  calculatePriority({
    slaSeconds = 60,
    planCode = 'FREE',
    waitingTimeSeconds = 0,
    isUrgent = false
  }) {
    if (isUrgent || slaSeconds <= 5) return 1;

    // 1. Trọng số gói cước (Tenant Tier Weight)
    let tierWeight = 0;
    const normalizedPlan = (planCode || '').toUpperCase();
    if (normalizedPlan === 'ENTERPRISE') tierWeight = 10;
    else if (normalizedPlan === 'PRO') tierWeight = 5;

    // 2. Hệ số già hóa tác vụ (Aging Mechanism: chờ mỗi 10 giây được cộng thêm 1 điểm ưu tiên)
    const alpha = 0.1;
    const agingBoost = Math.floor(waitingTimeSeconds * alpha);

    // 3. Quy đổi SLA ra điểm cơ sở: SLA càng ngắn -> Điểm càng nhỏ
    const slaScore = Math.floor(slaSeconds / 5);

    // 4. Công thức tổng hợp P(t)
    const rawPriority = slaScore - tierWeight - agingBoost;

    // Giới hạn biên [1, 100]
    return Math.max(1, Math.min(100, rawPriority));
  }

  /**
   * Tính toán số lượng Worker Concurrency tối ưu dựa trên độ dài hàng đợi
   */
  calculateOptimalConcurrency(waitingJobsCount, minConcurrency = 2, maxConcurrency = 20) {
    if (!waitingJobsCount || waitingJobsCount <= 0) return minConcurrency;

    // Giả định định mức 1 worker xử lý được ~10 jobs/giây
    const estimatedNeeded = Math.ceil(waitingJobsCount / 10);
    return Math.max(minConcurrency, Math.min(maxConcurrency, estimatedNeeded));
  }
}

export default new AdaptiveScheduler();