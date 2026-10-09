# AI Disclosure

## Inference models

- Suggested demo model: [Qwen2.5-0.5B-Instruct-GGUF, Q4_K_M](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf) (about 491 MB), from [Qwen on Hugging Face](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF). The repository identifies the license as [Apache-2.0](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/blob/main/LICENSE). Download the model directly from Hugging Face and load it with the in-app picker. STRIX does not include model weights.
- The app runs user-selected GGUF models on-device with `llama.rn` (llama.cpp). If a different model is used for a demo or release, disclose its exact file, source, quantization, and license instead.
- Optional cloud mode uses Google's Gemini API only after the user selects cloud mode and supplies a Gemini API key. Local mode does not send prompts to Gemini and has no cloud fallback.

## Libraries and tools

- `llama.rn` provides the React Native llama.cpp binding for local inference.
- Expo / React Native provide the mobile application runtime and native development client.
- OpenAI Codex assisted with implementation and code review.

## Deadline parsing

Deadline quick-add and pasted-list import use the selected local GGUF model. Each parsed deadline is shown for confirmation before it is saved. Google Classroom sync is not implemented; pasted Classroom text is parsed locally.