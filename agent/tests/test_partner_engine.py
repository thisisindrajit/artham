from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from artham_partner.story_pipeline.clients.reasoning import (
    LiteLlmReasoningClient,
)
from artham_partner.story_pipeline.partner_contracts import (
    ObserveOutput,
    ObserveRequest,
    ProfileEvidence,
    ProfileDetail,
    ProfileOutput,
    ProfileRequest,
    ScenarioContext,
    ThinkingObservation,
)
from artham_partner.story_pipeline.partner_engine import ThinkingEngine
from tests.helpers import settings


def scenario() -> ScenarioContext:
    return ScenarioContext.model_validate(
        {
            "id": "market-story",
            "title": "Market Story",
            "domain": "economics",
            "learningGoal": "Use evidence to respond to scarcity.",
            "role": "Operations director",
            "greeting": "The market is moving.",
            "activitySequence": [
                {
                    "position": 1,
                    "sceneId": "scene-1",
                    "beat": "Price spike",
                    "activity": "quiz",
                },
                {
                    "position": 2,
                    "sceneId": "scene-2",
                    "beat": "Tune the order",
                    "activity": "slider",
                },
            ],
        }
    )


def notes() -> dict:
    return {
        "preSessionAnswer": "Check the numbers first",
        "decisions": [
            {
                "scene": "scene-1",
                "choice": "Compare suppliers",
                "correct": True,
                "attempt": 1,
                "approach": "measure_first",
            }
        ],
        "mistakes": [],
        "experiments": [
            {"scene": "scene-2", "value": 24, "correct": False},
            {"scene": "scene-2", "value": 26, "correct": True},
        ],
        "reasoning": [],
        "observations": [],
        "hintsUsed": 0,
        "selfCorrections": 1,
        "helpRequests": 0,
    }


class ThinkingEngineTests(unittest.IsolatedAsyncioTestCase):
    async def test_litellm_client_retries_malformed_json(self) -> None:
        malformed = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        parsed=None,
                        content='{"action":"encourage"',
                    )
                )
            ]
        )
        expected = ObserveOutput(
            action="encourage",
            message="You adjusted after checking the evidence.",
            observation=None,
        )
        valid = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        parsed=None,
                        content=expected.model_dump_json(),
                    )
                )
            ]
        )
        client = LiteLlmReasoningClient(settings())

        with patch(
            "artham_partner.story_pipeline.clients.reasoning.acompletion",
            new=AsyncMock(side_effect=[malformed, valid]),
        ) as completion:
            result = await client.generate_structured(
                prompt="Review this action.",
                output_model=ObserveOutput,
            )

        self.assertEqual(result, expected)
        self.assertEqual(completion.await_count, 2)
        response_format = completion.await_args.kwargs["response_format"]
        self.assertEqual(response_format, {"type": "json_object"})
        self.assertIn(
            "previous response violated the output schema",
            completion.await_args.kwargs["messages"][0]["content"],
        )

    async def test_observe_uses_cumulative_progression(self) -> None:
        observation = ThinkingObservation(
            category="strategy",
            observation="Compared evidence before changing the order.",
            evidence="Compared suppliers, then adjusted 24 to 26.",
            confidence=0.84,
            scene_id="scene-2",
        )
        expected = ObserveOutput(
            action="encourage",
            message="You checked the signal, then adjusted one value.",
            observation=observation,
        )
        reasoning = AsyncMock()
        reasoning.generate_structured.return_value = expected
        engine = ThinkingEngine(reasoning)
        request = ObserveRequest.model_validate(
            {
                "scenario": scenario().model_dump(by_alias=True),
                "event": {
                    "kind": "self_correction",
                    "sceneId": "scene-2",
                    "what": "Changed 24 to 26",
                },
                "notes": notes(),
                "fallbackHint": "Acknowledge the change without giving the answer.",
            }
        )

        result = await engine.observe(request)

        self.assertEqual(result, expected)
        prompt = reasoning.generate_structured.await_args.kwargs["prompt"]
        self.assertIn("activitySequence", prompt)
        self.assertIn("Tune the order", prompt)
        self.assertIn("Compare suppliers", prompt)
        self.assertIn("24", prompt)
        self.assertIn("26", prompt)

    async def test_profile_uses_prior_model_observations(self) -> None:
        expected = ProfileOutput(
            archetype="Evidence Tuner",
            score=84,
            summary="You compare signals, then revise one variable at a time.",
            strength=ProfileEvidence(
                title="Measured adjustment",
                evidence="You compared suppliers and corrected 24 to 26.",
            ),
            blind_spot=ProfileEvidence(
                title="Limited stress testing",
                evidence="You stopped after the first successful correction.",
            ),
            noticed="Your later move used evidence from the earlier market check.",
            details=[
                ProfileDetail(
                    title="Changed one number",
                    observation="You revised rather than repeated.",
                    evidence="Changed 24 to 26.",
                ),
                ProfileDetail(
                    title="Connected scenes",
                    observation="You reused an earlier clue.",
                    evidence="Compared suppliers before tuning.",
                ),
                ProfileDetail(
                    title="Stopped after success",
                    observation="You accepted the first working correction.",
                    evidence="No second stress test followed.",
                ),
            ],
            try_next="Try a market where one signal is delayed.",
        )
        reasoning = AsyncMock()
        reasoning.generate_structured.return_value = expected
        engine = ThinkingEngine(reasoning)
        profile_notes = notes()
        profile_notes["observations"] = [
            {
                "category": "adaptation",
                "observation": "Revised one value after feedback.",
                "evidence": "Changed 24 to 26.",
                "confidence": 0.8,
                "sceneId": "scene-2",
            }
        ]
        request = ProfileRequest.model_validate(
            {
                "scenario": scenario().model_dump(by_alias=True),
                "notes": profile_notes,
                "outcome": "success",
            }
        )

        result = await engine.profile(request)

        self.assertEqual(result, expected)
        prompt = reasoning.generate_structured.await_args.kwargs["prompt"]
        self.assertIn("model observations", prompt)
        self.assertIn("Revised one value", prompt)
        self.assertIn("exactly 3-4 small", prompt)


if __name__ == "__main__":
    unittest.main()
