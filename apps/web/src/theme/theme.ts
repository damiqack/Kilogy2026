import { theme as antdTheme, type ThemeConfig } from "antd";
import tokens from "./tokens.json";

/**
 * Ant Design theme for the Kilogy dashboard.
 *
 * Brand colors come from tokens.json (Kilogy UI/UX spec, section 2.1). To restyle the app,
 * change the values there or the overrides below; no component has hard-coded colors.
 * Reference: https://ant.design/docs/react/customize-theme
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

export function buildTheme(dark: boolean): ThemeConfig {
  return {
    algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: brand.blue,
      colorSuccess: brand.success,
      colorWarning: brand.warning,
      colorError: brand.error,
      colorInfo: brand.blue,
      borderRadius: 4,
      fontSize: 14,
      // Secondary/description text darkened from Ant Design's default so it meets WCAG AA (4.5:1).
      colorTextSecondary: dark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.68)",
      colorTextTertiary: dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.62)",
      colorTextDescription: dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.62)",
      ...(dark ? {} : { colorTextBase: brand.text, colorBgLayout: brand.pageBg }),
    },
    components: {
      Layout: {
        siderBg: brand.navy,
        headerBg: dark ? "#141414" : "#ffffff",
        headerHeight: 56,
        headerPadding: "0 24px",
      },
      Menu: {
        darkItemBg: brand.navy,
        darkSubMenuItemBg: brand.navy,
        darkItemSelectedBg: "rgba(255,255,255,0.14)",
      },
      Table: { headerBg: dark ? "#1d1d1d" : "#f5f7fa" },
      Card: { headerFontSize: 15 },
    },
  };
}
