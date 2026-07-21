import { describe, expect, it } from "vitest";
import {
  CyclicWorkflowError,
  UnknownWorkflowStepError,
  WorkflowEngine,
} from "../src/workflowEngine.js";

describe("WorkflowEngine", () => {
  it("runs steps in dependency order", async () => {
    const engine = new WorkflowEngine();
    const order: string[] = [];

    engine.addStep({ name: "fetch", run: () => order.push("fetch") });
    engine.addStep({ name: "process", dependsOn: ["fetch"], run: () => order.push("process") });

    const completed = await engine.run();

    expect(order).toEqual(["fetch", "process"]);
    expect(completed).toEqual(["fetch", "process"]);
  });

  it("rejects a step that depends on an unregistered step", async () => {
    const engine = new WorkflowEngine();
    engine.addStep({ name: "process", dependsOn: ["missing"], run: () => {} });

    await expect(engine.run()).rejects.toThrow(UnknownWorkflowStepError);
  });

  it("detects a cyclic dependency", async () => {
    const engine = new WorkflowEngine();
    engine.addStep({ name: "a", dependsOn: ["b"], run: () => {} });
    engine.addStep({ name: "b", dependsOn: ["a"], run: () => {} });

    await expect(engine.run()).rejects.toThrow(CyclicWorkflowError);
  });
});
