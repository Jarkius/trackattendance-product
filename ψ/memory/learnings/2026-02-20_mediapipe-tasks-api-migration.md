# MediaPipe 0.10.x Uses Tasks API, Not Solutions

**Date**: 2026-02-20
**Context**: Camera POC proximity detection upgrade
**Confidence**: High

## Key Learning

MediaPipe version 0.10.x and later has deprecated the `mp.solutions` API in favor of the new `mp.tasks` API. Code written for older MediaPipe tutorials using patterns like `mp.solutions.face_detection.FaceDetection()` will fail with `module 'mediapipe' has no attribute 'solutions'`.

The new tasks API is more explicit but requires:
1. Model files (`.tflite` or `.task`) downloaded separately
2. `BaseOptions` for model path configuration
3. Task-specific options classes (e.g., `FaceDetectorOptions`)
4. Factory methods like `FaceDetector.create_from_options()`

## The Pattern

**Old (mp.solutions — deprecated):**
```python
import mediapipe as mp
face_det = mp.solutions.face_detection.FaceDetection(
    model_selection=0,
    min_detection_confidence=0.5
)
results = face_det.process(rgb_image)
```

**New (mp.tasks — current):**
```python
import mediapipe as mp

base_opts = mp.tasks.BaseOptions(model_asset_path='blaze_face_short_range.tflite')
face_opts = mp.tasks.vision.FaceDetectorOptions(
    base_options=base_opts,
    running_mode=mp.tasks.vision.RunningMode.IMAGE,
    min_detection_confidence=0.5
)
face_det = mp.tasks.vision.FaceDetector.create_from_options(face_opts)

mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_array)
results = face_det.detect(mp_image)
```

**Detection check also changes:**
```python
# Old: results.detections
# New: results.detections (same, but input is mp.Image not numpy)
```

## Why This Matters

- Many online tutorials and Stack Overflow answers still show the old `mp.solutions` pattern
- Version checking is essential: `pip show mediapipe` or `mediapipe.__version__`
- Model files must be downloaded from Google's model hub and bundled with your app
- The tasks API is more explicit about resource management (requires `.close()`)

## Quick Check

Before writing MediaPipe code, verify the API:
```python
import mediapipe as mp
print(dir(mp))  # Look for 'tasks' vs 'solutions'
```

## Model Downloads

- Face detection: https://storage.googleapis.com/mediapipe-models/face_detector/
- Pose landmarker: https://storage.googleapis.com/mediapipe-models/pose_landmarker/

## Tags

`mediapipe`, `api-migration`, `face-detection`, `pose-detection`, `python`, `computer-vision`
