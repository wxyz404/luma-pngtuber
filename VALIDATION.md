# Luma validation

## Verified

- TypeScript strict type checking and production renderer/main/preload/worker builds.
- Motion and rig tests: direction and blink hysteresis, audio gating, simultaneous-expression priority, smoothing, calibration offsets, 250 ms loss hold and 300 ms neutral recovery, pose fallback, independent layered features.
- Continuity-lock tests: maintain the selected face when another face is larger, require reacquisition after loss, and retain a continuously detected face during slow inference.
- Storage/server tests: profile round-trip, relocation with relative copied PNGs, path/schema rejection, authenticated endpoints, read-only output, initial state, and WebSocket reconnection. There are **17 passing automated tests** across motion, locking, storage, and output.
- Electron smoke test: studio opens, both rig modes render, PNG imports copy into managed assets, profile changes persist, local overlay draws an avatar with transparent corner pixels, bundled MediaPipe detects a test portrait, and the synthetic webcam pipeline completes neutral calibration. Mocked microphone and camera permission denials show the expected recovery messages. No renderer JavaScript errors were recorded.
- A Windows x64 NSIS installer was generated. The packaged executable also passed the same Electron smoke checks against its ASAR-bundled model, worker, artwork, and renderer. Installation into the user's regular application directory has not been performed by the development session.

The smoke test uses an isolated test profile directory, software rendering, synthetic camera input, and `--no-sandbox` because Chromium subprocesses fail under this development sandbox. The production application retains `sandbox: true`, context isolation, and disabled Node integration. The normal production sandbox launch must still be checked outside this restricted development environment.

## Performance evidence and limits

Cold CPU inference on one bundled-model test portrait took approximately **161–242 ms** across smoke runs in the constrained software-rendering test environment; the final packaged-executable run measured **161 ms**. These are individual inference measurements, not a motion-to-output percentile, steady-state webcam benchmark, or claim that the 150 ms latency target has been met.

Capture targets 640 × 480 at 30 FPS. The application drops stale capture opportunities, allows only one frame in flight, and lowers inference frequency with workload. Rendering runs separately at the display's animation cadence, up to 60 FPS, while output state is published at approximately 30 Hz.

## Hardware acceptance still required

OBS was not found in its standard installation location in this environment. No physical webcam session or real OBS capture was used. Before treating this as a production release, perform:

1. Install and launch the packaged application with its normal sandbox settings on a Windows 11 laptop.
2. Test camera permission denial/recovery, physical unplug/reconnect, a busy camera, and microphone permissions/disconnection.
3. Validate turn direction, expression sensitivity, and neutral calibration under normal and dim lighting, glasses, varied faces, and partial occlusion. Check a second person entering the frame and deliberate reacquisition.
4. Import custom PNG art, align and pivot layered rigs, save, restart, and verify the saved avatar appears in OBS.
5. Run a **30-minute OBS streaming soak** with 1024 × 1024 transparent Browser Source output at 60 FPS; check memory, reconnection, CPU use, animation stability, and absence of raw camera frames.
6. Measure capture-to-visible-output latency across at least 1,000 transitions on the reference laptop. Report median and 95th percentile; compare the latter with the 150 ms target. Tune model input, inference cadence, and smoothing from measured results.

The application does not provide biometric identity verification, reconstructed profile artwork, automatic PNG segmentation, or phoneme lip-sync. Facial signals describe visible movements rather than emotional state.
