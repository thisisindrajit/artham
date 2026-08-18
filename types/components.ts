import type {
  Domain,
  Scenario,
} from "@/types/story";
import type { PlayState } from "@/types/engine";
import type { PreludeResponse } from "@/types/partner";
import type { ReactNode } from "react";

export type ScenarioFilter = Domain | "all";

export type StageFamily = "bridge" | "reactor" | "city" | "lab" | "troy";

export interface BackdropDoodle {
  id: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
}

export interface ScenarioPickerProps {
  scenarios: Scenario[];
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
  onArm: () => void;
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
  onBegin: () => void;
}

export interface SessionPreludeProps {
  scenario: Scenario;
  prelude: PreludeResponse | null;
  onAnswer: (
    question: string,
    answer: string,
    approach?: Scenario["preSession"]["options"][number]["approach"],
  ) => void;
  onPreview: (message: string | null) => void;
}

export interface SessionRailProps {
  scenario: Scenario;
  state: PlayState;
}
