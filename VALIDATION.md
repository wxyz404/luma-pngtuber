# Luma validation

## Verified

- TypeScript strict type checking and production renderer/main/preload/worker builds.
- Motion and rig tests: direction and blink hysteresis, audio gating, simultaneous-expression priority, smoothing, calibration offsets, 250 ms loss hold and 300 ms neutral recovery, pose fallback, independent layered features.
- Continuity-lock tests: maintain the selected face when another face is larger, require reacquisition after loss, and retain a continuously detected face during slow inference.
- Storage/server tests: profile round-trip, relocation with relative copied PNGs, path/schema rejection, authenticated endpoints, read-only output, initial state, and WebSocket reconnection. There are **34 passing automated tests** across motion, locking, storage, and output.
- Camera monitor tests: normalized skeleton coordinates, invalid landmark handling, stale/lost skeleton clearing, and rejection of webcam/diagnostic fields from OBS packets.
- Electron smoke test: studio opens, both rig modes render, PNG imports copy into managed assets, profile changes persist, local overlay draws an avatar with transparent corner pixels, bundled MediaPipe detects a test portrait, and the synthetic webcam pipeline completes neutral calibration. Mocked microphone and camera permission denials show the expected recovery messages. No renderer JavaScript errors were recorded.
- A Windows x64 NSIS installer was generated. The packaged executable also passed the same Electron smoke checks against its ASAR-bundled model, worker, artwork, and renderer. Installation into the user's regular application directory has not been performed by the development session.

The smoke test uses an isolated test profile directory, software rendering, synthetic camera input, and `--no-sandbox` because Chromium subprocesses fail under this development sandbox. The production application retains `sandbox: true`, context isolation, and disabled Node integration. The normal production sandbox launch must still be checked outside this restricted development environment.

## v0.2.0 camera monitor checks (2026-10-05)

All 21 automated tests, strict TypeScript checking, production builds, and the expanded Electron smoke suite passed. The updated packaged executable passed the same suite with zero renderer JavaScript errors. Synthetic camera checks cover real video element playback, feed visibility without stopping inference, independent skeleton/mirror/size controls, local diagnostics, face-loss clearing/recovery, and calibration. The OBS page contains no video element or camera monitor. A PNG import timing race discovered during visual review was fixed; the imported simple pose renders without an artwork alert.

The v0.2.0 NSIS installer uses the previously packaged Windows Electron runtime with a freshly bundled application ASAR. The camera monitor is checked using a public MediaPipe portrait fixture rather than physical webcam footage. Display toggles start off each session (preview mirroring defaults on). Live hardware acceptance requirements below remain outstanding.

## v0.2.1 centered layer scaling (2026-10-05)

The Scale slider now preserves the geometric center of each PNG layer by compensating its saved top-left coordinates. Existing profile placement and normalized pivot settings remain compatible. The available scale range accounts for the existing coordinate bounds, rather than shifting the center or saving an invalid profile.

All 26 automated tests and strict TypeScript/production builds passed. New regression tests cover non-square artwork, growing/shrinking, repeated scrubbing, custom pivots, unaffected sibling layers, large PNGs, coordinate limits, and profile serialization. The packaged v0.2.1 executable passed the focused scaling smoke test: the real slider preserves the center, the profile retains its scale and center across an application restart, studio/OBS pixels match at equal canvas dimensions, and output transparency is retained. No renderer JavaScript errors were recorded. The Windows installer was regenerated from the same checked application archive.

## v0.3.0 facing states (2026-10-06)

Both rig modes expose Center, Left, and Right artwork banks and a saved Directional sprite states switch. With the switch off, facial animation continues using centered artwork. PNG poses support each facing's expressions and combined talking/blinking poses; layered rigs support each facing's resting art and independent eye, mouth, and brow variants. Missing side variants prefer that side's resting art before centered fallbacks. Existing profile alignment and legacy head-direction assignments remain compatible.

All 34 automated tests, strict TypeScript checking, and production builds passed. New tests cover the centered-only switch, yaw hysteresis, side-specific feature combinations, simultaneous expressions, fallbacks, and legacy profile loading. Source and packaged Electron checks exercise native PNG assignment, synthetic yaw switching in the studio and local OBS renderer, combined smile/talk/blink poses, layered side art and blinks, studio-only artwork previews, and save/restart persistence. No renderer JavaScript errors were recorded. These checks use synthetic signals rather than a new physical webcam trial.

The v0.3.0 NSIS installer uses the previously packaged Windows Electron runtime with a freshly bundled application ASAR. Hardware and normal production sandbox acceptance requirements below remain outstanding.

## Performance evidence and limits

Cold CPU inference on one bundled-model test portrait took approximately **161–242 ms** across smoke runs in the constrained software-rendering test environment; the final packaged-executable run measured **161 ms**. These are individual inference measurements, not a motion-to-output percentile, steady-state webcam benchmark, or claim that the 150 ms latency target has been met.

For v0.2.0, individual cold portrait probes measured 109–276 ms during source checks and **214 ms** in the final packaged smoke check. These remain fixture measurements, not motion-to-output latency or a 95th percentile.

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
