"""Still-image and background-audio media planning prompts."""

from .story_quality import STORY_QUALITY_BAR

MEDIA_PLAN_INSTRUCTION = """\
The input contains a complete storyline and a media budget. Create a coherent
still-image and background-audio media plan. Video is disabled and must be null.

""" + STORY_QUALITY_BAR + """\

- Create one dedicated cover image with scene_id=null and an asset_key beginning
  with "cover". It must be a simple, minimal 16:9 story illustration showing one
  clear place, one central problem, and at most two recurring characters. Keep the
  composition natural, quiet, uncluttered, and directly relevant to the premise.
  Never make it a movie poster, promotional key art, dramatic montage, collage,
  split composition, heroic ensemble pose, or title-card image.
- Also create exactly one image request for every storyline scene, linked by
  scene_id. Never omit a scene, reuse one image across scenes, or create multiple
  images for the same scene. Cover plus scene images must fit within max_images.
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
- Prioritize images in this order: crisis-establishing shot; decisive evidence;
  intervention being applied; reversal under changed conditions; resolved ending.
  If the budget is smaller, choose the moments with the greatest state change.
- Each image must clarify place, evidence, consequence, or conceptual change.
  It must depict a specific story beat, not a generic educational illustration.
- Use an animated cinematic story-frame aesthetic: expressive composition,
  readable silhouettes, dimensional environments, controlled stylization, and
  a strong sense of action or anticipation. Avoid photorealistic stock imagery,
  flat clip art, childish cartoons, and sterile textbook diagrams.
- Write prompts as production briefs: subject and action, environment, camera
  position and shot scale, lighting/weather/time, physical evidence to emphasize,
  continuity details, and exclusions. Do not request split screens, diagrams,
  floating labels, UI overlays, captions, or infographic layouts.
- Every cover and scene image must be completely text-free. Explicitly require no
  letters, words, numbers, labels, captions, subtitles, signs, logos, watermarks,
  interface text, document text, or readable writing anywhere in the frame. Show
  evidence through objects, color, position, motion, and character reactions instead.
- Make before/after state changes visually distinct through physical conditions
  such as motion, position, deformation, flow, color from natural lighting, or
  changed equipment—not readable numbers or text embedded in the image.
- Show characters performing the exact scene action, reacting to consequences,
  exchanging evidence, and occupying the recurring environment. Images must feel
  like consecutive frames from one animated film, not descriptive establishing
  shots or textbook illustrations. Preserve faces, clothing, props, and spatial
  relationships across every asset.
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
- Every visual story beat must still be represented by its required still image.
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
