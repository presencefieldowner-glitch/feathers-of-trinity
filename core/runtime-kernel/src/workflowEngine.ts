import { KernelError } from "./errors.js";

export interface WorkflowStep {
  readonly name: string;
  readonly dependsOn?: readonly string[];
  run(): Promise<void> | void;
}

export class UnknownWorkflowStepError extends KernelError {
  constructor(stepName: string, dependencyName: string) {
    super(`Step "${stepName}" depends on unknown step "${dependencyName}"`);
  }
}

export class CyclicWorkflowError extends KernelError {
  constructor(cycle: readonly string[]) {
    super(`Cyclic workflow dependency detected: ${cycle.join(" -> ")}`);
  }
}

export class WorkflowEngine {
  private readonly steps = new Map<string, WorkflowStep>();

  addStep(step: WorkflowStep): void {
    this.steps.set(step.name, step);
  }

  async run(): Promise<string[]> {
    const order = this.resolveOrder();
    const completed: string[] = [];
    for (const step of order) {
      await step.run();
      completed.push(step.name);
    }
    return completed;
  }

  private resolveOrder(): WorkflowStep[] {
    const steps = [...this.steps.values()];

    for (const step of steps) {
      for (const dependency of step.dependsOn ?? []) {
        if (!this.steps.has(dependency)) {
          throw new UnknownWorkflowStepError(step.name, dependency);
        }
      }
    }

    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: WorkflowStep[] = [];

    const visit = (step: WorkflowStep, path: string[]): void => {
      if (visited.has(step.name)) {
        return;
      }
      if (visiting.has(step.name)) {
        throw new CyclicWorkflowError([...path, step.name]);
      }

      visiting.add(step.name);
      for (const dependencyName of step.dependsOn ?? []) {
        visit(this.steps.get(dependencyName)!, [...path, step.name]);
      }
      visiting.delete(step.name);
      visited.add(step.name);
      order.push(step);
    };

    for (const step of steps) {
      visit(step, []);
    }

    return order;
  }
}
