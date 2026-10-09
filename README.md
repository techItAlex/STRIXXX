# STRIX
## Your learning workspace, powered by Local AI

STRIX is an on-device-first study companion for students and independent learners. It keeps a flexible knowledge tree, deadlines, and study sessions on the phone. With a compatible GGUF model installed, it can also provide learning assistance without an internet connection.

## Problem and usefulness

Students often keep class notes, due dates, and study plans in separate places. Cloud AI can help explain or organize information, but stops working when a learner is offline, has no key, or does not want notes sent to a remote service.

STRIX combines personal learning notes, a calendar, and a focus timer in one local workspace. Notes, tree navigation, deadlines, and timer functions do not require an account or STRIX server. Generative AI works offline after a GGUF model is selected and loaded; without a model, the workspace remains useful but generative local AI cannot run.

## Local AI implementation

The app defaults to **On-device** mode. `src/services/ai/localProvider.ts` lazily imports `llama.rn` and initializes the user's GGUF through llama.cpp on the device. Local generation supports discussing saved notes, judging a learner's explanation, suggesting note placement, and parsing deadline text. Deadline parsing calls the local provider directly.

For note discussion, STRIX ranks saved notes by local keyword overlap and adds up to four matches to the prompt. It uses no embedding service or hosted retrieval database. The suggested demo model is Qwen2.5-0.5B-Instruct, Q4_K_M (about 491 MB): [download this exact GGUF file](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf) from [Qwen on Hugging Face](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF). The repository lists the model under Apache-2.0; see its [license](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/blob/main/LICENSE). Download it to your phone, then use the in-app picker. The app does not bundle the weights.

### Optional cloud mode

Users may select **Cloud (Gemini)** and provide their own Google Gemini API key. Only then does the Gemini provider make network requests to Google's Generative Language API for model discovery and generation. Local mode does not use Gemini. Cloud mode requires internet and is secondary; it is not an offline fallback.

## Technical execution

- Expo and React Native with TypeScript.
- llama.cpp local inference through the open-source `llama.rn` React Native binding.
- AsyncStorage for non-secret app state; Expo SecureStore for the optional Gemini key.
- Local keyword matching for note retrieval; no backend or embeddings.
- Suggested demo model: Qwen2.5-0.5B-Instruct-GGUF, Q4_K_M (~491 MB), Apache-2.0; see the exact [Hugging Face file](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf). Its weights are not bundled.
- Expo Document Picker and File System for choosing and copying a model into app-private storage.

The calendar supports manual deadlines and local AI parsing of typed or pasted text. Classroom sync is not implemented. Notification permissions are configured, but scheduled reminders are not connected to saved deadlines.

## Build and run the live demo

Requirements: Node.js/npm, an Android phone for the current local-model demo, a development or preview EAS build containing the native modules (including llama.rn), and a compatible GGUF model downloaded separately.

From the project root:

```sh
npm install
npx eas-cli build --profile development --platform android
```

Install the build from its EAS link. To run the development client against Metro:

```sh
npx expo start --dev-client
```

On the phone, go to AI tab > Local model smoke test (development), choose a .gguf, wait for copying and loading, then run the completion. A smaller quantized model is a practical phone demo starting point.

For an offline presentation that can relaunch without Metro, build an internal preview app with its JavaScript bundle included:

```sh
npx eas-cli build --profile preview --platform android
```

Install and launch that app, load the model, then enable airplane mode. Demonstrate note/tree, timer, calendar, and local AI behavior. Have the app bundle and model on the phone before disconnecting. Gemini mode will not work offline.

ADB fallback for Android package `com.strix.app`:

```sh
adb push ./strix-model.gguf /data/local/tmp/strix-model.gguf
adb shell run-as com.strix.app mkdir -p files/ai
adb shell run-as com.strix.app cp /data/local/tmp/strix-model.gguf files/ai/strix-model.gguf
```

Then choose **Load from fixed ADB path** on the smoke-test screen.

### Suggested judging walkthrough

1. Show the knowledge tree and local notes.
2. Enable airplane mode.
3. Run a short completion using the prepared local model.
4. Discuss a saved note or parse a deadline locally.
5. Add a deadline, show the calendar, and run a focus session.
6. Explain that Gemini is a separate, optional network-dependent mode.

## Required disclosures


**Model:** The suggested demo file is [Qwen2.5-0.5B-Instruct Q4_K_M (~491 MB)](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf), from [Qwen/Qwen2.5-0.5B-Instruct-GGUF](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF), licensed under [Apache-2.0](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/blob/main/LICENSE). STRIX does not bundle the model weights; download the file directly and select it in the app. A different model can be selected, in which case its license and source must be disclosed instead.

**Open-source frameworks and libraries:** Expo, React Native, llama.cpp via `llama.rn`, React Navigation, AsyncStorage, Expo SecureStore, Expo Document Picker, Expo File System, Expo Notifications, Expo Linear Gradient, NetInfo, and Expo vector icons.

**External API:** Google Gemini Generative Language API is the optional cloud provider. It receives prompts only when Cloud mode is selected and a user-provided key is configured.

**AI-assisted development:** OpenAI Codex assisted with implementation and code review. The submitting team is responsible for checking the final app.

See [AI_DISCLOSURE.md](AI_DISCLOSURE.md). If the demo uses a different model, update both documents with that file, source, quantization, and license.

## Checks

```sh
npx tsc --noEmit
npx expo-doctor
```

Run from the project root after app or Expo configuration changes.
