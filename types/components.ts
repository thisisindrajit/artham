import type {
  Domain,
  Scenario,
  Scene,
  SceneVisual,
  SessionNotes,
} from "@/types/story";
import type { Action, PlayState } from "@/types/engine";
import type { PreludeResponse } from "@/types/partner";
import type { ReactNode } from "react";

export type ScenarioFilter = Domain | "all";

export interface BackdropDoodle {
  id: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
}

export interface ScenarioPickerProps {
  scenarios: Scenario[];
  isAuthenticated: boolean;
}

export interface ScenarioFilterBarProps {
  domains: Domain[];
  active: ScenarioFilter;
  onChange: (filter: ScenarioFilter) => void;
  total: number;
  countOf: (domain: Domain) => number;
}

export interface ScenarioFilterChipProps {
  domain?: Domain;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

export interface ScenarioCardProps {
  scenario: Scenario;
  index: number;
  armed: boolean;
  /** Number-key shortcuts only exist on the full picker, so hints are opt-out. */
  showShortcutHint?: boolean;
  onArm: () => void;
  onIntent: () => void;
}

export interface ScenarioCoverProps {
  scenario: Scenario;
}

export type UiTone = "rose" | "sage" | "accent" | "ink";

export interface StatusPillProps {
  children: ReactNode;
  tone?: Exclude<UiTone, "ink">;
  className?: string;
}

export interface ProgressBarProps {
  value: number;
  tone?: UiTone;
  className?: string;
  barClassName?: string;
}

export interface SessionIntroProps {
  scenario: Scenario;
  /** True once the story is running: the briefing stays, the CTA does not. */
  started: boolean;
  onBegin: () => void;
}

export interface SessionPreludeProps {
  scenario: Scenario;
  prelude: PreludeResponse | null;
  /** Set once the learner has answered; the question becomes a transcript line. */
  answered?: SessionNotes["preSessionAnswer"];
  onAnswer: (
    question: string,
    answer: string,
    approach?: Scenario["preSession"]["options"][number]["approach"],
  ) => void;
}

export interface StoryImageProps {
  visual: SceneVisual;
  /** Set on the opening beat only, so the first picture is not lazy-loaded. */
  priority?: boolean;
}

/** Everything one beat needs to render itself, live or already played. */
export interface StoryBeatProps {
  scenario: Scenario;
  state: PlayState;
  scene: Scene;
  /** True for the beat the learner is standing on — the only one with controls. */
  live: boolean;
  /** Waiting on the partner: controls stay visible but inert. */
  busy: boolean;
  run: (action: Action) => void;
}

export interface StoryFlowProps {
  scenario: Scenario;
  state: PlayState;
  prelude: PreludeResponse | null;
  busy: boolean;
  /** Height of the floating bottom bar, so scrolling can stop clear of it. */
  barHeight: number;
  run: (action: Action) => void;
}

export interface StoryContextPanelProps {
  scenario: Scenario;
  state: PlayState;
}
