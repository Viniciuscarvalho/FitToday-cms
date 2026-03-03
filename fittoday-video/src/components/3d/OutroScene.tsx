import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { borderRadius } from "../../theme/spacing";
import {
  SPRING_SMOOTH,
  SPRING_BOUNCY,
  typewriterChars,
  fadeIn,
  fadeUpIn,
} from "../../utils/animations";
import { Logo3D } from "./Logo3D";

// Timing constants
const LOGO_START = 0;
const CTA_DELAY = 30;
const URL_DELAY = 60;
const LOGO_ZOOM_OUT_START = 80;
const FADE_TO_BLACK_START = 110;
const FADE_TO_BLACK_DURATION = 20;

/**
 * OutroScene - Closing 3D scene with logo zoom-out, CTA, URL typewriter, and fade to black.
 * Logo starts visible and zooms away. CTA spring-enters, URL types in, then fade to black.
 */
export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Logo is initially at scale 1, then zooms out (scale grows larger as if moving away)
  const logoZoomProgress = interpolate(
    frame,
    [LOGO_ZOOM_OUT_START, LOGO_ZOOM_OUT_START + 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  // Zoom out = scale from 1 up to ~3 while fading
  const logoScale = 1 + logoZoomProgress * 2.5;
  const logoOpacity = 1 - logoZoomProgress;

  // Camera Z position moves back slightly (simulated via scale since ThreeCanvas has static camera)
  // We'll animate the logo group scale instead

  // CTA spring entrance
  const ctaScale = spring({
    frame: Math.max(0, frame - CTA_DELAY),
    fps,
    config: SPRING_BOUNCY,
  });
  const ctaOpacity = interpolate(
    Math.max(0, frame - CTA_DELAY),
    [0, 12],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // URL typewriter
  const urlText = "fittoday.com.br";
  const urlChars = typewriterChars(frame, urlText.length, URL_DELAY, 1.8);
  const urlVisible = urlText.slice(0, urlChars);
  const urlOpacity = interpolate(
    Math.max(0, frame - URL_DELAY),
    [0, 10],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // Fade to black
  const blackOpacity = interpolate(
    frame,
    [FADE_TO_BLACK_START, FADE_TO_BLACK_START + FADE_TO_BLACK_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Subtle background pulse
  const bgGlow = 0.08 + Math.sin(frame * 0.03) * 0.04;

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        backgroundColor: colors.gray[950],
        overflow: "hidden",
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 55% at 50% 45%, ${colors.primary[900]}${Math.round(bgGlow * 255).toString(16).padStart(2, "0")}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Three.js 3D Canvas */}
      <div style={{ opacity: logoOpacity, position: "absolute", inset: 0 }}>
        <ThreeCanvas
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          camera={{ position: [0, 0, 5], fov: 50 }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={0.8}
            color={colors.white}
          />
          <directionalLight
            position={[-3, -2, 2]}
            intensity={0.3}
            color={colors.primary[300]}
          />
          <pointLight
            position={[0, 0, 3]}
            intensity={0.4}
            color={colors.primary[400]}
          />

          {/* Logo with zoom-out scale */}
          <Logo3D frame={frame} scale={logoScale} />
        </ThreeCanvas>
      </div>

      {/* Text overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          pointerEvents: "none",
        }}
      >
        {/* CTA Button */}
        <div
          style={{
            transform: `scale(${ctaScale})`,
            opacity: ctaOpacity,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Main CTA text */}
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: fontSize["6xl"],
              fontWeight: fontWeight.bold,
              color: colors.white,
              letterSpacing: "-0.02em",
              textAlign: "center",
              lineHeight: 1.1,
              textShadow: `0 0 40px ${colors.primary[500]}60`,
            }}
          >
            Comece gratis agora
          </div>

          {/* CTA button shape */}
          <div
            style={{
              backgroundColor: colors.primary[500],
              borderRadius: borderRadius.full,
              paddingTop: 18,
              paddingBottom: 18,
              paddingLeft: 48,
              paddingRight: 48,
              boxShadow: `0 0 32px ${colors.primary[500]}60, 0 4px 20px rgba(0,0,0,0.4)`,
            }}
          >
            <span
              style={{
                fontFamily: fonts.display,
                fontSize: fontSize.xl,
                fontWeight: fontWeight.bold,
                color: colors.white,
                letterSpacing: "0.02em",
              }}
            >
              Criar conta gratuita
            </span>
          </div>
        </div>

        {/* URL typewriter */}
        <div
          style={{
            opacity: urlOpacity,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: fontSize["2xl"],
              fontWeight: fontWeight.medium,
              color: colors.primary[400],
              letterSpacing: "0.05em",
              minWidth: 280,
              textAlign: "center",
            }}
          >
            {urlVisible}
            {/* Blinking cursor */}
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: fontSize["2xl"],
                backgroundColor: colors.primary[400],
                marginLeft: 3,
                opacity: Math.round(frame / 15) % 2 === 0 ? 1 : 0,
                borderRadius: 1,
                verticalAlign: "middle",
              }}
            />
          </div>
        </div>
      </div>

      {/* Fade to black overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: colors.black,
          opacity: blackOpacity,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
