import "server-only";

export type GeneratedDifficulty = "easy" | "medium" | "hard" | "adaptive";

export interface GeneratedStorySummary {
  story_id: string;
  version: number;
  title: string;
  subject: { domain: string; discipline: string; topic_tags: string[] };
  difficulty: GeneratedDifficulty;
  estimated_minutes: number;
}

export interface GeneratedStory {
  story_id: string;
  version: number;
  bundle: {
    storyline: {
      title: string;
      tagline: string;
      synopsis: string;
      subject: { domain: string; discipline: string; topic_tags: string[] };
      target_age: number;
      difficulty: GeneratedDifficulty;
      estimated_minutes: number;
      learning_objectives: string[];
      learning_goal?: string;
      stage_label?: string;
      partner_greeting?: string;
      characters?: Array<{
        name: string;
        role: string;
        visual_description: string;
      }>;
      intro?: { role: string; text: string[]; cta: string };
      pre_session?: {
        prompt: string;
        options: Array<{
          id: string;
          label: string;
          approach: import("@/types/story").ApproachTag;
        }>;
      };
      takeaway:
        | string
        | {
            concept: string;
            field: string;
            in_one_line: string;
            rule: string;
            elsewhere: string[];
            you_used_it: string[];
          };
      player_takeaway?: {
        concept: string;
        field: string;
        in_one_line: string;
        rule: string;
        elsewhere: string[];
        you_used_it: string[];
      };
      citations: Array<{ title: string; url: string; source_name: string | null }>;
      scenes: GeneratedScene[];
    };
    activities: { activities: GeneratedActivity[] };
    assets: Array<{
      asset_key: string;
      kind: "image" | "video" | "audio";
      scene_id: string | null;
      alt_text: string | null;
      content_type: string;
    }>;
  };
  validation: { quality_score: number; is_valid: boolean };
  media_urls: Record<string, string>;
}

export interface GeneratedScene {
  scene_id: string;
  act: 1 | 2 | 3;
  title: string;
  narrative: string[];
  learning_purpose: string;
  interaction_slot: "quiz" | "reorder" | "simulation" | "reflection" | null;
  choices: Array<{
    choice_id: string;
    label: string;
    consequence: string;
    correct: boolean;
  }>;
  media_cue: string;
  scene_type?:
    | "narrative"
    | "choice"
    | "slider"
    | "reorder"
    | "reflect"
    | "ending";
  mood?: import("@/types/story").Mood;
  beat?: string;
  hints?: [string, string, string];
  concept?: string;
  probe?: string | null;
  primer?:
    | import("@/types/story").ScenePrimer
    | import("@/types/story").ScenePrimer[];
  trivia?: import("@/types/story").SceneTrivia | null;
  learning_reference?: {
    title: string;
    image_url: string;
    source_page_url: string;
    source_name: string;
    license_name:
      | "Public domain"
      | "CC BY 4.0"
      | "CC BY-SA 4.0"
      | "CC BY 3.0"
      | "CC BY-SA 3.0"
      | "CC0 1.0";
    license_url: string;
    alt_text: string;
    plain_explanation: string;
    why_important: string;
  } | null;
  outcome?: "success" | "partial";
}

export interface GeneratedActivity {
  activity_id: string;
  scene_id: string;
  kind: "quiz" | "reorder" | "simulation" | "reflection" | "slider";
  learning_objective: string;
  quiz: {
    prompt: string;
    options: Array<{ option_id: string; label: string }>;
    correct_option_ids: string[];
    explanation: string;
  } | null;
  reorder: {
    prompt: string;
    instruction?: string;
    items: Array<{ item_id: string; label: string; detail?: string | null }>;
    correct_order: string[];
    explanation: string;
    wrong?: string;
    right?: string;
  } | null;
  simulation: {
    prompt: string;
    model_kind: string;
    controls: Array<{
      control_id: string;
      label: string;
      minimum: number;
      maximum: number;
      step: number;
      initial: number;
      unit: string;
    }>;
    observed_variables: string[];
    readouts?: Array<{
      readout_id: string;
      label: string;
      operation:
        | "identity"
        | "linear"
        | "sum"
        | "difference"
        | "product"
        | "share_percent"
        | "base_conversion"
        | "lookup";
      input_ids: string[];
      params: Record<string, number>;
      cases: Array<{ when: Record<string, number>; value: string }>;
      fallback: string;
      success_value: string;
      unit: string;
      decimals: number;
    }>;
    success_condition: string;
    explanation: string;
    guide?: { shows: string; move: string; watch: string };
  } | null;
  slider?: {
    prompt: string;
    label: string;
    unit: string;
    minimum: number;
    maximum: number;
    step: number;
    initial: number;
    target_minimum: number;
    target_maximum: number;
    readout_label: string;
    readout_unit: string;
    readout_expr: import("@/types/story").SliderExpr;
    readout_params: Record<string, number>;
    readout_decimals: number;
    driver_label: string;
    driver_value: number;
    driver_unit: string;
    driver_expr?: "fixed" | "part_of_total_percent";
    driver_params?: Record<string, number>;
    risk_mode: "separation" | "ceiling";
    risk_safe_gap: number;
    meter: import("@/types/story").SliderScene["meter"];
    bands: Array<{ max: number; text: string }>;
    explanation: string;
    guide?: import("@/types/story").SceneSimGuide;
  } | null;
  reflection: {
    prompt: string;
    placeholder: string;
    evidence_to_notice: string[];
  } | null;
}

const backendBaseUrl =
  process.env.ARTHAM_BACKEND_BASE_URL ?? "http://127.0.0.1:8090";

async function getFromBackend<T>(path: string): Promise<T> {
  const response = await fetch(`${backendBaseUrl}${path}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Story backend returned ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getGeneratedStories(): Promise<GeneratedStorySummary[]> {
  try {
    return await getFromBackend<GeneratedStorySummary[]>("/api/v1/stories");
  } catch {
    return [];
  }
}

export function getGeneratedStory(storyId: string): Promise<GeneratedStory> {
  return getFromBackend<GeneratedStory>(
    `/api/v1/stories/${encodeURIComponent(storyId)}`,
  );
}
