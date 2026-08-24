import { useState, type DragEvent } from "react";
import { cardSoft, storyIndex, storyOption, storyTag } from "@/constants/ui";
import type { ReflectScene, ReorderScene } from "@/lib/story";
import { shuffledStepIds } from "@/utils/story-shuffle";
import { HelpButton, NudgeButton, PrimaryButton } from "./controls";
import { StoryCopy } from "./shared";

export function ReorderControls({
  scene,
  busy,
  onSubmit,
  onHelp,
  initialOrder,
}: {
  scene: ReorderScene;
  busy: boolean;
  onSubmit: (order: string[]) => void;
  onHelp: () => void;
  initialOrder?: string[];
}) {
  const [order, setOrder] = useState(
    () => initialOrder ?? shuffledStepIds(scene),
  );
  const [moved, setMoved] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setMoved(next[target]);
  }

  function moveTo(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    setOrder((current) => {
      const from = current.indexOf(draggedId);
      const to = current.indexOf(targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      next.splice(from, 1);
      next.splice(to, 0, draggedId);
      return next;
    });
    setMoved(draggedId);
  }

  function startDrag(event: DragEvent<HTMLLIElement>, id: string) {
    setDragging(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className={`${storyTag} animate-rise inline-flex rounded-full px-3 py-1 text-[13px] font-bold italic motion-reduce:animate-none`}>
          <span aria-hidden className="mr-1.5 not-italic">🧩</span>
          Put it in order
        </span>
        <h2 className="animate-rise text-[21px] font-bold tracking-tight text-ink motion-reduce:animate-none">
          <StoryCopy text={scene.prompt} />
        </h2>
        <p className="animate-rise text-[15.5px] leading-relaxed text-muted motion-reduce:animate-none">
          {scene.instruction}
        </p>
        <p className="text-[13px] text-faint">
          Drag the cards into place, or use the arrow buttons.
        </p>

        <ol className="grid gap-2.5 pt-1">
          {order.map((id, i) => {
            const stepData = scene.steps.find((s) => s.id === id);
            if (!stepData) return null;
            return (
              <li
                key={id}
                draggable={!busy}
                onDragStart={(event) => startDrag(event, id)}
                onDragEnter={() => dragging && moveTo(dragging, id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(null);
                }}
                onDragEnd={() => setDragging(null)}
                aria-grabbed={dragging === id}
                className={`${cardSoft} ${storyOption} animate-rise flex cursor-grab items-start gap-3 rounded-2xl px-4 py-3.5 transition duration-200 motion-reduce:animate-none active:cursor-grabbing ${
                  moved === id ? "border-accent/45 bg-accent/8" : ""
                } ${
                  dragging === id ? "scale-[0.98] opacity-55 shadow-none" : ""
                }`}
                style={{ animationDelay: `${180 + i * 70}ms` }}
              >
                <span
                  aria-hidden
                  className="pt-1 text-lg leading-none text-faint"
                >
                  ⠿
                </span>
                <span
                  className={`${storyIndex} font-mono tabular-nums grid size-8 shrink-0 place-items-center rounded-full text-[15px] font-extrabold italic`}
                  aria-label={`Position ${i + 1}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-medium text-ink">
                    <StoryCopy text={stepData.label} />
                  </span>
                  {stepData.detail && (
                    <span className="mt-0.5 block text-[15px] leading-relaxed text-muted">
                      <StoryCopy text={stepData.detail} />
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 flex-col gap-1">
                  <NudgeButton
                    dir="up"
                    label={`Move "${stepData.label}" earlier`}
                    disabled={busy || i === 0}
                    onClick={() => move(i, -1)}
                  />
                  <NudgeButton
                    dir="down"
                    label={`Move "${stepData.label}" later`}
                    disabled={busy || i === order.length - 1}
                    onClick={() => move(i, 1)}
                  />
                </span>
              </li>
            );
          })}
        </ol>

        <div className="pt-2">
          <PrimaryButton
            onClick={() => onSubmit(order)}
            label="Lock in this order"
            disabled={busy}
          />
        </div>
      </div>

      <HelpButton onClick={onHelp} busy={busy} />
    </div>
  );
}

export function ReflectControls({
  scene,
  busy,
  onSubmit,
}: {
  scene: ReflectScene;
  busy: boolean;
  onSubmit: (answer: string) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div
      className="animate-rise space-y-3 motion-reduce:animate-none"
      style={{ animationDelay: "160ms" }}
    >
      <p className={`${storyTag} inline-flex rounded-full px-3 py-1 text-[13px] font-bold italic tracking-[0.12em] uppercase`}>
        <span aria-hidden className="mr-1.5 not-italic">💭</span>
        Quick thought
      </p>
      <p className="text-[17px] leading-relaxed text-ink/90">
        <StoryCopy text={scene.prompt} />
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        placeholder={scene.placeholder}
        className="w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-[16px] leading-relaxed text-ink shadow-inner outline-none placeholder:text-faint focus:border-accent/45 focus:ring-4 focus:ring-accent/10"
      />
      <div className="flex items-center gap-4">
        <PrimaryButton
          onClick={() => onSubmit(draft)}
          label="Continue"
          disabled={busy || !draft.trim()}
        />
        <button
          onClick={() => onSubmit("")}
          disabled={busy}
          className="text-[16px] text-faint transition hover:text-muted"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
