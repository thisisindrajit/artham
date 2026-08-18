import { storyTag } from "@/constants/ui";
import type {
  EndingScene,
  NarrativeScene,
  Scene,
  SessionNotes,
  StoryTakeaway,
} from "@/lib/story";
import { PrimaryButton } from "./controls";
import {
  Narration,
  PrimerCard,
  SceneHeading,
  StoryCopy,
  TakeawayCard,
  TriviaCard,
} from "./shared";

export function NarrativeView({
  scene,
  onAdvance,
}: {
  scene: NarrativeScene;
  onAdvance: () => void;
}) {
  return (
    <div className="space-y-8">
      <Narration text={scene.text} />
      {scene.trivia && (
        <TriviaCard trivia={scene.trivia} delay={scene.text.length * 110} />
      )}
      <PrimaryButton
        onClick={onAdvance}
        delay={scene.text.length * 110 + (scene.trivia ? 260 : 120)}
        label="Continue"
      />
    </div>
  );
}

export function EndingView({
  scene,
  takeaway,
  onFinish,
}: {
  scene: EndingScene;
  takeaway: StoryTakeaway;
  onFinish: () => void;
}) {
  const base = scene.text.length * 110;
  return (
    <div className="space-y-8">
      <Narration text={scene.text} />
      {scene.trivia && <TriviaCard trivia={scene.trivia} delay={base} />}
      <TakeawayCard takeaway={takeaway} delay={base + 140} />
      <PrimaryButton
        onClick={onFinish}
        label="See what Artham noticed"
        delay={base + 320}
      />
    </div>
  );
}

/**
 * A page the learner has already played, reopened read-only.
 *
 * Going back must never mean *replaying*: the profile is built from what they
 * actually did, so a second run at a decision they already made would either
 * double-count or silently overwrite it. So the controls are gone and what
 * they chose is shown in their place. Re-reading is free; rewriting is not.
 */
export function ReviewView({
  scene,
  notes,
}: {
  scene: Scene;
  notes: SessionNotes;
}) {
  const decision = notes.decisions.filter((d) => d.sceneId === scene.id).at(-1);
  const experiment = notes.experiments
    .filter((e) => e.sceneId === scene.id)
    .at(-1);
  const said = notes.reasoningSamples
    .filter((r) => r.sceneId === scene.id)
    .at(-1);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          className={`${storyTag} inline-flex rounded-full px-3 py-1 text-[13px] font-bold italic`}
        >
          <span aria-hidden className="mr-1.5 not-italic">
            🔖
          </span>
          Looking back
        </span>
        <SceneHeading scene={scene} className="min-w-0" />
      </div>

      <Narration text={scene.text} />
      {scene.trivia && <TriviaCard trivia={scene.trivia} />}
      {"primer" in scene && scene.primer && <PrimerCard primer={scene.primer} />}

      {(decision || experiment || said) && (
        <div className="rounded-2xl border border-line bg-accent/[0.05] px-5 py-4">
          <p className="text-[11.5px] font-extrabold tracking-[0.15em] text-ink/60 uppercase">
            What you did here
          </p>
          <ul className="mt-2 space-y-1.5 text-[15px] leading-[1.55] text-ink/80">
            {decision && <li>You chose: {decision.choice}</li>}
            {experiment && <li>You settled on: {experiment.value}</li>}
            {said && <li>You said: {said.answer}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ConsequenceView({
  text,
  correct,
  onAdvance,
}: {
  text: string;
  correct: boolean;
  onAdvance: () => void;
}) {
  return (
    <div className="space-y-8">
      <div
        className={`animate-slide-up -rotate-[0.35deg] rounded-2xl border-[1.5px] px-6 py-5 shadow-[0_5px_0_rgba(23,23,23,0.08),0_18px_38px_rgba(23,23,23,0.08)] motion-reduce:animate-none ${
          correct
            ? "border-sage/25 bg-sage/10"
            : "border-rose/25 bg-rose/10"
        }`}
      >
        <p className="mb-2 text-[13px] font-extrabold italic tracking-[0.16em] text-ink/75 uppercase">
          <span aria-hidden className="mr-1.5 not-italic">
            {correct ? "✅" : "⚠️"}
          </span>
          {correct ? "That worked" : "Meanwhile…"}
        </p>
        <p className="text-[17px] leading-[1.7] text-ink/85">
          <StoryCopy text={text} />
        </p>
      </div>
      <PrimaryButton onClick={onAdvance} label="Continue" delay={220} />
    </div>
  );
}
