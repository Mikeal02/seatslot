import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Domain-level error raised by the data layer. Repositories never leak raw
 * Postgrest errors to the UI — every failure is normalised here.
 */
export class DataError extends Error {
  readonly code?: string;
  readonly details?: string;
  readonly scope: string;

  constructor(scope: string, message: string, cause?: PostgrestError | null) {
    super(message);
    this.name = 'DataError';
    this.scope = scope;
    this.code = cause?.code;
    this.details = cause?.details;
  }
}

/** Postgrest "no rows returned" for `.single()`. Treated as `null`, not a failure. */
export const NOT_FOUND = 'PGRST116';

interface Envelope<T> {
  data: T | null;
  error: PostgrestError | null;
  count?: number | null;
}

/** Unwrap a Supabase response, throwing a DataError on failure. */
export async function unwrap<T>(scope: string, promise: PromiseLike<Envelope<T>>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new DataError(scope, error.message, error);
  return data as T;
}

/** Unwrap a response that may legitimately return no row. */
export async function unwrapMaybe<T>(
  scope: string,
  promise: PromiseLike<Envelope<T>>
): Promise<T | null> {
  const { data, error } = await promise;
  if (error && error.code !== NOT_FOUND) throw new DataError(scope, error.message, error);
  return (data as T) ?? null;
}

/** Unwrap a list response, always yielding an array. */
export async function unwrapList<T>(
  scope: string,
  promise: PromiseLike<Envelope<T[]>>
): Promise<T[]> {
  return (await unwrap<T[]>(scope, promise)) ?? [];
}

/** Unwrap a `head: true, count: 'exact'` response. */
export async function unwrapCount(
  scope: string,
  promise: PromiseLike<Envelope<unknown>>
): Promise<number> {
  const { error, count } = await promise;
  if (error) throw new DataError(scope, error.message, error);
  return count ?? 0;
}

/**
 * Identity helper for `.select()` strings.
 *
 * supabase-js parses select literals at the type level; widening to `string`
 * keeps typecheck times flat on large embedded selects. Row shapes are pinned
 * explicitly with `.returns<T>()` at the call site instead.
 */
export const sel = (s: string): string => s;

/** All-zero UUID — safe placeholder so filters never receive `undefined`. */
export const NIL_UUID = '00000000-0000-0000-0000-000000000000';
