import { notFound } from "next/navigation";
import { Session } from "@/components/session";
import { getScenario, scenarios } from "@/lib/story";

export function generateStaticParams() {
  return scenarios.map((scenario) => ({ scenarioId: scenario.id }));
}

export default async function PlayPage({
  params,
}: PageProps<"/play/[scenarioId]">) {
  const { scenarioId } = await params;
  const scenario = getScenario(scenarioId);
  if (!scenario) notFound();
  return <Session scenario={scenario} />;
}
