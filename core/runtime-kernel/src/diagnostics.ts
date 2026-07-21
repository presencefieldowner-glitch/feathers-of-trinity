export type DiagnosticCheck = () => Promise<boolean> | boolean;

export interface DiagnosticResult {
  readonly name: string;
  readonly healthy: boolean;
  readonly error?: string;
}

export interface DiagnosticsReport {
  readonly healthy: boolean;
  readonly results: readonly DiagnosticResult[];
}

export class Diagnostics {
  private readonly checks = new Map<string, DiagnosticCheck>();

  register(name: string, check: DiagnosticCheck): void {
    this.checks.set(name, check);
  }

  async run(): Promise<DiagnosticsReport> {
    const results: DiagnosticResult[] = [];

    for (const [name, check] of this.checks) {
      try {
        results.push({ name, healthy: await check() });
      } catch (err) {
        results.push({ name, healthy: false, error: String(err) });
      }
    }

    return { healthy: results.every((result) => result.healthy), results };
  }
}
