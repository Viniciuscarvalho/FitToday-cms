import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
} from "remotion";
import { BrowserMockup, CMSLayout } from "../../components/layout";
import { Badge, ChatBubble } from "../../components/ui";
import { CalloutBubble } from "../../components/annotations/CalloutBubble";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";
import { mockConversations, mockMessages } from "../../utils/mockData";
import { fadeUpIn, fadeIn, fadeOut, stagger, SPRING_SNAPPY, SPRING_SMOOTH, pulse } from "../../utils/animations";

// ---------------------------------------------------------------------------
// Shared: Split-panel layout shell
// ---------------------------------------------------------------------------

interface PanelLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftDelay?: number;
  rightDelay?: number;
}

const PanelLayout: React.FC<PanelLayoutProps> = ({
  leftPanel,
  rightPanel,
  leftDelay = 0,
  rightDelay = 10,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftSpring = spring({
    frame: Math.max(0, frame - leftDelay),
    fps,
    config: SPRING_SNAPPY,
  });
  const rightSpring = spring({
    frame: Math.max(0, frame - rightDelay),
    fps,
    config: SPRING_SNAPPY,
  });

  const leftX = interpolate(leftSpring, [0, 1], [-40, 0]);
  const rightX = interpolate(rightSpring, [0, 1], [40, 0]);
  const leftOpacity = interpolate(leftSpring, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const rightOpacity = interpolate(rightSpring, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: spacing[4], height: "100%" }}>
      {/* Left: conversation list */}
      <div
        style={{
          width: 320,
          flexShrink: 0,
          transform: `translateX(${leftX}px)`,
          opacity: leftOpacity,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {leftPanel}
      </div>

      {/* Right: chat area */}
      <div
        style={{
          flex: 1,
          transform: `translateX(${rightX}px)`,
          opacity: rightOpacity,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Conversation list item
// ---------------------------------------------------------------------------

interface ConvRowProps {
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  active?: boolean;
  delay?: number;
}

const ConvRow: React.FC<ConvRowProps> = ({ name, lastMessage, time, unread, active = false, delay = 0 }) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const opacity = interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const translateY = interpolate(f, [0, 12], [16, 0], { extrapolateRight: "clamp" });

  const initial = name.charAt(0).toUpperCase();

  // Avatar gradient cycling
  const gradients = [
    [colors.primary[400], colors.primary[600]],
    [colors.statGradients.students[0], colors.statGradients.students[1]],
    [colors.statGradients.programs[0], colors.statGradients.programs[1]],
    [colors.statGradients.rating[0], colors.statGradients.rating[1]],
  ];
  const gradient = gradients[name.charCodeAt(0) % gradients.length];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        padding: `${spacing[4]}px ${spacing[4]}px`,
        backgroundColor: active ? colors.primary[50] : "transparent",
        borderLeft: active ? `3px solid ${colors.primary[500]}` : "3px solid transparent",
        borderBottom: `1px solid ${colors.gray[100]}`,
        opacity,
        transform: `translateY(${translateY}px)`,
        cursor: "pointer" as const,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: borderRadius.full,
          background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.display,
          fontSize: fontSize.base,
          fontWeight: fontWeight.bold,
          color: colors.white,
          flexShrink: 0,
        }}
      >
        {initial}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: fontSize.sm,
              fontWeight: unread > 0 ? fontWeight.semibold : fontWeight.medium,
              color: colors.gray[900],
            }}
          >
            {name}
          </span>
          <span style={{ fontFamily: fonts.body, fontSize: 10, color: colors.gray[400] }}>{time}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: fontSize.xs,
              color: unread > 0 ? colors.gray[700] : colors.gray[400],
              fontWeight: unread > 0 ? fontWeight.medium : fontWeight.normal,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
              maxWidth: 160,
            }}
          >
            {lastMessage}
          </span>
          {unread > 0 && (
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: borderRadius.full,
                backgroundColor: colors.primary[500],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: fonts.body, fontSize: 10, fontWeight: fontWeight.bold, color: colors.white }}>
                {unread}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Conversation list panel
// ---------------------------------------------------------------------------

const ConversationListPanel: React.FC<{ showConvs?: boolean; delay?: number }> = ({
  showConvs = true,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const headerEntrance = fadeUpIn(frame, delay);

  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: `${spacing[4]}px ${spacing[5]}px`,
          borderBottom: `1px solid ${colors.gray[100]}`,
          backgroundColor: colors.gray[50],
          ...headerEntrance,
        }}
      >
        <span style={{ fontFamily: fonts.display, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.gray[900] }}>
          Conversas
        </span>
        {/* Search input */}
        <div
          style={{
            marginTop: spacing[3],
            backgroundColor: colors.gray[100],
            borderRadius: borderRadius.lg,
            padding: `${spacing[2]}px ${spacing[3]}px`,
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke={colors.gray[400]} strokeWidth={2} />
            <path d="M21 21l-4.35-4.35" stroke={colors.gray[400]} strokeWidth={2} strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.gray[400] }}>Buscar conversa...</span>
        </div>
      </div>

      {/* Conversation rows */}
      {showConvs && mockConversations.map((conv, i) => (
        <ConvRow
          key={conv.name}
          name={conv.name}
          lastMessage={conv.lastMessage}
          time={conv.time}
          unread={conv.unread}
          active={conv.name === "Maria Silva"}
          delay={delay + stagger(i, 20, 12)}
        />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Empty chat placeholder (right panel when nothing is selected)
// ---------------------------------------------------------------------------

const EmptyChatPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const entrance = fadeUpIn(frame, 15);

  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing[4],
        ...entrance,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: borderRadius.full,
          backgroundColor: colors.gray[100],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke={colors.gray[400]}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div style={{ textAlign: "center" as const }}>
        <div style={{ fontFamily: fonts.body, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.gray[600] }}>
          Selecione uma conversa
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.gray[400], marginTop: 4 }}>
          Escolha um aluno para iniciar o chat
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Active chat panel (Scene 3)
// ---------------------------------------------------------------------------

const ActiveChatPanel: React.FC<{ showMessages?: boolean; delay?: number }> = ({
  showMessages = false,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const headerEntrance = fadeUpIn(frame, delay);

  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Chat header */}
      <div
        style={{
          padding: `${spacing[4]}px ${spacing[5]}px`,
          borderBottom: `1px solid ${colors.gray[100]}`,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.white,
          ...headerEntrance,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: spacing[3] }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.full,
              background: `linear-gradient(135deg, ${colors.primary[400]}, ${colors.primary[600]})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.display,
              fontSize: fontSize.base,
              fontWeight: fontWeight.bold,
              color: colors.white,
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontFamily: fonts.body, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.gray[900] }}>
              Maria Silva
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: spacing[1], marginTop: 2 }}>
              <div style={{ width: 8, height: 8, borderRadius: borderRadius.full, backgroundColor: colors.success }} />
              <span style={{ fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.success }}>Online agora</span>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div style={{ display: "flex", flexDirection: "row", gap: spacing[4], opacity: 0.6 }}>
          {/* Phone icon */}
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.3A16 16 0 0 0 15.71 16.1l.86-.86a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke={colors.gray[600]} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* Video icon */}
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <polygon points="23 7 16 12 23 17 23 7" stroke={colors.gray[600]} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke={colors.gray[600]} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          padding: `${spacing[5]}px 0`,
          display: "flex",
          flexDirection: "column",
          gap: spacing[4],
          backgroundColor: colors.gray[50],
          overflowY: "hidden" as const,
        }}
      >
        {showMessages && mockMessages.map((msg, i) => (
          <ChatBubble
            key={i}
            content={msg.content}
            sender={msg.sender}
            time={msg.time}
            showChecks={msg.sender === "trainer"}
            delay={stagger(i, delay, 40)}
          />
        ))}
      </div>

      {/* Message input */}
      <div
        style={{
          padding: `${spacing[3]}px ${spacing[4]}px`,
          borderTop: `1px solid ${colors.gray[100]}`,
          display: "flex",
          flexDirection: "row",
          gap: spacing[3],
          alignItems: "center",
          backgroundColor: colors.white,
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: colors.gray[100],
            borderRadius: borderRadius["2xl"],
            padding: `${spacing[3]}px ${spacing[4]}px`,
            fontFamily: fonts.body,
            fontSize: fontSize.sm,
            color: colors.gray[400],
          }}
        >
          Escreva uma mensagem...
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: borderRadius.full,
            backgroundColor: colors.primary[500],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <line x1="22" y1="2" x2="11" y2="13" stroke="white" strokeWidth={2} strokeLinecap="round" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="white" fillOpacity={0.2} />
          </svg>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 1: Initial layout appearance
// ---------------------------------------------------------------------------

const Scene1: React.FC = () => {
  return (
    <PanelLayout
      leftPanel={<ConversationListPanel showConvs={false} delay={0} />}
      rightPanel={<EmptyChatPanel />}
      leftDelay={0}
      rightDelay={15}
    />
  );
};

// ---------------------------------------------------------------------------
// Scene 2: Conversations appear in left panel with unread badges
// ---------------------------------------------------------------------------

const Scene2: React.FC = () => {
  return (
    <PanelLayout
      leftPanel={<ConversationListPanel showConvs delay={0} />}
      rightPanel={<EmptyChatPanel />}
      leftDelay={0}
      rightDelay={0}
    />
  );
};

// ---------------------------------------------------------------------------
// Scene 3: Active chat — messages appear one by one
// ---------------------------------------------------------------------------

const Scene3: React.FC = () => {
  return (
    <PanelLayout
      leftPanel={<ConversationListPanel showConvs delay={0} />}
      rightPanel={<ActiveChatPanel showMessages delay={20} />}
      leftDelay={0}
      rightDelay={5}
    />
  );
};

// ---------------------------------------------------------------------------
// Scene 4: CalloutBubble + Elite glow effect
// ---------------------------------------------------------------------------

const EliteGlowBadge: React.FC = () => {
  const frame = useCurrentFrame();
  // Pulsing glow animation
  const glowIntensity = 8 + Math.sin(frame * 0.15) * 6;
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: spacing[3],
        paddingRight: spacing[3],
        paddingTop: 5,
        paddingBottom: 5,
        borderRadius: borderRadius.full,
        background: "linear-gradient(90deg, #a855f7, #d946ef)",
        color: colors.white,
        fontFamily: fonts.body,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        letterSpacing: "0.02em",
        boxShadow: `0 0 ${glowIntensity}px rgba(168, 85, 247, 0.8), 0 0 ${glowIntensity * 2}px rgba(217, 70, 239, 0.4)`,
        opacity,
      }}
    >
      Elite
    </div>
  );
};

const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const exitOpacity = fadeOut(frame, 100, 50).opacity ?? 1;

  return (
    <div style={{ height: "100%", opacity: exitOpacity }}>
      <PanelLayout
        leftPanel={<ConversationListPanel showConvs delay={0} />}
        rightPanel={<ActiveChatPanel showMessages delay={0} />}
        leftDelay={0}
        rightDelay={0}
      />
      {/* CalloutBubble positioned over the content area */}
      <CalloutBubble
        text={"Chat em tempo real\nexclusivo plano Elite"}
        x={900}
        y={300}
        delay={20}
        direction="bottom"
        holdFrames={120}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Background wrapper
// ---------------------------------------------------------------------------

const VideoBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(135deg, ${colors.gray[900]} 0%, ${colors.gray[950]} 100%)`,
      padding: 40,
    }}
  >
    {children}
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const MensagensVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.gray[950] }}>
      {/* Scene 1: Layout appears (0-300) */}
      <Sequence from={0} durationInFrames={300}>
        <VideoBackground>
          <BrowserMockup>
            <CMSLayout activeItem="mensagens">
              <Scene1 />
            </CMSLayout>
          </BrowserMockup>
        </VideoBackground>
      </Sequence>

      {/* Scene 2: Conversation list populates (300-600) */}
      <Sequence from={300} durationInFrames={300}>
        <VideoBackground>
          <BrowserMockup>
            <CMSLayout activeItem="mensagens">
              <Scene2 />
            </CMSLayout>
          </BrowserMockup>
        </VideoBackground>
      </Sequence>

      {/* Scene 3: Active chat with messages (600-1050) */}
      <Sequence from={600} durationInFrames={450}>
        <VideoBackground>
          <BrowserMockup>
            <CMSLayout activeItem="mensagens">
              <Scene3 />
            </CMSLayout>
          </BrowserMockup>
        </VideoBackground>
      </Sequence>

      {/* Scene 4: Callout + Elite glow + fade out (1050-1200) */}
      <Sequence from={1050} durationInFrames={150}>
        <VideoBackground>
          <BrowserMockup>
            <CMSLayout activeItem="mensagens">
              <Scene4 />
            </CMSLayout>
          </BrowserMockup>
        </VideoBackground>
      </Sequence>
    </AbsoluteFill>
  );
};
