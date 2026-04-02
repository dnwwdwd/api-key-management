export type ActionResult<T = undefined> =
  | {
      ok: true;
      data?: T;
      messageKey?: string;
    }
  | {
      ok: false;
      messageKey: string;
    };

export function successResult<T = undefined>(
  data?: T,
  messageKey?: string,
): ActionResult<T> {
  return {
    ok: true,
    data,
    messageKey,
  };
}

export function errorResult(messageKey: string): ActionResult<never> {
  return {
    ok: false,
    messageKey,
  };
}
