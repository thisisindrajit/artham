"""Still-image and background-audio media planning prompts."""

from .story_quality import STORY_QUALITY_BAR

MEDIA_PLAN_INSTRUCTION = """\
The input contains a complete storyline and a media budget. Honor
media_budget.generate_cover_image exactly. Use the remaining max_images slots
for coherent scene images and create the requested background-audio plan. Video
is disabled and must be null.

""" + STORY_QUALITY_BAR + """\

- When generate_cover_image is true, create one dedicated cover image with
  scene_id=null and an asset_key beginning
  with "cover". It must be a polished 16:9 animated storybook illustration showing
  one clear place, the opening scene's unique physical problem, and at most two
  recurring characters. Use a medium-wide, eye-level cinematic frame, dimensional
  environments, tactile materials, clean silhouettes, and subtle atmospheric depth.
  Derive a distinctive palette, lighting, season, and visual energy from this
  story's setting; do not reuse a default teal-and-amber, dark, rainy, or gloomy
  treatment. Keep the
  composition natural, uncluttered, and directly relevant to the premise. When
  generate_cover_image is false, do not create a cover image.
  Never make it a movie poster, promotional key art, dramatic montage, collage,
  split composition, heroic ensemble pose, or title-card image.
- Create one image for every scene when the image budget permits it. Each scene
  image must depict that scene's specific action and evidence rather than repeat
  the cover composition.
- Treat the visual_style_guide as a continuity bible: define medium, lens/framing,
  palette, weather/time progression, recurring location geometry, wardrobe or
  equipment, and how evidence is made legible without text.
- Choose exactly one rendering medium for the whole story (for example, polished
  cinematic 3D animation or painterly editorial illustration) and repeat that exact
  medium in every prompt. Never mix photography, live action, comics, anime, flat
  vector art, or another rendering style within one story.
- Treat the recurring cast as the visual spine. Define each named character's age
  range, silhouette, face, hair, wardrobe, equipment, and relationship to the
  learner in the visual_style_guide, then repeat those continuity details in every
  relevant production brief.
- Every image must show at least one named recurring character clearly in the
  foreground. Include the character's exact name and full visual description in
  each prompt. Their face, body language, and story action must be visible.
- State explicitly in every image prompt that all depicted characters are
  fictional adults age 21 or older. Never describe them as teens, children, pupils,
  school students, or minors.
- Never generate an image containing only a chip, wafer, lattice, machine, graph,
  laboratory, or technical close-up. Technical evidence must appear as a prop or
  background detail while a character examines, changes, or reacts to it.
- The cover must clarify the place, central problem, and human stakes. It must
  depict this specific story, not a generic educational illustration. Include
  one specific, visually contradictory or state-revealing detail unique to this
  story's problem (for example, a glowing warm part beside frost-covered pipes,
  or a cracked instrument next to an intact one) — not just a character standing
  in a generic setting.
- Depict only mechanisms and objects already explained accurately in the story.
  Do not invent a visual causal explanation or add specialist instruments for
  spectacle. Alt text must name familiar visible things in plain English, not
  assume the learner knows technical labels. Media reinforces narrative teaching;
  it cannot be the only explanation of a prerequisite.
- Generated ending art should show the story's earned happy situational resolution
  and warm character callback without inventing a cure, approval, or outcome.
  Media fields are plain text without Markdown or emojis, and generated art must
  contain no writing or overlays.
- Use the same premium animated storybook aesthetic for every generated story:
  expressive but restrained adult characters, readable silhouettes, dimensional
  environments, controlled stylization, tactile surfaces, cinematic depth, and a
  strong sense of anticipation. Avoid photorealistic stock imagery, anime, glossy
  superhero art, flat clip art, childish cartoons, and sterile textbook diagrams.
- Write prompts as production briefs: subject and action, environment, camera
  position and shot scale, lighting/weather/time, physical evidence to emphasize,
  continuity details, and exclusions. Do not request split screens, diagrams,
  floating labels, UI overlays, captions, or infographic layouts.
- Every image must be completely text-free. Explicitly require no
  letters, words, numbers, labels, captions, subtitles, signs, logos, watermarks,
  interface text, document text, or readable writing anywhere in the frame. Show
  evidence through objects, color, position, motion, and character reactions instead.
- If any incidental text is unavoidable, it must be in English only. Never include
  Polish, German, French, Spanish, Cyrillic, Arabic, or other non-English writing.
- Make the cover composition distinct from scene one without making it theatrical.
  Use a single grounded moment, restrained expressions, ordinary lighting, ample
  negative space, and only the props needed to identify the problem. Do not depict
  the final fix.
- Prompts must explicitly repeat that the frame contains no text or writing of any
  kind, plus no logos, celebrity likenesses, or identifiable real people.
- Set video=null. Never write a video prompt.
- When background audio is enabled, provide one loopable instrumental audio request.
  Make it slow, mild, ethereal, and non-distracting, with slowly evolving pads,
  airy textures, distant story-world ambience, and a calm resolution. Keep it
  beneath narration. Put beats, rhythmic pulse, percussion, drums, sharp
  transients, vocals, and copyrighted-artist references in negative_prompt.
- When background audio is disabled, set audio=null.
- When requested, return the cover followed by scene images in story order.
  Otherwise return only scene images in story order.
"""

VIDEO_GATE_INSTRUCTION = """\
Act as a strict cost and narrative gate for one proposed Veo clip.

Approve only when all are true:
1. video is enabled and within clip/seconds limits;
2. motion or temporal order carries evidence the learner needs;
3. a still image plus prose would materially weaken the scene;
4. the prompt is safe for ages 13-18 and avoids identifiable people, readable
   text, logos, copyrighted characters, graphic harm, and deceptive framing;
5. footage is clearly fictional or contextualized by the story.

When approved, copy the request and make only safety-preserving prompt edits.
When rejected, approved_request must be null and the reason must name the failed
criterion.
"""
