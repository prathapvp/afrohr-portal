const logoVariants = {
  classic: "/afrohr-logo.svg",
  bridge: "/afrohr-logo-bridge.svg",
  network: "/afrohr-logo-network.svg",
  compass: "/afrohr-logo-compass.svg",
} as const;

type BrandLogoVariant = keyof typeof logoVariants;

function parseVariant(value: string | null): BrandLogoVariant | null {
  if (!value) {
    return null;
  }

  if (value in logoVariants) {
    return value as BrandLogoVariant;
  }

  return null;
}

export function getBrandLogoSrc(): string {
  if (typeof window === "undefined") {
    return logoVariants.classic;
  }

  const query = new URLSearchParams(window.location.search);
  const variant = parseVariant(query.get("logo"));

  return variant ? logoVariants[variant] : logoVariants.classic;
}

export const brandLogoVariants = Object.keys(logoVariants) as BrandLogoVariant[];
