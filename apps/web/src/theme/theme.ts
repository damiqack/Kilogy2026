import { theme as antdTheme, type ThemeConfig } from "antd";
import tokens from "./tokens.json";

/**
 * Ant Design theme for the Kilogy dashboard ("ops console" style: top navigation, square
 * corners, flat panels, IBM Plex type, compact tables).
 *
 * Brand colors come from tokens.json. To restyle the app, change the values there or the
 * overrides below. Reference: https://ant.design/docs/react/customize-theme
 */
const c = tokens.color;

export const brand = {
  navy: c["primary-navy"].value,
  blue: c["accent-blue"].value,
  success: c["success-green"].value,
  warning: c["warning-orange"].value,
  error: c["error-red"].value,
  text: c["dark-text"].value,
  pageBg: c["page-bg"].value,
};

export const FONT_SANS = `"IBM Plex Sans", -apple-system, "Segoe UI", Arial, sans-serif`;
export const FONT_MONO = `"IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, monospace`;

/** Neutral surfaces used for page background and panel headers. */
const surface = (dark: boolean) => ({
  page: dark ? "#0e1116" : "#eef0f3",
  panelHead: dark ? "#161a21" : "#f6f7f9",
  border: dark ? "#2a303a" : "#d9dde3",
});

export function buildTheme(dark: boolean): ThemeConfig {
  const s = surface(dark);
  return {
    algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      fontFamily: FONT_SANS,
      fontFamilyCode: FONT_MONO,
      fontSize: 13,
      colorPrimary: dark ? brand.blue : brand.navy,
      colorLink: dark ? "#6aa9ff" : brand.blue,
      colorSuccess: brand.success,
      colorWarning: brand.warning,
      colorError: brand.error,
      colorInfo: brand.blue,
      borderRadius: 0,
      borderRadiusSM: 0,
      borderRadiusLG: 0,
      borderRadiusXS: 0,
      colorBorder: s.border,
      colorBorderSecondary: s.border,
      colorBgLayout: s.page,
      boxShadow: "none",
      boxShadowSecondary: "0 4px 12px rgba(0,0,0,0.12)",
      // Secondary/description text darkened from Ant Design's default so it meets WCAG AA (4.5:1).
      colorTextSecondary: dark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.68)",
      colorTextTertiary: dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.62)",
      colorTextDescription: dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.62)",
      ...(dark ? {} : { colorTextBase: brand.text }),
    },
    components: {
      Layout: {
        headerBg: dark ? "#0a1428" : brand.navy,
        headerHeight: 44,
        headerPadding: "0 20px",
        footerBg: "transparent",
      },
      Menu: {
        darkItemBg: "transparent",
        darkItemSelectedBg: "transparent",
        darkItemSelectedColor: "#ffffff",
        darkItemColor: "rgba(255,255,255,0.78)",
        darkItemHoverColor: "#ffffff",
        horizontalLineHeight: "44px",
        itemPaddingInline: 12,
      },
      Card: { headerBg: s.panelHead, headerFontSize: 12, headerHeightSM: 34, paddingSM: 12 },
      Table: {
        headerBg: s.panelHead,
        headerColor: dark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.68)",
        headerBorderRadius: 0,
        cellPaddingBlockSM: 6,
        cellPaddingInlineSM: 10,
        rowHoverBg: dark ? "#1b212b" : "#f2f5f9",
      },
      Button: { primaryShadow: "none", defaultShadow: "none", dangerShadow: "none", fontWeight: 500 },
      Statistic: { titleFontSize: 11, contentFontSize: 22 },
      Alert: { withDescriptionPadding: "10px 14px" },
    },
  };
}
