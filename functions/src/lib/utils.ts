export function throwIfDeadlineReached() {
  const DEADLINE = new Date("January 9, 2025").getTime();
  if (Date.now() > DEADLINE) {
    throw new Error("DEADLINE REACHED");
  }
}
