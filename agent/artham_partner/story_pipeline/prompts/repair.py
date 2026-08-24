"""Targeted repair prompt."""

REPAIR_INSTRUCTION = """\
The input contains the generated storyline, activities, media plan, and a
validation report. Repair every error and, when safe, each warning.

Return the complete replacement section requested by the scoped instruction below.
Preserve unchanged material exactly when it is not implicated by an issue. Never
change the selected topic, learner, supplied source URLs, or factual evidence. Do
not paper over an unsupported claim with vague wording if it should be removed.

Maintain all graph references and activity-to-scene links. If a media prompt
changes, keep its asset_key stable unless the asset is being removed. Do not claim
a problem is fixed unless the replacement output actually fixes it.

Preserve and restore authored-player fields during every repair: scene_type, mood,
beat, primers, trivia, hints, intro, pre_session, player_takeaway, reorder feedback,
learning references with exact source and license metadata, simulation guides,
typed simulation readouts and their promised success values, slider configuration,
and the recurring character bible. Never
repair a scene by dropping its interaction or replacing character action with
exposition.

When repairing story quality, preserve the strongest existing causal material and
restore the missing high-agency beat: observable evidence, constrained action,
visible consequence, changed-condition reversal, or durable resolution. Do not
inflate weak material with extra exposition. Rewrite the affected scene or
activity so the learner does something and the world answers.

Arithmetic repairs are never cosmetic:
- linear requires explicit finite intercept and slope;
- any repaired linear slider must include numeric readout_params.intercept and
  readout_params.slope; never return an empty readout_params object;
- sum, difference, product, and share_percent require at least two valid input IDs;
- post-money value is pre-money plus investment, not the investment alone;
- a changing comparison value must use a dynamic driver rather than a fixed label;
- calculate initial, success, and boundary outputs and make success_value and
  guide.watch exactly match the executable result.
Never change the promised answer to match a broken default formula. Repair the
formula itself.

For activity repairs, follow these stricter temporary constraints:
- preserve every required simulation; physics stories must retain exactly three
  simulation activities;
- avoid linear simulation readouts;
- reject one-control target dials. Every simulation needs 2-4 controls and at least
  one meaningful readout derived from two or more controls. Use identity only for
  secondary context, never as the lesson or success proof;
- use only sum, difference, product, or share_percent for
  derived values, with complete input_ids, params, success_value, unit, and decimals;
- preserve valid option IDs but place quiz answers in varied positions;
- independently calculate every readout at the initial state, success witness, and
  control boundaries before returning the replacement.
- every identifier in success_condition and every readout input_id must exactly
  match a declared control_id in the same simulation; never invent or rename one.
- set observed_variables to exactly the readout_id values in readouts, with no
  extra display labels or prose variables;
- each readout must use its exact supported shape: sum, difference, product, and
  share_percent need at least two declared input_ids; identity and linear need
  exactly one; linear needs intercept and slope. Never use lookup or
  base_conversion in a repaired physics simulation;
- for hydraulics, use simple auditable relationships such as input force × area
  ratio = output force or available force − load = lifting margin;
- replace the complete invalid simulation object rather than retaining stale
  observed variables, inputs, cases, or success values from the rejected object.
"""
