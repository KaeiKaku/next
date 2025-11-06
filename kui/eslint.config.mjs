import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-plugin-prettier";

export default defineConfig([
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      prettier,
      js,
    },
    extends: ["js/recommended"],
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // 一般的なルール
      "no-unused-vars": "warn",
      "no-console": "warn",

      quotes: [
        "error",
        "double",
        {
          avoidEscape: true,
        },
      ],

      indent: [
        "error",
        2,
        {
          SwitchCase: 1,
        },
      ],

      // Prettier 統合
      "prettier/prettier": [
        "error",
        {
          singleQuote: false,
          semi: false,
          trailingComma: "es5",
          endOfLine: "auto",
          tabWidth: 2,
          useTabs: false,
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  pluginReact.configs.flat.recommended,
]);
