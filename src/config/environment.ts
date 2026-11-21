import { z } from "zod";

const environmentSchema = z
  .object({
    // Vide = même origine : le navigateur appelle /api sur ce serveur, qui relaie vers le backend.
    NEXT_PUBLIC_API_BASE_URL: z.union([
      z.literal(""),
      z.url().refine((value) => {
        const url = new URL(value);
        return (
          ["http:", "https:"].includes(url.protocol) &&
          !url.username &&
          !url.password &&
          !url.search &&
          !url.hash
        );
      }, "Une URL HTTP(S) sans credentials, query ou fragment est requise."),
    ]),
    NEXT_PUBLIC_APP_ENV: z.enum([
      "development",
      "test",
      "staging",
      "production",
    ]),
    NEXT_PUBLIC_ENABLE_MOCKS: z
      .enum(["true", "false"])
      .transform((value) => value === "true"),
  })
  .refine(
    (value) =>
      !["staging", "production"].includes(value.NEXT_PUBLIC_APP_ENV) ||
      !value.NEXT_PUBLIC_ENABLE_MOCKS,
    "Mocks interdits en staging et production.",
  );

export function parseEnvironment(input: unknown, nodeEnv?: string) {
  const result = environmentSchema.safeParse(input);
  if (!result.success)
    throw new Error(
      "Configuration frontend invalide : vérifier les variables NEXT_PUBLIC_* documentées.",
    );
  // Ceinture et bretelles : même si l'environnement n'est pas déclaré, un build de production
  // (`next build`) ne peut jamais servir de fausses données. Le mode simulé ne vit que sous `next dev`.
  if (nodeEnv === "production" && result.data.NEXT_PUBLIC_ENABLE_MOCKS)
    throw new Error(
      "Mode simulé interdit dans un build de production : NEXT_PUBLIC_ENABLE_MOCKS doit valoir false.",
    );
  return {
    apiBaseUrl: result.data.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, ""),
    appEnv: result.data.NEXT_PUBLIC_APP_ENV,
    enableMocks: result.data.NEXT_PUBLIC_ENABLE_MOCKS,
  };
}

// Next.js ne remplace que les accès statiques `process.env.NEXT_PUBLIC_X` : on les nomme un par un.
export const config = {
  ...parseEnvironment(
    {
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
      NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
      NEXT_PUBLIC_ENABLE_MOCKS: process.env.NEXT_PUBLIC_ENABLE_MOCKS ?? "false",
    },
    process.env.NODE_ENV,
  ),
  isDevelopment: process.env.NODE_ENV === "development",
};
