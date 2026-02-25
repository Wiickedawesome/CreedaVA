import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // jsx-a11y/aria-proptypes cannot statically evaluate dynamic boolean
      // expressions (e.g. aria-pressed={isActive ? "true" : "false"}).
      // The ARIA usage here is correct at runtime; suppress the false positive.
      "jsx-a11y/aria-proptypes": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cloud Functions compiled output (CommonJS require())
    "functions/lib/**",
  ]),
]);

export default eslintConfig;
