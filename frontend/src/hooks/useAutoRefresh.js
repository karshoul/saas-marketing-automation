import { useEffect } from "react";

export default function useAutoRefresh(callback, delay = 30000, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (typeof callback === "function") {
        callback();
      }
    }, delay);

    return () => clearInterval(interval);
  }, [callback, delay, enabled]);
}