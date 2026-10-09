import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { useColors } from "../../context/ThemeContext";
import { generateLocalText, getFixedModelPath, loadLocalModel, unloadLocalModel } from "../../services/ai/localProvider";
import { LOCAL_AI_CONFIG } from "../../services/ai/localConfig";
import { useAiRuntime } from "../../services/ai/aiRuntime";

const MODEL_FILE_NAME = LOCAL_AI_CONFIG.modelFileName;
type Phase = "idle" | "picker" | "copying" | "loading" | "generating";

export default function LocalSmokeTestScreen() {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const runtime = useAiRuntime();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progressText, setProgressText] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const busy = phase !== "idle";

  const runCompletion = async () => {
    setPhase("generating");
    setProgressText("Running a short completion...");
    setOutput(await generateLocalText({
      systemInstruction: "Answer in one short sentence.",
      prompt: "Say hello and confirm you are running locally.",
    }));
  };

  const pickAndLoad = async () => {
    setPhase("picker");
    setProgressText("Opening file picker...");
    setOutput("");
    setError("");
    let backup: File | null = null;
    let target: File | null = null;
    let installedNewModel = false;
    let step: "copying" | "loading" | "generating" = "copying";

    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: false, multiple: false });
      if (result.canceled || !result.assets?.length) {
        setError("No file picked. Choose a .gguf model file, or use the fixed-path ADB option.");
        return;
      }
      const asset = result.assets[0];
      if (!asset.name.toLowerCase().endsWith(".gguf")) {
        setError("That file is not a GGUF model. Pick a file ending in .gguf.");
        return;
      }

      const modelDirectory = new Directory(Paths.document, "ai");
      modelDirectory.create({ idempotent: true, intermediates: true });
      target = new File(modelDirectory, MODEL_FILE_NAME);
      const temporary = new File(modelDirectory, `${MODEL_FILE_NAME}.partial`);
      backup = new File(modelDirectory, `${MODEL_FILE_NAME}.previous`);
      const availableBytes = Paths.availableDiskSpace;
      if (asset.size && availableBytes > 0 && availableBytes < asset.size) {
        throw new Error("There may not be enough free storage for this model.");
      }

      setPhase("copying");
      const sizeLabel = asset.size ? ` (${(asset.size / (1024 * 1024)).toFixed(0)} MB)` : "";
      setProgressText(`Copying ${asset.name}${sizeLabel} into app storage...`);
      if (temporary.exists) temporary.delete();
      await new File(asset.uri).copy(temporary);
      await unloadLocalModel();

      // Keep the previous model until the new file has copied successfully.
      if (backup.exists) backup.delete();
      if (target.exists) await target.move(backup);
      try {
        await temporary.move(target);
        installedNewModel = true;
      } catch (moveError) {
        if (backup.exists && !target.exists) await backup.move(target);
        throw moveError;
      }

      step = "loading";
      setPhase("loading");
      setProgressText("Loading model into memory...");
      await loadLocalModel(target.uri);
      if (backup.exists) backup.delete();
      backup = null;
      step = "generating";
      await runCompletion();
    } catch (cause) {
      const details = cause instanceof Error ? cause.message : String(cause);
      if (step === "copying") {
        setError(`Couldn't copy the model into app storage. Your phone may not have enough free storage. Free up space and try again. Details: ${details}`);
      } else if (step === "loading") {
        if (installedNewModel && backup?.exists && target) {
          try {
            await unloadLocalModel();
            if (target.exists) target.delete();
            await backup.move(target);
            backup = null;
          } catch {
            // Keep the readable load error; the model file remains available for recovery.
          }
        }
        setError(`Couldn't load the model. It may be too large for your phone's available memory. Try a smaller quantized GGUF. Details: ${details}`);
      } else {
        setError(`The model loaded, but the test completion failed. Details: ${details}`);
      }
    } finally {
      setPhase("idle");
      setProgressText("");
    }
  };

  const runFromAdbPath = async () => {
    setPhase("loading");
    setOutput("");
    setError("");
    setProgressText("Loading model from the fixed ADB path...");
    try {
      await loadLocalModel(getFixedModelPath());
      await runCompletion();
    } catch (cause) {
      const details = cause instanceof Error ? cause.message : String(cause);
      setError(`Couldn't load the model from the fixed ADB path. It may be too large for your phone's available memory. Details: ${details}`);
    } finally {
      setPhase("idle");
      setProgressText("");
    }
  };

  return <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 22, paddingTop: 54, gap: 14 }}>
    <Pressable disabled={busy} onPress={() => navigation.goBack()}><Text style={{ color: colors.accentText }}>Back</Text></Pressable>
    <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>Local model smoke test</Text>
    <Text style={{ color: colors.textMuted }}>Choose a GGUF model from your phone. It will be copied to:</Text>
    <Text selectable style={{ color: colors.text, backgroundColor: colors.surface, padding: 12, borderRadius: 10 }}>{getPathLabel()}</Text>
    <Pressable disabled={busy} onPress={pickAndLoad} style={[styles.button, { backgroundColor: colors.accentTeal, opacity: busy ? 0.65 : 1 }]}>
      {phase === "copying" || phase === "picker" ? <ActivityIndicator color="#0B0F19" /> : <Text style={styles.buttonText}>Choose GGUF and load</Text>}
    </Pressable>
    <Text style={{ color: colors.textMuted }}>ADB fallback: place the model at the fixed path below and load it directly.</Text>
    <Text selectable style={{ color: colors.text, backgroundColor: colors.surface, padding: 12, borderRadius: 10 }}>{getFixedPathLabel()}</Text>
    <Pressable disabled={busy} onPress={runFromAdbPath} style={[styles.secondaryButton, { borderColor: colors.accentTeal, opacity: busy ? 0.65 : 1 }]}>
      <Text style={[styles.buttonText, { color: colors.accentText }]}>Load from fixed ADB path</Text>
    </Pressable>
    <Text style={{ color: colors.textMuted }}>Status: {runtime.modelStatus}{runtime.tokensPerSecond == null ? "" : ` | ${runtime.tokensPerSecond.toFixed(1)} tokens/sec`}</Text>
    {busy && <Text accessibilityLiveRegion="polite" style={{ color: colors.textMuted }}>{progressText}</Text>}
    {runtime.modelStatus === "loaded" && <Pressable disabled={busy} onPress={() => void unloadLocalModel()}><Text style={{ color: colors.accentText }}>Unload model</Text></Pressable>}
    {!!output && <Text style={{ color: colors.text }}>{output}</Text>}
    {!!error && <Text style={{ color: colors.accentRed }}>{error}</Text>}
  </ScrollView>;
}

function getPathLabel() {
  try { return new File(new Directory(Paths.document, "ai"), MODEL_FILE_NAME).uri; }
  catch { return `App document directory/ai/${MODEL_FILE_NAME}`; }
}
function getFixedPathLabel() {
  try { return getFixedModelPath(); }
  catch { return "Android only: /data/user/0/com.strix.app/files/ai/strix-model.gguf"; }
}
const styles = StyleSheet.create({
  button: { borderRadius: 12, padding: 14, alignItems: "center" },
  secondaryButton: { borderWidth: 1, borderRadius: 12, padding: 14, alignItems: "center" },
  buttonText: { color: "#0B0F19", fontWeight: "800", textAlign: "center" },
});
