/// <reference types="vite/client" />

declare module "aos" {
  interface AosOptions {
    offset?: number;
    delay?: number;
    duration?: number;
    easing?: string;
    once?: boolean;
    mirror?: boolean;
    anchorPlacement?: string;
    disable?: boolean | "phone" | "tablet" | "mobile" | (() => boolean);
  }

  interface AosApi {
    init: (options?: AosOptions) => void;
    refresh: () => void;
    refreshHard: () => void;
  }

  const AOS: AosApi;
  export default AOS;
}
