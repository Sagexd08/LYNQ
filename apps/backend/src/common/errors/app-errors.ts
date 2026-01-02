export type AppError =
  | { type: 'COMPLIANCE_CHECK_FAILED'; message: string; details: { address: string; reason: string } }
  | { type: 'CHAINALYSIS_API_ERROR'; message: string; details: { address: string; error: string } }
  | { type: 'OFAC_VIOLATION'; message: string; details: { address: string } }
  | { type: 'PYTH_INTEGRATION_ERROR'; message: string; details: { tokenAddress: string; chain: string; error: string } }
  | { type: 'CHAINLINK_INTEGRATION_ERROR'; message: string; details: { tokenAddress: string; chain: string; error: string } }
  | { type: 'PRICE_FETCH_ERROR'; message: string; details: { tokenAddress: string; chain: string; fallbackUsed: boolean } }
  | { type: 'INVALID_TOKEN_ADDRESS'; message: string; details: { address: string; chain: string } }
  | { type: 'INVALID_TRANSACTION_HASH'; message: string; details: { hash: string; chain: string } }
  | { type: 'LOAN_CREATION_FAILED'; message: string; details: { userId: string; amount: string; reason: string } }
  | { type: 'LOAN_NOT_FOUND'; message: string; details: { loanId: string } }
  | { type: 'INSUFFICIENT_COLLATERAL'; message: string; details: { required: string; provided: string } }
  | { type: 'RISK_ASSESSMENT_ERROR'; message: string; details: { loanId: string; error: string } }
  | { type: 'DATABASE_ERROR'; message: string; details: { operation: string; error: string } }
  | { type: 'VALIDATION_ERROR'; message: string; details: { field: string; value: unknown; constraint: string } }
  | { type: 'CIRCULAR_DEPENDENCY_ISSUE'; message: string; details: { services: string[] } }
  | { type: 'BLACKLIST_CHECK_FAILED'; message: string; details: { address: string; source: string } }
  | { type: 'FRAUD_DETECTED'; message: string; details: { userId: string; flags: string[] } }
  | { type: 'UNKNOWN_ERROR'; message: string; details: { originalError: string } };

export type AppErrorType = AppError['type'];

export const isAppError = (value: unknown): value is AppError => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'message' in value &&
    'details' in value
  );
};

export const createError = <T extends AppErrorType>(
  type: T,
  message: string,
  details: Extract<AppError, { type: T }>['details']
): Extract<AppError, { type: T }> => {
  return { type, message, details } as Extract<AppError, { type: T }>;
};

export type ResultOk<T> = { ok: true; value: T };
export type ResultErr<E extends AppError> = { ok: false; error: E };
export type Result<T, E extends AppError = AppError> = ResultOk<T> | ResultErr<E>;

export const Ok = <T>(value: T): ResultOk<T> => ({ ok: true, value });

export const Err = <E extends AppError>(error: E): ResultErr<E> => ({
  ok: false,
  error,
});

export const isOk = <T, E extends AppError>(result: Result<T, E>): result is ResultOk<T> => {
  return result.ok === true;
};

export const isErr = <T, E extends AppError>(result: Result<T, E>): result is ResultErr<E> => {
  return result.ok === false;
};

export const unwrap = <T, E extends AppError>(result: Result<T, E>): T => {
  if (isOk(result)) {
    return result.value;
  }
  throw new Error(`Unwrap called on Err: ${result.error.message}`);
};

export const unwrapOr = <T, E extends AppError>(result: Result<T, E>, defaultValue: T): T => {
  if (isOk(result)) {
    return result.value;
  }
  return defaultValue;
};

export const map = <T, U, E extends AppError>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> => {
  if (isOk(result)) {
    return Ok(fn(result.value));
  }
  return result;
};

export const mapErr = <T, E extends AppError, F extends AppError>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> => {
  if (isErr(result)) {
    return Err(fn(result.error));
  }
  return result as Result<T, F>;
};

export const flatMap = <T, U, E extends AppError>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  if (isOk(result)) {
    return fn(result.value);
  }
  return result;
};

export const handleResult = <T, E extends AppError>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => void;
    err: (error: E) => void;
  }
): void => {
  if (isOk(result)) {
    handlers.ok(result.value);
  } else {
    handlers.err(result.error);
  }
};

export const matchResult = <T, E extends AppError, R>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => R;
    err: (error: E) => R;
  }
): R => {
  if (isOk(result)) {
    return handlers.ok(result.value);
  }
  return handlers.err(result.error);
};

export const tryCatch = <T>(
  fn: () => T,
  errorMapper: (error: unknown) => AppError
): Result<T, AppError> => {
  try {
    return Ok(fn());
  } catch (error) {
    return Err(errorMapper(error));
  }
};

export const tryCatchAsync = async <T>(
  fn: () => Promise<T>,
  errorMapper: (error: unknown) => AppError
): Promise<Result<T, AppError>> => {
  try {
    const value = await fn();
    return Ok(value);
  } catch (error) {
    return Err(errorMapper(error));
  }
};

export const combineResults = <T, E extends AppError>(
  results: Result<T, E>[]
): Result<T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (isErr(result)) {
      return result;
    }
    values.push(result.value);
  }
  return Ok(values);
};

export const fromNullable = <T>(
  value: T | null | undefined,
  error: AppError
): Result<T, AppError> => {
  if (value === null || value === undefined) {
    return Err(error);
  }
  return Ok(value);
};
