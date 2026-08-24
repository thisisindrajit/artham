import { notFound } from "next/navigation";
import { Session } from "@/components/session";
import { getGeneratedStory } from "@/lib/generated-story";
import { generatedStoryToScenario } from "@/lib/generated-story-adapter";
import { getSession } from "@/lib/session";

export default async function GeneratedStoryPage({
  params,
}: PageProps<"/play/generated/[storyId]">) {
  const { storyId } = await params;
  const session = await getSession();
  if (!session) notFound();
  let story;

  try {
    story = await getGeneratedStory(storyId);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) notFound();
    throw error;
  }

  return <Session scenario={generatedStoryToScenario(story)} user={session.user} />;
}
