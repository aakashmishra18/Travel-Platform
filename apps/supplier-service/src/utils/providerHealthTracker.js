/**
 * Rolling in-memory record of recent calls per provider — powers
 * GET /internal/providers/health. Deliberately in-memory, not
 * persisted: this is operational health monitoring ("is the provider
 * healthy right now"), not historical analytics, and resetting on
 * restart is the correct behavior for that.
 */
const WINDOW_SIZE = 50;

class ProviderHealthTracker {
  constructor() {
    this.records = new Map(); // provider name -> array of { success, responseTimeMs, timestamp }
  }

  record(providerName, success, responseTimeMs) {
    const list = this.records.get(providerName) || [];
    list.push({ success, responseTimeMs, timestamp: Date.now() });
    if (list.length > WINDOW_SIZE) list.shift();
    this.records.set(providerName, list);
  }

  getStats(providerName) {
    const list = this.records.get(providerName) || [];
    if (list.length === 0) {
      return { totalCalls: 0, healthy: null, failureRate: null, avgResponseTimeMs: null, lastCheckedAt: null };
    }

    const failures = list.filter((r) => !r.success).length;
    const avgResponseTimeMs = Math.round(
      list.reduce((sum, r) => sum + r.responseTimeMs, 0) / list.length
    );
    const failureRate = Number((failures / list.length).toFixed(3));

    return {
      totalCalls: list.length,
      healthy: failureRate < 0.5, // majority of recent calls succeeded
      failureRate,
      avgResponseTimeMs,
      lastCheckedAt: new Date(list[list.length - 1].timestamp).toISOString(),
    };
  }
}

module.exports = new ProviderHealthTracker();
