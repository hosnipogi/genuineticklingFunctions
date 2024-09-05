export function throwIfDeadlineReached() {
  const DEADLINE = new Date("September 7, 2024").getTime();
  if (Date.now() > DEADLINE) {
    throw new Error("DEADLINE REACHED");
  }
}
