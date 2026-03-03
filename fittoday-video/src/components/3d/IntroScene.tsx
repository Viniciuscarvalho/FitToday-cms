import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { SPRING_SMOOTH, SPRING_BOUNCY, typewriterChars, fadeIn } from "../../utils/animations";
import { Logo3D } from "./Logo3D";

const LOGO_ENTRANCE_DELAY = 0;
const LOGO_SETTLE_FRAME = 40;
const TITLE_DELAY = 35;
const SUBTITLE_DELAY = 65;

/**
 * IntroScene - Full 3D intro with dumbbell logo, typewriter title, and subtitle.
 * Uses ThreeCanvas from @remotion/three for the 3D canvas.
 */
export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Logo scale spring entrance
  const logoScale = spring({
    frame: Math.max(0, frame - LOGO_ENTRANCE_DELAY),
    fps,
    config: SPRING_BOUNCY,
  });

  // Title typewriter
  const titleText = "FitToday.";
  const titleChars = typewriterChars(frame, titleText.length, TITLE_DELAY, 2.2);
  const titleVisible = titleText.slice(0, titleChars);

  // Title opacity fades in gently
  const titleOpacity = interpolate(
    Math.max(0, frame - TITLE_DELAY),
    [0, 12],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // Subtitle fade in
  const subtitleText = "A plataforma completa para Personal Trainers";
  const subtitleOpacity = interpolate(
    Math.max(0, frame - SUBTITLE_DELAY),
    [0, 20],
    [0, 1],
    { extrapolateRight: "clamp" }
  );
  const subtitleTranslateY = interpolate(
    Math.max(0, frame - SUBTITLE_DELAY),
    [0, 20],
    [16, 0],
    { extrapolateRight: "clamp" }
  );

  // Subtle background gradient pulse
  const bgGlow = 0.05 + Math.sin(frame * 0.04) * 0.03;

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
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${colors.primary[900]}${Math.round(bgGlow * 255).toString(16).padStart(2, "0")}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Three.js 3D Canvas */}
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
          intensity={0.25}
          color={colors.primary[300]}
        />
        <pointLight
          position={[0, 0, 3]}
          intensity={0.3}
          color={colors.primary[400]}
        />

        {/* Dumbbell logo with entrance scale */}
        <Logo3D frame={frame} scale={logoScale} />
      </ThreeCanvas>

      {/* Text overlay - positioned absolutely on top of the canvas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: height * 0.18,
          pointerEvents: "none",
        }}
      >
        {/* Title with typewriter effect */}
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: fontSize["7xl"],
            fontWeight: fontWeight.bold,
            color: colors.white,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            opacity: titleOpacity,
            display: "flex",
            alignItems: "center",
            minHeight: fontSize["7xl"] * 1.2,
          }}
        >
          <span>{titleVisible}</span>
          {/* Blinking cursor */}
          <span
            style={{
              display: "inline-block",
              width: 4,
              height: fontSize["7xl"] * 0.85,
              backgroundColor: colors.primary[400],
              marginLeft: 4,
              opacity: Math.round(frame / 15) % 2 === 0 ? 1 : 0,
              borderRadius: 2,
              verticalAlign: "middle",
            }}
          />
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize["2xl"],
            fontWeight: fontWeight.medium,
            color: colors.gray[400],
            letterSpacing: "0.01em",
            marginTop: 16,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleTranslateY}px)`,
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          {subtitleText}
        </div>
      </div>

      {/* Bottom gradient for depth */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: `linear-gradient(to bottom, transparent, ${colors.gray[950]})`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
