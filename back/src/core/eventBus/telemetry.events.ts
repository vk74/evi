// version: 1.0
// Telemetry module for the Event Bus
// Provides functionality to track event bus metrics like publication counts, subscription counts,
// and processing latencies to monitor performance and usage patterns

/**
 * Statistics for a specific event type
 */
interface EventTypeMetrics {
  // Number of times the event was published
  publishCount: number;
  // Number of active subscriptions to this event type
  subscriptionCount: number;
  // Total processing time across all handler executions (ms)
  totalProcessingTime: number;
  // Number of processing time measurements taken
  processingTimeSamples: number;
  // Min processing time observed (ms)
  minProcessingTime: number;
  // Max processing time observed (ms)
  maxProcessingTime: number;
  // Number of handler errors for this event type
  errorCount: number;
  // Last time this event type was published
  lastPublishedAt?: Date;
  // First time this event type was published
  firstPublishedAt?: Date;
}

/**
 * Telemetry for the EventBus
 */
export class EventBusTelemetry {
  // Track metrics per event type
  private eventMetrics: Map<string, EventTypeMetrics> = new Map();
  // Track overall metrics
  private totalPublished: number = 0;
  private totalSubscriptions: number = 0;
  private totalErrors: number = 0;
  private busStartTime: Date = new Date();

  /**
   * Reset all telemetry data
   */
  reset(): void {
    this.eventMetrics.clear();
    this.totalPublished = 0;
    this.totalSubscriptions = 0;
    this.totalErrors = 0;
    this.busStartTime = new Date();
  }

  /**
   * Record that an event was published
   */
  recordPublication(eventType: string): void {
    this.totalPublished++;
    
    if (!this.eventMetrics.has(eventType)) {
      this.eventMetrics.set(eventType, this.createDefaultMetrics());
    }
    
    const metrics = this.eventMetrics.get(eventType)!;
    metrics.publishCount++;
    metrics.lastPublishedAt = new Date();
    
    if (!metrics.firstPublishedAt) {
      metrics.firstPublishedAt = new Date();
    }
  }

  /**
   * Record that a subscription was added
   */
  recordSubscriptionAdded(eventPattern: string): void {
    this.totalSubscriptions++;
    
    if (!this.eventMetrics.has(eventPattern)) {
      this.eventMetrics.set(eventPattern, this.createDefaultMetrics());
    }
    
    const metrics = this.eventMetrics.get(eventPattern)!;
    metrics.subscriptionCount++;
  }

  /**
   * Record that a subscription was removed
   */
  recordSubscriptionRemoved(eventPattern: string): void {
    if (this.totalSubscriptions > 0) {
      this.totalSubscriptions--;
    }
    
    if (this.eventMetrics.has(eventPattern)) {
      const metrics = this.eventMetrics.get(eventPattern)!;
      if (metrics.subscriptionCount > 0) {
        metrics.subscriptionCount--;
      }
    }
  }

  /**
   * Record processing time for an event handler
   */
  recordProcessingTime(eventType: string, timeMs: number): void {
    if (!this.eventMetrics.has(eventType)) {
      this.eventMetrics.set(eventType, this.createDefaultMetrics());
    }
    
    const metrics = this.eventMetrics.get(eventType)!;
    metrics.totalProcessingTime += timeMs;
    metrics.processingTimeSamples++;
    
    if (timeMs < metrics.minProcessingTime || metrics.minProcessingTime === 0) {
      metrics.minProcessingTime = timeMs;
    }
    
    if (timeMs > metrics.maxProcessingTime) {
      metrics.maxProcessingTime = timeMs;
    }
  }

  /**
   * Record an error that occurred during event processing
   */
  recordError(eventType: string): void {
    this.totalErrors++;
    
    if (!this.eventMetrics.has(eventType)) {
      this.eventMetrics.set(eventType, this.createDefaultMetrics());
    }
    
    const metrics = this.eventMetrics.get(eventType)!;
    metrics.errorCount++;
  }

  /**
   * Get metrics for a specific event type
   */
  getEventMetrics(eventType: string): EventTypeMetrics | undefined {
    return this.eventMetrics.get(eventType);
  }

  /**
   * Get metrics for all event types
   */
  getAllEventMetrics(): Map<string, EventTypeMetrics> {
    return new Map(this.eventMetrics);
  }

  /**
   * Get summary metrics for the event bus
   */
  getSummaryMetrics() {
    const now = new Date();
    const uptimeMs = now.getTime() - this.busStartTime.getTime();
    
    // Calculate aggregated metrics
    let totalLatency = 0;
    let latencySamples = 0;
    let maxLatency = 0;
    let minLatency = Number.MAX_VALUE;
    
    this.eventMetrics.forEach(metrics => {
      totalLatency += metrics.totalProcessingTime;
      latencySamples += metrics.processingTimeSamples;
      
      if (metrics.maxProcessingTime > maxLatency) {
        maxLatency = metrics.maxProcessingTime;
      }
      
      if (metrics.minProcessingTime < minLatency && metrics.minProcessingTime > 0) {
        minLatency = metrics.minProcessingTime;
      }
    });
    
    // Avoid division by zero
    const avgLatency = latencySamples > 0 ? totalLatency / latencySamples : 0;
    
    return {
      eventTypes: this.eventMetrics.size,
      totalPublished: this.totalPublished,
      totalSubscriptions: this.totalSubscriptions,
      totalErrors: this.totalErrors,
      averageLatency: avgLatency,
      minLatency: minLatency === Number.MAX_VALUE ? 0 : minLatency,
      maxLatency,
      uptime: uptimeMs,
      startedAt: this.busStartTime
    };
  }

  /**
   * Create default metrics object for a new event type
   */
  private createDefaultMetrics(): EventTypeMetrics {
    return {
      publishCount: 0,
      subscriptionCount: 0,
      totalProcessingTime: 0,
      processingTimeSamples: 0,
      minProcessingTime: 0,
      maxProcessingTime: 0,
      errorCount: 0
    };
  }
}

// Export a singleton instance for the application to use
export const eventBusTelemetry = new EventBusTelemetry();