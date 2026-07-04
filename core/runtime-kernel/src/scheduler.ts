export type ScheduledTaskHandle = string;

interface ScheduledTask {
  handle: ScheduledTaskHandle;
  timer: NodeJS.Timeout;
}

export class Scheduler {
  private readonly tasks = new Map<ScheduledTaskHandle, ScheduledTask>();
  private nextId = 1;

  scheduleInterval(callback: () => void | Promise<void>, intervalMs: number): ScheduledTaskHandle {
    const handle = this.newHandle();
    const timer = setInterval(() => {
      void callback();
    }, intervalMs);
    timer.unref?.();
    this.tasks.set(handle, { handle, timer });
    return handle;
  }

  scheduleOnce(callback: () => void | Promise<void>, delayMs: number): ScheduledTaskHandle {
    const handle = this.newHandle();
    const timer = setTimeout(() => {
      this.tasks.delete(handle);
      void callback();
    }, delayMs);
    timer.unref?.();
    this.tasks.set(handle, { handle, timer });
    return handle;
  }

  cancel(handle: ScheduledTaskHandle): boolean {
    const task = this.tasks.get(handle);
    if (!task) {
      return false;
    }
    clearTimeout(task.timer);
    clearInterval(task.timer);
    this.tasks.delete(handle);
    return true;
  }

  get activeCount(): number {
    return this.tasks.size;
  }

  cancelAll(): void {
    for (const handle of [...this.tasks.keys()]) {
      this.cancel(handle);
    }
  }

  private newHandle(): ScheduledTaskHandle {
    return `task-${this.nextId++}`;
  }
}
