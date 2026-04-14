export type ErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_PROVIDER_ERROR'
  | 'SCRIPT_NOT_FOUND'
  | 'SCRIPT_SAVE_FAILED'
  | 'SCRIPT_LIMIT_REACHED'
  | 'VERSION_NOT_FOUND'
  | 'EXPORT_FAILED'
  | 'STRIPE_CHECKOUT_FAILED'
  | 'STRIPE_WEBHOOK_ERROR'
  | 'SUGGESTION_FETCH_FAILED'
  | 'BLUEPRINT_SAVE_FAILED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  code: ErrorCode;
  userMessage: string;
  retryable: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    userMessage: string,
    retryable: boolean = false,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.retryable = retryable;
  }
}
