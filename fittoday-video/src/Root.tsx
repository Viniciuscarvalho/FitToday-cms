import React from "react";
import { Composition } from "remotion";
import { VIDEO_DURATIONS, MASTER_DURATION, FPS } from "./utils/timing";
import { VIDEO } from "./theme/spacing";
import { IntroVideo } from "./videos/01-Intro";
import { DashboardVideo } from "./videos/02-Dashboard";
import { TreinosVideo } from "./videos/03-Treinos";
import { AlunosVideo } from "./videos/04-Alunos";
import { MensagensVideo } from "./videos/05-Mensagens";
import { AnalyticsVideo } from "./videos/06-Analytics";
import { FinanceiroVideo } from "./videos/07-Financeiro";
import { ConfiguracoesVideo } from "./videos/08-Configuracoes";
import { OutroVideo } from "./videos/09-Outro";
import { MasterComposition } from "./MasterComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="01-Intro"
        component={IntroVideo}
        durationInFrames={VIDEO_DURATIONS["01-Intro"]}
        fps={FPS}
        width={VIDEO.WIDTH}
        height={VIDEO.HEIGHT}
      />
      <Composition
        id="02-Dashboard"
        component={DashboardVideo}
        durationInFrames={VIDEO_DURATIONS["02-Dashboard"]}
        fps={FPS}
        width={VIDEO.WIDTH}
        height={VIDEO.HEIGHT}
      />
      <Composition
        id="03-Treinos"
        component={TreinosVideo}
        durationInFrames={VIDEO_DURATIONS["03-Treinos"]}
        fps={FPS}
        width={VIDEO.WIDTH}
        height={VIDEO.HEIGHT}
      />
      <Composition
        id="04-Alunos"
        component={AlunosVideo}
        durationInFrames={VIDEO_DURATIONS["04-Alunos"]}
        fps={FPS}
        width={VIDEO.WIDTH}
        height={VIDEO.HEIGHT}
      />
      <Composition
        id="05-Mensagens"
        component={MensagensVideo}
        durationInFrames={VIDEO_DURATIONS["05-Mensagens"]}
        fps={FPS}
        width={VIDEO.WIDTH}
        height={VIDEO.HEIGHT}
      />
      <Composition
        id="06-Analytics"
        component={AnalyticsVideo}
        durationInFrames={VIDEO_DURATIONS["06-Analytics"]}
        fps={FPS}
        width={VIDEO.WIDTH}
        height={VIDEO.HEIGHT}
      />
      <Composition
        id="07-Financeiro"
        component={FinanceiroVideo}
        durationInFrames={VIDEO_DURATIONS["07-Financeiro"]}
        fps={FPS}
        width={VIDEO.WIDTH}
        height={VIDEO.HEIGHT}
      />
      <Composition
        id="08-Configuracoes"
        component={ConfiguracoesVideo}
        durationInFrames={VIDEO_DURATIONS["08-Configuracoes"]}
        fps={FPS}
        width={VIDEO.WIDTH}
        height={VIDEO.HEIGHT}
      />
      <Composition
        id="09-Outro"
        component={OutroVideo}
        durationInFrames={VIDEO_DURATIONS["09-Outro"]}
        fps={FPS}
        width={VIDEO.WIDTH}
        height={VIDEO.HEIGHT}
      />
      <Composition
        id="MasterTutorial"
        component={MasterComposition}
        durationInFrames={MASTER_DURATION}
        fps={FPS}
        width={VIDEO.WIDTH}
        height={VIDEO.HEIGHT}
      />
    </>
  );
};
