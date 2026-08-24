import "server-only";

import type {
  GeneratedActivity,
  GeneratedScene,
  GeneratedStory,
} from "@/lib/generated-story";
import {
  getGeneratedStories,
  getGeneratedStory,
} from "@/lib/generated-story";
import type {
  ApproachTag,
  ChoiceOption,
  Domain,
  Mood,
  Scenario,
  Scene,
  SceneVisual,
  StoryTakeaway,
  SliderScene,
} from "@/types/story";
import { legacySimulationReadouts } from "@/utils/simulation-runtime";

const DOMAINS: Domain[] = [
  "physics",
  "biology",
  "economics",
  "chemistry",
  "history",
];

const APPROACHES: ApproachTag[] = [
  "measure_first",
  "act_first",
  "seek_pattern",
  "follow_authority",
];

export function generatedStoryToScenario(story: GeneratedStory): Scenario {
  const { storyline } = story.bundle;
  const activities = new Map(
    story.bundle.activities.activities.map((activity) => [
      activity.scene_id,
      activity,
    ]),
  );
  const scenes = storyline.scenes.map((scene, index) =>
    adaptScene(story, scene, activities.get(scene.scene_id), index),
  );
  const first = scenes[0];
  if (!first) throw new Error("Generated story contains no scenes");

  const audio = story.bundle.assets.find((asset) => asset.kind === "audio");
  const cover = story.bundle.assets.find(
    (asset) => asset.kind === "image" && asset.scene_id === null,
  );
  const introVisual: SceneVisual =
    cover && story.media_urls[cover.asset_key]
      ? {
          kind: "generated",
          title: storyline.title,
          caption: cover.alt_text ?? storyline.tagline,
          status: "Story cover",
          src: story.media_urls[cover.asset_key],
        }
      : visualFor(story, storyline.scenes[0]);

  return {
    id: story.story_id,
    playPath: `/play/generated/${story.story_id}`,
    title: storyline.title,
    tagline: storyline.tagline,
    blurb: storyline.synopsis,
    art: {
      src: cover ? story.media_urls[cover.asset_key] : undefined,
      alt: cover?.alt_text ?? `${storyline.title} cover`,
      emoji: "🎬",
    },
    domain: normalizeDomain(
      `${storyline.subject.domain} ${storyline.subject.discipline}`,
    ),
    topic: storyline.subject.discipline,
    difficulty:
      storyline.difficulty === "adaptive" ? "medium" : storyline.difficulty,
    learningGoal:
      storyline.learning_goal ?? storyline.learning_objectives.join(" "),
    takeaway: adaptTakeaway(
      storyline.player_takeaway ?? storyline.takeaway,
      storyline.subject.domain,
    ),
    minutes: storyline.estimated_minutes,
    stageLabel: storyline.stage_label ?? `${storyline.title} live`,
    partnerGreeting:
      storyline.partner_greeting ??
      "You are in charge. Read the evidence, test the system, and let each consequence update your plan.",
    intro: {
      role: storyline.intro?.role ?? "lead investigator",
      text: storyline.intro?.text ?? [storyline.synopsis],
      cta: storyline.intro?.cta ?? "Enter the story",
      visual: introVisual,
    },
    preSession:
      storyline.pre_session ?? {
        prompt: "The situation changes without warning. What is your first move?",
        options: APPROACHES.map((approach, index) => ({
          id: `approach-${index + 1}`,
          label: [
            "Measure what changed before acting.",
            "Take the safest immediate action.",
            "Look for a pattern across the clues.",
            "Ask the most experienced person present.",
          ][index],
          approach,
        })),
      },
    startScene: first.id,
    scenes,
    backgroundAudio: audio
      ? { src: story.media_urls[audio.asset_key], loop: true }
      : undefined,
  };
}

export async function getGeneratedScenarios(): Promise<Scenario[]> {
  const summaries = await getGeneratedStories();
  const stories = await Promise.allSettled(
    summaries.map(({ story_id }) => getGeneratedStory(story_id)),
  );
  return stories.flatMap((result) =>
    result.status === "fulfilled"
      ? [generatedStoryToScenario(result.value)]
      : [],
  );
}

function adaptScene(
  story: GeneratedStory,
  draft: GeneratedScene,
  activity: GeneratedActivity | undefined,
  index: number,
): Scene {
  const next = story.bundle.storyline.scenes[index + 1]?.scene_id;
  const last = index === story.bundle.storyline.scenes.length - 1;
  const base = {
    id: draft.scene_id,
    act: draft.act,
    mood: draft.mood ?? moodFor(draft.act, last),
    beat: draft.beat ?? draft.title,
    visual: visualFor(story, draft),
    primer: draft.primer,
    trivia: draft.trivia ?? undefined,
    learningReference: draft.learning_reference
      ? {
          title: cleanLearnerText(draft.learning_reference.title),
          imageUrl: draft.learning_reference.image_url,
          sourcePageUrl: draft.learning_reference.source_page_url,
          sourceName: draft.learning_reference.source_name,
          licenseName: draft.learning_reference.license_name,
          licenseUrl: draft.learning_reference.license_url,
          altText: cleanLearnerText(draft.learning_reference.alt_text),
          plainExplanation: draft.learning_reference.plain_explanation,
          whyImportant: draft.learning_reference.why_important,
        }
      : undefined,
    simulation: activity?.simulation
      ? {
          kind: "declarative" as const,
          title: humanizeModelKind(activity.simulation.model_kind),
          prompt: activity.simulation.prompt,
          controls: activity.simulation.controls.map((control) => ({
            id: control.control_id,
            label: control.label,
            min: control.minimum,
            max: control.maximum,
            step: control.step,
            initial: control.initial,
            unit: control.unit,
          })),
          observedVariables: activity.simulation.observed_variables,
          readouts: activity.simulation.readouts?.length
            ? activity.simulation.readouts.map((readout) => ({
                id: readout.readout_id,
                label: readout.label,
                operation: readout.operation,
                inputIds: readout.input_ids,
                params: compatibleReadoutParams(
                  activity.simulation!,
                  readout,
                ),
                cases: readout.cases,
                fallback: readout.fallback,
                successValue: readout.success_value,
                unit: readout.unit,
                decimals: readout.decimals,
              }))
            : legacySimulationReadouts(activity.simulation.model_kind),
          successCondition: activity.simulation.success_condition,
          explanation: activity.simulation.explanation,
        }
      : undefined,
    simGuide: activity?.simulation?.guide,
  };
  const hints =
    draft.hints ??
    ([
      "Start with the observable change in the scene.",
      "Connect that evidence to the mechanism you have already tested.",
      "Choose the move that changes the cause, not only the symptom.",
    ] as [string, string, string]);
  const concept =
    draft.concept ?? activity?.learning_objective ?? draft.learning_purpose;

  if (last || draft.scene_type === "ending") {
    return {
      ...base,
      type: "ending",
      text: draft.narrative,
      outcome: draft.outcome ?? "success",
    };
  }

  if (activity?.slider) {
    const slider = activity.slider;
    return {
      ...base,
      type: "slider",
      text: draft.narrative,
      prompt: slider.prompt,
      slider: {
        label: slider.label,
        unit: slider.unit,
        min: slider.minimum,
        max: slider.maximum,
        step: slider.step,
        initial: slider.initial,
      },
      target: { min: slider.target_minimum, max: slider.target_maximum },
      readout: {
        label: slider.readout_label,
        unit: slider.readout_unit,
        expr: slider.readout_expr,
        params: compatibleSliderParams(slider),
        decimals: slider.readout_decimals,
      },
      driver: {
        label: slider.driver_label,
        value: slider.driver_value,
        unit: slider.driver_unit,
        ...compatibleSliderDriver(slider),
      },
      risk: { mode: slider.risk_mode, safeGap: slider.risk_safe_gap },
      meter: slider.meter,
      bands: slider.bands,
      simGuide:
        slider.guide ??
        {
          shows: `This model compares ${slider.readout_label.toLowerCase()} with ${slider.driver_label.toLowerCase()} as you change ${slider.label.toLowerCase()}.`,
          move: `Move the ${slider.label.toLowerCase()} slider between ${slider.minimum}${slider.unit} and ${slider.maximum}${slider.unit}.`,
          watch: `${slider.explanation} Use the live readout and feedback band to see how close your setting is to the target.`,
        },
      hints,
      concept,
      probe: draft.probe ?? undefined,
      next,
    };
  }

  if (activity?.reorder) {
    return {
      ...base,
      type: "reorder",
      text: draft.narrative,
      prompt: activity.reorder.prompt,
      instruction:
        activity.reorder.instruction ??
        "Put the events in the order that makes the outcome happen.",
      steps: activity.reorder.correct_order.map((id) => {
        const item = activity.reorder!.items.find(
          (candidate) => candidate.item_id === id,
        );
        return {
          id,
          label: item?.label ?? id,
          detail: item?.detail ?? undefined,
        };
      }),
      wrong:
        activity.reorder.wrong ??
        "That order skips a causal link. Trace what must change before the next event can happen.",
      right: activity.reorder.right ?? activity.reorder.explanation,
      hints,
      concept,
      probe: draft.probe ?? undefined,
      next,
    };
  }

  if (activity?.reflection || draft.scene_type === "reflect") {
    return {
      ...base,
      type: "reflect",
      text: draft.narrative,
      prompt:
        activity?.reflection?.prompt ??
        draft.probe ??
        "What evidence would make you revise your current explanation?",
      placeholder:
        activity?.reflection?.placeholder ??
        "Name the clue and what it would change...",
      next,
    };
  }

  const quiz = activity?.quiz;
  const sourceChoices = quiz
    ? quiz.options.map((option) => ({
        choice_id: option.option_id,
        label: option.label,
        consequence: quiz.correct_option_ids.includes(option.option_id)
          ? quiz.explanation
          : "The system does not respond as intended. Recheck the evidence and try again.",
        correct: quiz.correct_option_ids.includes(option.option_id),
      }))
    : draft.choices;
  if (sourceChoices.length > 0 || draft.scene_type === "choice") {
    const options: ChoiceOption[] = sourceChoices.map((choice, choiceIndex) => ({
      id: choice.choice_id,
      label: choice.label,
      correct: choice.correct,
      outcome: choice.correct ? choice.consequence : undefined,
      next: choice.correct ? next : draft.scene_id,
      approach: APPROACHES[choiceIndex % APPROACHES.length],
    }));
    return {
      ...base,
      type: "choice",
      text: draft.narrative,
      prompt: quiz?.prompt ?? draft.learning_purpose,
      options,
      consequences: Object.fromEntries(
        sourceChoices
          .filter((choice) => !choice.correct)
          .map((choice) => [choice.choice_id, choice.consequence]),
      ),
      hints,
      concept,
      probe: draft.probe ?? undefined,
    };
  }

  return {
    ...base,
    type: "narrative",
    text: draft.narrative,
    next,
  };
}

function visualFor(
  story: GeneratedStory,
  scene: GeneratedScene | undefined,
): SceneVisual {
  if (!scene) {
    return {
      kind: "generated",
      title: story.bundle.storyline.title,
      caption: story.bundle.storyline.synopsis,
      status: "Briefing",
    };
  }
  const image = story.bundle.assets.find(
    (asset) => asset.kind === "image" && asset.scene_id === scene.scene_id,
  );
  return {
    kind: "generated",
    title: scene.title,
    caption: image?.alt_text ?? scene.media_cue,
    status: `Chapter ${scene.act} · ${scene.beat ?? scene.title}`,
    src: image ? story.media_urls[image.asset_key] : undefined,
  };
}

function adaptTakeaway(
  value: GeneratedStory["bundle"]["storyline"]["takeaway"],
  discipline: string,
): StoryTakeaway {
  if (typeof value !== "string") {
    return {
      concept: value.concept,
      field: value.field,
      inOneLine: value.in_one_line,
      rule: value.rule,
      elsewhere: value.elsewhere,
      youUsedIt: value.you_used_it,
    };
  }
  return {
    concept: discipline,
    field: discipline,
    inOneLine: value,
    rule: value,
    elsewhere: [
      "Use the same causal model when a familiar system behaves differently.",
      "Test the mechanism before trusting the most obvious explanation.",
      "Prefer fixes that remain useful when surrounding conditions change.",
    ],
    youUsedIt: [
      "You diagnosed the first visible failure from evidence.",
      "You tested an intervention and watched the world respond.",
      "You revised the plan when the operating condition changed.",
    ],
  };
}

function normalizeDomain(value: string): Domain {
  const lower = value.toLowerCase();
  const exact = DOMAINS.find((domain) => lower.includes(domain));
  if (exact) return exact;
  if (
    /semiconductor|electronic|mechanic|energy|thermodynamic|heat transfer/.test(
      lower,
    )
  ) {
    return "physics";
  }
  if (/market|finance|supply|demand/.test(lower)) return "economics";
  if (/molecule|reaction|material/.test(lower)) return "chemistry";
  if (/cell|genetic|ecology|medicine/.test(lower)) return "biology";
  return "history";
}

function moodFor(act: 1 | 2 | 3, ending: boolean): Mood {
  if (ending) return "resolve";
  if (act === 1) return "tense";
  if (act === 2) return "alarm";
  return "insight";
}

function humanizeModelKind(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function cleanLearnerText(value: string): string {
  return value
    .replace(/^File\s*:\s*/i, "")
    .replace(/\.(?:svg|png|jpe?g|webp|gif|pdf)\b/gi, "")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compatibleReadoutParams(
  simulation: NonNullable<GeneratedActivity["simulation"]>,
  readout: NonNullable<
    NonNullable<GeneratedActivity["simulation"]>["readouts"]
  >[number],
): Record<string, number> {
  if (
    simulation.model_kind === "equity_valuation" &&
    readout.operation === "linear" &&
    (readout.params.intercept ?? 0) === 0
  ) {
    const preMoney = /\$(\d+(?:\.\d+)?)M\s+pre-money/i.exec(
      `${simulation.prompt} ${simulation.guide?.shows ?? ""}`,
    );
    if (preMoney) {
      return { ...readout.params, intercept: Number(preMoney[1]), slope: 1 };
    }
  }
  return readout.params;
}

function compatibleSliderParams(
  slider: NonNullable<GeneratedActivity["slider"]>,
): Record<string, number> {
  if (
    slider.readout_expr !== "linear" ||
    Number.isFinite(slider.readout_params.slope)
  ) {
    return slider.readout_params;
  }

  const target = (slider.target_minimum + slider.target_maximum) / 2;
  const promised = /(?:reaches|extends to|produces?)\s+\$?(\d+(?:\.\d+)?)/i.exec(
    `${slider.guide?.watch ?? ""} ${slider.explanation}`,
  );
  if (!promised || target === 0) return slider.readout_params;
  return {
    ...slider.readout_params,
    intercept: 0,
    slope: Number(promised[1]) / target,
  };
}

function compatibleSliderDriver(
  slider: NonNullable<GeneratedActivity["slider"]>,
): Pick<SliderScene["driver"], "expr" | "params"> {
  if (slider.driver_expr) {
    return {
      expr: slider.driver_expr,
      params: slider.driver_params,
    };
  }
  if (/founder ownership/i.test(slider.driver_label)) {
    const preMoney = /\$(\d+(?:\.\d+)?)M\s+pre-money/i.exec(slider.prompt);
    if (preMoney) {
      return {
        expr: "part_of_total_percent",
        params: { numerator: Number(preMoney[1]) },
      };
    }
  }
  return { expr: "fixed", params: {} };
}
