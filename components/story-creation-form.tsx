"use client";

import { FormEvent, useMemo, useState } from "react";

const DEFAULT_SUBJECTS = [
  "History",
  "Science",
  "Technology",
  "Mathematics",
  "Geography",
  "Literature",
];

const AGE_GROUPS = [
  { label: "13–15 years", value: 14 },
  { label: "16–18 years", value: 17 },
];

const DIFFICULTIES = [
  { value: "easy", label: "Easy", description: "Use one clue in a guided, one-step decision." },
  { value: "medium", label: "Medium", description: "Connect several taught clues and rule out a plausible alternative." },
  { value: "hard", label: "Hard", description: "Resolve incomplete evidence, interacting constraints, and real tradeoffs." },
  { value: "adaptive", label: "Adaptive", description: "Choose a full difficulty level from learning history; otherwise start easy." },
] as const;

type Difficulty = (typeof DIFFICULTIES)[number]["value"];
type MediaChoice = "yes" | "no";

export function StoryCreationForm({ subjects = [] }: { subjects?: string[] }) {
  const subjectOptions = useMemo(
    () => [...new Set([...DEFAULT_SUBJECTS, ...subjects])].sort(),
    [subjects],
  );
  const [subject, setSubject] = useState("History");
  const [newSubject, setNewSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [age, setAge] = useState(14);
  const [difficulty, setDifficulty] = useState<Difficulty>("adaptive");
  const [images, setImages] = useState<MediaChoice>("yes");
  const [cover, setCover] = useState<MediaChoice>("yes");
  const [music, setMusic] = useState<MediaChoice>("no");
  const [video, setVideo] = useState<MediaChoice>("no");
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedSubject = subject === "__new__" ? newSubject.trim() : subject;
  const prompt = `Create an interesting, fun, engaging educational story for ages ${age - 1}–${age + 1} about the exact topic "${topic.trim()}" under the subject "${selectedSubject}", based on real world applications. Difficulty: ${difficulty}. ${DIFFICULTIES.find((option) => option.value === difficulty)?.description} At every difficulty, assume no prior knowledge of the topic or related terms. Start with an everyday observation, explain what each necessary thing is and does, then show one cause and its effect before asking the learner to apply it. Never explain an unfamiliar idea using another unexplained idea, and never simplify by changing the scientific meaning. Use no more than three characters in total, including the learner addressed as "you", so the cast stays easy to follow. Write substantial, vivid paragraphs with strong hooks, meaningful character tension, surprising turns, and forward momentum rather than short fragments. Explain key concepts clearly, include an explicit "In plain words" section, "Did you know?" facts, tooltips for important terms, and relevant consequential activities including at least one quiz. Essential explanations must appear in the narrative before any question, not only in tooltips or optional cards. Use only relevant English-language assets. Media: ${cover === "yes" ? "generate a dedicated cover image" : "do not generate a cover image"}; ${images === "yes" ? "generate relevant scene images" : "do not generate scene images"}; ${music === "yes" ? "generate background music" : "do not generate background music"}; ${video === "yes" ? "generate a video clip when useful" : "do not generate a video clip"}.`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setJobId(null);
    if (!selectedSubject || !topic.trim()) {
      setError("Choose or create a subject and enter a topic.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/story-jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotency_key: `story-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          target_age: age,
          duration_minutes: 8,
          difficulty,
          preferred_subjects: [{
            domain: selectedSubject.toLowerCase(),
            discipline: topic.trim(),
            topic_tags: [],
          }],
          locale: "en-US",
          media_budget: {
            max_images: (images === "yes" ? 5 : 0) + (cover === "yes" ? 1 : 0),
            generate_cover_image: cover === "yes",
            video: {
              enabled: video === "yes",
              max_clips: video === "yes" ? 1 : 0,
              max_total_seconds: video === "yes" ? 10 : 0,
            },
            generate_background_audio: music === "yes",
          },
          story_brief: prompt,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || payload.error || "Could not start story generation.");
      setJobId(payload.job_id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start story generation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold text-ink">
          Subject
          <select
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full rounded-2xl border border-ink/15 bg-white px-4 py-3 font-normal"
          >
            {subjectOptions.map((option) => <option key={option}>{option}</option>)}
            <option value="__new__">＋ Create a new subject</option>
          </select>
        </label>
        {subject === "__new__" && (
          <label className="space-y-2 text-sm font-semibold text-ink">
            New subject
            <input
              value={newSubject}
              onChange={(event) => setNewSubject(event.target.value)}
              placeholder="For example, Anthropology"
              className="w-full rounded-2xl border border-ink/15 bg-white px-4 py-3 font-normal"
            />
          </label>
        )}
      </div>

      <label className="block space-y-2 text-sm font-semibold text-ink">
        Topic
        <textarea
          required
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="What should the story teach?"
          rows={3}
          className="w-full resize-y rounded-2xl border border-ink/15 bg-white px-4 py-3 font-normal"
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-ink">Age group</legend>
        <div className="flex flex-wrap gap-3">
          {AGE_GROUPS.map((group) => (
            <label key={group.value} className="flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm">
              <input type="radio" name="age" checked={age === group.value} onChange={() => setAge(group.value)} />
              {group.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-ink">Difficulty</legend>
        <p className="text-sm text-muted">Every level teaches from the basics. Difficulty changes the reasoning, not the vocabulary.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DIFFICULTIES.map((option) => (
            <label key={option.value} className="flex items-start gap-2 rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm">
              <input type="radio" name="difficulty" value={option.value} checked={difficulty === option.value} onChange={() => setDifficulty(option.value)} className="mt-1" />
              <span>
                <span className="block font-semibold text-ink">{option.label}</span>
                <span className="text-muted">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <MediaChoice label="Scene images" value={images} onChange={setImages} />
        <MediaChoice label="Cover image" value={cover} onChange={setCover} />
        <MediaChoice label="Background music" value={music} onChange={setMusic} />
        <MediaChoice label="Video clip" value={video} onChange={setVideo} />
      </div>

      <details className="rounded-2xl border border-ink/10 bg-white/60 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Prompt preview</summary>
        <p className="mt-3 text-sm leading-relaxed text-muted">{prompt}</p>
      </details>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
      >
        {submitting ? "Starting generation…" : "Start story generation"}
      </button>

      {jobId && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Story generation started. Job ID: <code>{jobId}</code></p>}
      {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    </form>
  );
}

function MediaChoice({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MediaChoice;
  onChange: (value: MediaChoice) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-ink/10 bg-white/70 p-4">
      <legend className="px-1 text-sm font-semibold text-ink">{label}</legend>
      <div className="mt-2 flex gap-4 text-sm text-muted">
        {(["yes", "no"] as const).map((option) => (
          <label key={option} className="flex items-center gap-2 capitalize">
            <input type="radio" name={label} checked={value === option} onChange={() => onChange(option)} />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
