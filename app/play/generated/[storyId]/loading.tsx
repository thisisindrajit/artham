import { PaperBackdrop } from "@/components/paper-backdrop";

export default function GeneratedStoryLoading() {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden px-5 py-16">
      <PaperBackdrop />
      <div className="relative mx-auto max-w-4xl animate-pulse space-y-6">
        <div className="h-5 w-36 rounded-full bg-ink/10" />
        <div className="h-14 max-w-2xl rounded-2xl bg-ink/10" />
        <div className="aspect-video rounded-3xl bg-accent/10" />
        <div className="space-y-3">
          <div className="h-4 rounded-full bg-ink/10" />
          <div className="h-4 w-5/6 rounded-full bg-ink/10" />
        </div>
      </div>
    </main>
  );
}
