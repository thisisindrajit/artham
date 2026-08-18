import { coldCase } from "@/stories/cold-case/scenario";
import { rentCrisis } from "@/stories/rent-crisis/scenario";
import { resonanceBridge } from "@/stories/resonance-bridge/scenario";
import { runawayReactor } from "@/stories/runaway-reactor/scenario";
import { trojanHorse } from "@/stories/trojan-horse/scenario";
import type { Scenario } from "@/types/story";

/** Order controls how stories appear on the landing page. */
export const SCENARIOS: Scenario[] = [
  resonanceBridge,
  runawayReactor,
  coldCase,
  rentCrisis,
  trojanHorse,
];
