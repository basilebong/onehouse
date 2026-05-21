import * as v from "valibot";

const portSchema = v.pipe(
  v.string(),
  v.transform(Number),
  v.integer(),
  v.minValue(1),
  v.maxValue(65535),
);

const flagSchema = v.pipe(
  v.string(),
  v.transform((s) => s !== "" && s !== "false" && s !== "0"),
);

const envSchema = v.object({
  PORT: v.optional(portSchema),
  CI: v.optional(flagSchema),
  E2E_BASE_URL: v.optional(v.pipe(v.string(), v.url())),
});

export type Env = {
  PORT: number;
  CI: boolean;
  E2E_BASE_URL: string;
};

export const parseEnv = (raw: Record<string, string | undefined>): Env => {
  const parsed = v.parse(envSchema, raw);
  return {
    PORT: parsed.PORT ?? 3000,
    CI: parsed.CI ?? false,
    E2E_BASE_URL: parsed.E2E_BASE_URL ?? "http://localhost:5173",
  };
};
