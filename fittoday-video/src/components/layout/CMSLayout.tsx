import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

// ---------------------------------------------------------------------------
// Page title map — maps activeItem ids to Portuguese display strings
// ---------------------------------------------------------------------------

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Bem-vindo de volta, Carlos",
  },
  treinos: {
    title: "Treinos",
    subtitle: "Gerencie seus programas de treino",
  },
  alunos: {
    title: "Alunos",
    subtitle: "Acompanhe o progresso dos seus alunos",
  },
  mensagens: {
    title: "Mensagens",
    subtitle: "Central de comunicação com alunos",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Métricas e desempenho da sua plataforma",
  },
  financeiro: {
    title: "Financeiro",
    subtitle: "Receitas, assinaturas e pagamentos",
  },
  configuracoes: {
    title: "Configurações",
    subtitle: "Personalize sua conta e plataforma",
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CMSLayoutProps {
  children: React.ReactNode;
  activeItem?: string;
}

// ---------------------------------------------------------------------------
// Content area with fade-in entrance
// ---------------------------------------------------------------------------

const ContentArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const contentSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 22, stiffness: 100 },
  });

  const opacity = interpolate(contentSpring, [0, 0.6], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(contentSpring, [0, 0.7], [16, 0], {
    extrapolateRight: "clamp",
  });

  const style: React.CSSProperties = {
    flex: 1,
    overflowY: "hidden" as const,
    overflowX: "hidden" as const,
    opacity,
    transform: `translateY(${translateY}px)`,
    position: "relative",
  };

  return <div style={style}>{children}</div>;
};

// ---------------------------------------------------------------------------
// Main layout component
// ---------------------------------------------------------------------------

export const CMSLayout: React.FC<CMSLayoutProps> = ({
  children,
  activeItem = "dashboard",
}) => {
  const pageInfo = PAGE_TITLES[activeItem] ?? PAGE_TITLES.dashboard;

  // Outer shell style
  const shellStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    overflow: "hidden",
    position: "relative",
  };

  // Main column (header + content)
  const mainColumnStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  };

  // The scrollable content area background
  const contentWrapperStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: colors.gray[50],
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  };

  // Inner padded content area
  const innerContentStyle: React.CSSProperties = {
    flex: 1,
    padding: spacing[6],
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={shellStyle}>
      {/* Sidebar */}
      <Sidebar activeItem={activeItem} />

      {/* Main column */}
      <div style={mainColumnStyle}>
        {/* Top header */}
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />

        {/* Page content */}
        <div style={contentWrapperStyle}>
          <div style={innerContentStyle}>
            <ContentArea>{children}</ContentArea>
          </div>
        </div>
      </div>
    </div>
  );
};
