/// <reference types="vite/client" />

declare const __GRAFFITI_VERSION__: string;

declare module '*.md?raw' {
  const content: string;
  export default content;
}

