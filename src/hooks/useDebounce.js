import { useState, useEffect } from "react";

/**
 * useDebounce — delays propagating a value until it has stopped changing.
 *
 * Useful for search inputs: the consumer only receives the latest value after
 * the user has paused typing for `delay` milliseconds, preventing a network
 * request on every keystroke.
 *
 * @param {*} value - The value to debounce
 * @param {number} [delay=300] - Milliseconds to wait after the last change
 * @returns {*} The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the pending update if value changes before the delay elapses
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
