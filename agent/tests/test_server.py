from __future__ import annotations

import unittest

from artham_partner.story_pipeline.server import app


class ServerSurfaceTests(unittest.TestCase):
    def test_story_and_thinking_routes_are_exposed(self) -> None:
        paths = app.openapi()["paths"]
        self.assertIn("/health", paths)
        self.assertIn("/story-jobs", paths)
        self.assertIn("/story-jobs/{job_id}", paths)
        self.assertIn("/prelude", paths)
        self.assertIn("/observe", paths)
        self.assertIn("/profile", paths)


if __name__ == "__main__":
    unittest.main()
