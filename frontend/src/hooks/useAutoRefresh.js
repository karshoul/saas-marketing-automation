import { useEffect, useRef } from 'react';

/**
 * Hook tự động làm mới dữ liệu thời gian thực
 * @param {Function} callback - Hàm fetch data của trang
 * @param {number} intervalMs - Chu kỳ lặp (mili-giây), mặc định 3000ms
 * @param {boolean} enabled - Bật/tắt chế độ auto refresh
 */
export function useAutoRefresh(callback, intervalMs = 3000, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      // Chỉ chạy refresh khi người dùng đang mở tab (tiết kiệm tài nguyên)
      if (document.visibilityState === 'visible') {
        savedCallback.current();
      }
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}