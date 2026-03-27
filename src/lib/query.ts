/**
 * Wraps a Supabase query with a timeout and one automatic retry.
 * Solves free-tier connection drops where queries hang indefinitely.
 */
export async function query<T>(
  fn: () => PromiseLike<T>,
  timeoutMs = 8000
): Promise<T> {
  const run = () =>
    Promise.race([
      Promise.resolve(fn()),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs)
      ),
    ]);

  try {
    return await run();
  } catch {
    // Wait 1.5s then try once more
    await new Promise((r) => setTimeout(r, 1500));
    return run();
  }
}
