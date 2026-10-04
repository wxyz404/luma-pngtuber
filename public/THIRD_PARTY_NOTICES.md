# Bundled assets and dependencies

Sprout sample PNG artwork is original programmatic artwork included with this project; its source is `scripts/assets.mjs`.

MediaPipe Tasks Vision 0.10.32 is distributed under Apache-2.0. The bundled Face Landmarker model is Google's versioned float16 v1 artifact:
https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

Documentation and model information:
https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker

React, React DOM, scheduler, Zod, and ws are MIT-licensed dependencies. Lucide React declares ISC licensing. Electron includes its MIT license and Chromium third-party notices in the Windows distribution. Dependencies retain their upstream license files in the packaged dependency tree.

The runtime uses Windows system fonts and does not fetch web fonts.

The MediaPipe portrait test fixture is used only for development validation, stored outside the application, and is not packaged:
https://storage.googleapis.com/mediapipe-assets/portrait.jpg
