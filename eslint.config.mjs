import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  ...coreWebVitals,
  ...typescript,
  { ignores: [".next/**", ".cache/**", "node_modules/**", "scripts/**", "next-env.d.ts", "qa-output/**"] },
];

export default config;
