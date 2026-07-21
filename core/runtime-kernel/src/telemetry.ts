export type TelemetryValue = number;

interface CounterMetric {
  kind: "counter";
  value: number;
}

interface GaugeMetric {
  kind: "gauge";
  value: number;
}

type Metric = CounterMetric | GaugeMetric;

export class Telemetry {
  private readonly metrics = new Map<string, Metric>();

  increment(name: string, amount = 1): void {
    const existing = this.metrics.get(name);
    if (existing?.kind === "counter") {
      existing.value += amount;
    } else {
      this.metrics.set(name, { kind: "counter", value: amount });
    }
  }

  gauge(name: string, value: number): void {
    this.metrics.set(name, { kind: "gauge", value });
  }

  get(name: string): TelemetryValue | undefined {
    return this.metrics.get(name)?.value;
  }

  snapshot(): Record<string, TelemetryValue> {
    return Object.fromEntries([...this.metrics].map(([name, metric]) => [name, metric.value]));
  }

  reset(): void {
    this.metrics.clear();
  }
}
