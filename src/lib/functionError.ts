/**
 * The readable message of a failed supabase.functions.invoke call, including the text our own
 * function sent back ("You cannot delete your own account...") and a clear hint when the function
 * has not been deployed yet (Supabase answers 404 for a function that does not exist).
 */
export async function functionError(error: unknown, notDeployedHint: string): Promise<string> {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && ctx.status === 404) return notDeployedHint;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.json();
      if (body?.error) return String(body.error);
    } catch {
      /* fall through to the generic message */
    }
  }
  const msg = (error as { message?: string })?.message ?? "Something went wrong.";
  return /Failed to send a request|not found|404/i.test(msg) ? notDeployedHint : msg;
}
