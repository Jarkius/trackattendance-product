---
title: # MediaPipe 0.10.x Uses Tasks API, Not Solutions
tags: [mediapipe, api-migration, face-detection, pose-detection, python, computer-vision, tasks-api]
created: 2026-02-20
source: rrr: Jarkius/trackattendance-frontend
---

# # MediaPipe 0.10.x Uses Tasks API, Not Solutions

# MediaPipe 0.10.x Uses Tasks API, Not Solutions

MediaPipe version 0.10.x and later has deprecated the `mp.solutions` API in favor of the new `mp.tasks` API. Code written for older MediaPipe tutorials using patterns like `mp.solutions.face_detection.FaceDetection()` will fail with `module 'mediapipe' has no attribute 'solutions'`.

The new tasks API requires:
1. Model files (`.tflite` or `.task`) downloaded separately
2. `BaseOptions` for model path configuration
3. Task-specific options classes (e.g., `FaceDetectorOptions`)
4. Factory methods like `FaceDetector.create_from_options()`

**Old (deprecated):** `mp.solutions.face_detection.FaceDetection()`
**New (current):** `mp.tasks.vision.FaceDetector.create_from_options(opts)`

Quick check before writing code: `print(dir(mp))` — look for 'tasks' vs 'solutions'.

---
*Added via Oracle Learn*
