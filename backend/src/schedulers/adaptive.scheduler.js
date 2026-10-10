class AdaptiveScheduler {
  /**
   * Tính toán điểm Priority động cho BullMQ
   * Trong BullMQ: P càng nhỏ -> Ưu tiên càng cao (1 là cao nhất)
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

    // 2. Hệ số già hóa tác vụ (Aging Mechanism: đợi càng lâu điểm càng giảm để được ưu tiên)
    const alpha = 0.2;
    const agingBoost = Math.floor(waitingTimeSeconds * alpha);

    // 3. Quy đổi SLA: SLA càng ngắn -> Điểm gốc càng nhỏ
    const slaScore = Math.floor(slaSeconds / 5);

    // 4. Công thức tổng hợp P(t)
    const rawPriority = slaScore - tierWeight - agingBoost;

    // Giới hạn biên an toàn của BullMQ [1, 100]
    return Math.max(1, Math.min(100, rawPriority));
  }

  /**
   * Tính toán số lượng Worker Concurrency tối ưu theo độ dài hàng đợi
   */
  calculateOptimalConcurrency(waitingJobsCount, minConcurrency = 2, maxConcurrency = 20) {
    if (!waitingJobsCount || waitingJobsCount <= 0) return minConcurrency;

    // Định mức: Mỗi 10 jobs tồn đọng cần thêm 1 luồng xử lý
    const estimatedNeeded = Math.ceil(waitingJobsCount / 10);
    return Math.max(minConcurrency, Math.min(maxConcurrency, estimatedNeeded));
  }
}

export default new AdaptiveScheduler();