import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // docs/MODULOS.md §2: un módulo solo se importa por su index.ts (o server-api.ts)
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/*", "!@/modules/*/server-api"],
              message: "Importa el módulo por su API pública: '@/modules/<modulo>' o '@/modules/<modulo>/server-api'.",
            },
          ],
        },
      ],
      "no-console": "error",
    },
  },
  { files: ["src/shared/lib/logger.ts", "prisma/**", "tests/**", "**/*.test.ts"], rules: { "no-console": "off" } },
  // docs/diseno/html: export de Claude Design (solo referencia, no es código de la app)
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/generated/**", "docs/**"]),
]);

export default eslintConfig;
