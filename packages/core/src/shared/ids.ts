declare const brand: unique symbol;
export type Brand<T, B> = T & { readonly [brand]: B };

export type UserId = Brand<string, "UserId">;

export const parseUserId = (raw: unknown): UserId => {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new TypeError(`Invalid UserId: ${typeof raw === "string" ? `"${raw}"` : String(raw)}`);
  }
  return raw as UserId;
};
