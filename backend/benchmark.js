import { emailQueue } from './src/queues/email.queue.js';
import adaptiveScheduler from './src/schedulers/adaptive.scheduler.js';
import pidusage from 'pidusage';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cấu hình kịch bản kiểm thử tải thực nghiệm
const TOTAL_JOBS = 600; // 60 OTP (10%), 120 Transactional (20%), 420 Campaign Bulk (70%)
const SLA_LIMITS = {
  OTP: 5000,          // SLA: 5s
  TRANSACTIONAL: 15000, // SLA: 15s
  BULK: 60000         // SLA: 60s
};

async function runBenchmark(mode = 'PROPOSED') {
  console.log(`\n===============================================================`);
  console.log(`🚀 BẮT ĐẦU CHẠY THỬ NGHIỆM BENCHMARK: [Chế độ: ${mode}]`);
  console.log(`===============================================================`);

  // 1. Dọn dẹp sạch sẽ hàng đợi trước khi đo
  console.log(`🧹 Đang dọn dẹp hàng đợi cũ trong Redis...`);
  await emailQueue.drain();
  await emailQueue.clean(0, 5000, 'completed');
  await emailQueue.clean(0, 5000, 'failed');

  const jobs = [];
  const startTime = Date.now();

  // 2. Tạo tập dữ liệu Workload chuẩn
  for (let i = 1; i <= TOTAL_JOBS; i++) {
    let type = 'BULK';
    let slaSeconds = 60;
    let plan = 'FREE';

    if (i % 10 === 0) {
      type = 'OTP';
      slaSeconds = 5;
      plan = 'ENTERPRISE';
    } else if (i % 5 === 0) {
      type = 'TRANSACTIONAL';
      slaSeconds = 15;
      plan = 'PRO';
    }

    // Thiết lập độ ưu tiên theo từng thuật toán
    let priority = 50; // Mặc định chế độ FIFO (mọi job bình đẳng)
    
    if (mode === 'PROPOSED') {
      // Dùng thuật toán P(t) thích ứng đề xuất của bạn
      priority = adaptiveScheduler.calculatePriority({
        slaSeconds,
        planCode: plan,
        isUrgent: type === 'OTP'
      });
    } else if (mode === 'STATIC_PRIORITY') {
      // Phân mức tĩnh truyền thống theo gói
      priority = plan === 'ENTERPRISE' ? 1 : plan === 'PRO' ? 5 : 20;
    }

    jobs.push({
      name: `bench-${type.toLowerCase()}-${i}`,
      data: {
        to: `user.${i}@benchmark.test`,
        type,
        slaLimitMs: SLA_LIMITS[type],
        isMock: true,
        enqueuedAt: Date.now()
      },
      opts: {
        priority,
        // Giữ lại 1000 completed jobs trong Redis để phân tích số liệu P95
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 }
      }
    });
  }

  // 3. Đẩy đồng loạt vào Redis Queue
  console.log(`📦 Đã sinh ${TOTAL_JOBS} tác vụ. Bắt đầu đẩy đồng thời vào cụm BullMQ...`);
  await emailQueue.addBulk(jobs);
  console.log(`⚡ Nạp tải hoàn tất! Đang theo dõi tiến trình xử lý và tài nguyên hệ thống...`);

  // 4. Đo đạc tài nguyên CPU/RAM và độ trễ theo thời gian thực
  const cpuSamples = [];
  const ramSamples = [];

  while (true) {
    await sleep(500);
    const counts = await emailQueue.getJobCounts('waiting', 'prioritized', 'active');
    const backlog = (counts.waiting || 0) + (counts.prioritized || 0);

    try {
      const stats = await pidusage(process.pid);
      cpuSamples.push(stats.cpu);
      ramSamples.push(stats.memory / (1024 * 1024)); // MB
    } catch (e) {}

    // In tiến độ backlog rút ngắn
    process.stdout.write(`\r⏳ Backlog còn lại: ${backlog} | Đang xử lý: ${counts.active || 0}   `);

    if (backlog === 0 && (counts.active || 0) === 0) {
      break;
    }
  }

  const totalDuration = (Date.now() - startTime) / 1000;
  console.log(`\n\n✅ Toàn bộ tác vụ đã được xử lý xong!`);

  // 5. Thu thập toàn bộ Job đã hoàn thành để trích xuất số liệu
  const completedJobs = await emailQueue.getJobs(['completed'], 0, TOTAL_JOBS, true);

  const latencies = { OTP: [], TRANSACTIONAL: [], BULK: [] };
  const violations = { OTP: 0, TRANSACTIONAL: 0, BULK: 0 };

  for (const job of completedJobs) {
    if (!job.data?.enqueuedAt) continue;
    const type = job.data.type || 'BULK';
    const waitingLatency = (job.processedOn || Date.now()) - job.data.enqueuedAt;
    latencies[type].push(waitingLatency);

    if (waitingLatency > job.data.slaLimitMs) {
      violations[type]++;
    }
  }

  // Hàm tính phân vị 95 (P95)
  const calcP95 = (arr) => {
    if (!arr.length) return '0.00';
    arr.sort((a, b) => a - b);
    const idx = Math.floor(arr.length * 0.95);
    return (arr[idx] / 1000).toFixed(2);
  };

  const avgCpu = (cpuSamples.reduce((a, b) => a + b, 0) / (cpuSamples.length || 1)).toFixed(1);
  const avgRam = (ramSamples.reduce((a, b) => a + b, 0) / (ramSamples.length || 1)).toFixed(1);
  const throughput = (TOTAL_JOBS / totalDuration).toFixed(1);

  // In bảng kết quả tổng hợp
  console.log(`\n===============================================================`);
  console.log(`📊 KẾT QUẢ ĐO ĐẠC THỰC NGHIỆM [Chế độ: ${mode}]:`);
  console.log(`---------------------------------------------------------------`);
  console.log(`⏱️  Tổng thời gian hoàn thành   : ${totalDuration.toFixed(2)} giây`);
  console.log(`⚡  Thông lượng (Throughput)      : ${throughput} jobs/giây`);
  console.log(`💻  Mức sử dụng CPU trung bình    : ${avgCpu}%`);
  console.log(`🧠  Mức sử dụng RAM trung bình    : ${avgRam} MB`);
  console.log(`🚨  Độ trễ P95 (OTP)              : ${calcP95(latencies.OTP)}s (SLA cam kết: 5s)`);
  console.log(`🚨  Độ trễ P95 (Transactional)    : ${calcP95(latencies.TRANSACTIONAL)}s (SLA cam kết: 15s)`);
  console.log(`🚨  Độ trễ P95 (Bulk Campaign)    : ${calcP95(latencies.BULK)}s (SLA cam kết: 60s)`);
  console.log(`❌  Tỷ lệ vi phạm SLA (OTP)       : ${((violations.OTP / (latencies.OTP.length || 1)) * 100).toFixed(1)}%`);
  console.log(`❌  Tỷ lệ vi phạm SLA toàn cụm    : ${((Object.values(violations).reduce((a, b) => a + b, 0) / TOTAL_JOBS) * 100).toFixed(1)}%`);
  console.log(`===============================================================\n`);

  process.exit(0);
}

// Nhận tham số dòng lệnh: node benchmark.js FIFO hoặc node benchmark.js PROPOSED
const selectedMode = process.argv[2] ? process.argv[2].toUpperCase() : 'PROPOSED';
runBenchmark(selectedMode).catch(console.error);