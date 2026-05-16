import React from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import useTheme from "../../hooks/useTheme";

export default function ThemeConfigProvider({ children }) {
  const { isLight } = useTheme();

  // Palette mirrors index.css tokens exactly
  const colors = isLight
    ? {
        primary:       "#5b4fcf", 
        bgBase:        "#f4f3ff", 
        bgContainer:   "#ffffff", 
        border:        "#ccd1f0", 
        textBase:      "#1e1b4b", // Deep indigo — NOT black
        textSecondary: "#3730a3", // Medium indigo
        textTertiary:  "#5b5898", // Muted indigo-grey
        headerBg:      "#eeedf9", 
        bodyBg:        "#f4f3ff",
        tabColor:      "#5b4fcf",
      }
    : {
        primary:       "#7c6ef5", 
        bgBase:        "#1e1c2e", 
        bgContainer:   "#2d2b42", 
        border:        "#444166", 
        textBase:      "#ffffff",   // Pure white
        textSecondary: "#e8e6ff",  // Soft white-lavender
        textTertiary:  "#c4c2e8",  // Light lavender-grey
        headerBg:      "#252338", 
        bodyBg:        "#1e1c2e",
        tabColor:      "#7c6ef5",
      };

  return (
    <ConfigProvider
      theme={{
        algorithm: isLight ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm,
        token: {
          colorPrimary:       colors.primary,
          borderRadius:       8,
          fontFamily:         '"Inter", sans-serif',
          colorBgBase:        colors.bgBase,
          colorBgContainer:   colors.bgContainer,
          colorBorder:        colors.border,
          colorBorderSecondary: colors.border,
          colorTextBase:      colors.textBase,
          colorTextSecondary: colors.textSecondary,
          colorTextTertiary:  colors.textTertiary,
          // Icons: use primary text color so they are always visible in both modes
          colorIcon:          colors.textBase,
          colorIconHover:     colors.primary,
          colorText:          colors.textBase,
          colorBgMask:        "rgba(0, 0, 0, 0.50)",
        },
        components: {
          Button: {
            borderRadius:             9999,
            controlHeight:            40,
            paddingContentHorizontal: 20,
            fontWeight:               500,
            defaultColor:             colors.textBase,   // text-type button icon color
            colorText:                colors.textBase,   // ensure text buttons use correct color
            colorTextDisabled:        colors.textTertiary,
            // text-type buttons: icon + text color
            colorBgTextHover:         isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.08)",
            colorBgTextActive:        isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)",
          },
          Select: {
            borderRadius:  12,
            controlHeight: 40,
          },
          Input: {
            borderRadius:  8,
            controlHeight: 44,
          },
          Layout: {
            headerBg: colors.headerBg,
            bodyBg:   colors.bodyBg,
            footerBg: colors.bodyBg,
            siderBg:  colors.headerBg,  /* Sidebar background matches header */
            padding:  0, // Reset default padding
          },
          Card: {
            borderRadiusLG: 16,
            colorBorderSecondary: colors.border,
          },
          Tabs: {
            titleFontSize:     14,
            itemHoverColor:    colors.tabColor,
            itemSelectedColor: colors.tabColor,
            itemColor:         colors.textSecondary,
            inkBarColor:       colors.tabColor,
            fontWeightStrong:  600,
          },
          Modal: {
            contentBg:     isLight ? "#ffffff" : "#32304a",  /* Lighter than canvas in dark */
            headerBg:      isLight ? "#ffffff" : "#32304a",
            titleColor:    isLight ? "#0c0a09" : "#f5f3ff",
            titleFontSize: 16,
          },
          Typography: {
            fontFamilyCode: '"Fira Code", monospace',
          },
          Tooltip: {
            colorBgDefault: isLight ? "#1e1b4b" : "#2d2b42",
          }
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
