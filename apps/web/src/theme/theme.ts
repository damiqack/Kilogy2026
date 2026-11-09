import { theme as antdTheme, type ThemeConfig } from "antd";

/**
 * Ant Design theme for the Kilogy app: Kilogy's navy and blue brand colors, a light canvas,
 * flat white cards with thin borders, and Inter type.
 * Colors used outside antd components live in global.css as CSS variables (--k-*).
 */
export const brand = {
  navy: "#0b1f4d",
  navyDeep: "#071637",
  blue: "#2563eb",
  sky: "#7fbde7",
  green: "#16a34a",
  orange: "#f97316",
  red: "#dc2626",
  purple: "#7c3aed",
  ink: "#0f172a",
  canvas: "#f4f6fb",
};

export const FONT_SANS = `"Inter Variable", Inter, -apple-system, "Segoe UI", Arial, sans-serif`;
export const FONT_MONO = `"IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, monospace`;

export function buildTheme(): ThemeConfig {
  return {
    algorithm: antdTheme.defaultAlgorithm,
    token: {
      fontFamily: FONT_SANS,
      fontFamilyCode: FONT_MONO,
      fontSize: 14,
      colorPrimary: brand.blue,
      colorLink: brand.blue,
      colorSuccess: brand.green,
      colorWarning: brand.orange,
      colorError: brand.red,
      colorInfo: brand.blue,
      colorTextBase: brand.ink,
      colorBgLayout: brand.canvas,
      colorBorderSecondary: "#e7ebf3",
      borderRadius: 8,
      borderRadiusLG: 12,
      // Secondary text darkened from antd's default so it meets WCAG AA (4.5:1) on white.
      colorTextSecondary: "rgba(15,23,42,0.66)",
      colorTextTertiary: "rgba(15,23,42,0.6)",
      colorTextDescription: "rgba(15,23,42,0.6)",
    },
    components: {
      Layout: { siderBg: brand.navy, headerBg: "#ffffff", headerHeight: 60, headerPadding: "0 24px", bodyBg: brand.canvas },
      Menu: {
        darkItemBg: "transparent",
        darkSubMenuItemBg: "transparent",
        darkItemSelectedBg: "rgba(127,189,231,0.16)",
        darkItemSelectedColor: "#ffffff",
        darkGroupTitleColor: "rgba(255,255,255,0.5)",
        darkItemColor: "rgba(255,255,255,0.82)",
        darkItemHoverBg: "rgba(255,255,255,0.08)",
        itemHeight: 40,
        itemMarginBlock: 2,
        iconSize: 16,
        itemBorderRadius: 8,
        groupTitleFontSize: 11,
      },
      Card: { headerFontSize: 16, paddingLG: 20 },
      Table: { headerBg: "#f8fafc", headerColor: "rgba(15,23,42,0.7)", cellPaddingBlockSM: 10, rowHoverBg: "#f5f8ff" },
      Button: { fontWeight: 600, primaryShadow: "none" },
    },
  };
}
