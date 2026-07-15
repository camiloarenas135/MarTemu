/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface ActionTimestamp {
  timestamp: number;
}

/**
 * Sliding window rate limiter based on localStorage.
 * Restricts actions to `maxAttempts` within `windowMs` (e.g. 24 hours).
 * 
 * @param actionKey The unique identifier of the action (e.g. 'vip-register')
 * @param maxAttempts Maximum allowed attempts in the window (e.g. 3)
 * @param windowMs Timeframe window in milliseconds (e.g. 24 hours)
 * @returns Object indicating if limited, remaining attempts, and when they can retry
 */
export function checkRateLimit(
  actionKey: string,
  maxAttempts = 3,
  windowMs = 24 * 60 * 60 * 1000
): { limited: boolean; remaining: number; resetTime: number } {
  try {
    const storageKey = `rl_${actionKey}`;
    const raw = localStorage.getItem(storageKey);
    const now = Date.now();
    
    let attempts: ActionTimestamp[] = raw ? JSON.parse(raw) : [];
    
    // Filter out attempts outside of the sliding window
    attempts = attempts.filter((attempt) => now - attempt.timestamp < windowMs);
    
    if (attempts.length >= maxAttempts) {
      // Find the oldest attempt in the current window to estimate when the next slot opens
      const oldestAttempt = attempts[0];
      const resetTime = oldestAttempt.timestamp + windowMs;
      
      return {
        limited: true,
        remaining: 0,
        resetTime,
      };
    }
    
    return {
      limited: false,
      remaining: maxAttempts - attempts.length,
      resetTime: 0,
    };
  } catch (e) {
    console.error('Rate limiter error:', e);
    // On storage failure, fail-open or fail-safe?
    // Let's allow but log error.
    return { limited: false, remaining: 1, resetTime: 0 };
  }
}

/**
 * Records a successful action attempt.
 */
export function recordAttempt(actionKey: string, windowMs = 24 * 60 * 60 * 1000): void {
  try {
    const storageKey = `rl_${actionKey}`;
    const raw = localStorage.getItem(storageKey);
    const now = Date.now();
    
    let attempts: ActionTimestamp[] = raw ? JSON.parse(raw) : [];
    
    // Filter and add new attempt
    attempts = attempts.filter((attempt) => now - attempt.timestamp < windowMs);
    attempts.push({ timestamp: now });
    
    localStorage.setItem(storageKey, JSON.stringify(attempts));
  } catch (e) {
    console.error('Rate limiter record attempt error:', e);
  }
}
