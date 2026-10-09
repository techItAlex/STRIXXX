import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNodes } from "../context/NodeContext";
import { StudyMode, StudySession, useStudy } from "../context/StudyContext";
import { useApiKey } from "../context/ApiKeyContext";
import { analyzeStudySession, recommendStudyPlan } from "../services/ai/studyAiService";
import { useColors } from "../context/ThemeContext";
import { useStyles } from "../theme/useStyles";
import type { Colors } from "../theme/colors";
import { AiCompanion, BrandIcon, BrandLogo } from "../branding/Brand";

type Phase = "plan" | "running" | "summary";
type Recommendation = { minutes: number; reason: string; source: "ai" | "starter" };

const makeId = () => `study_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const formatClock = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, "0")}:${(Math.max(0, seconds) % 60).toString().padStart(2, "0")}`;
const formatMinutes = (seconds: number) => seconds >= 3600 ? `${Math.floor(seconds / 3600)}h ${Math.round(seconds % 3600 / 60)}m` : `${Math.max(0, Math.round(seconds / 60))}m`;

export default function TimerScreen() {
  const { nodes, getPath, getNode, loading: nodesLoading } = useNodes();
  const { sessions, saveSession, updateSession, sessionsForTopic } = useStudy();
  const { apiKey } = useApiKey();
  const [phase, setPhase] = useState<Phase>("plan");
  const [mode, setMode] = useState<StudyMode>("focus");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [customMinutes, setCustomMinutes] = useState("25");
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausedSeconds, setPausedSeconds] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [recommending, setRecommending] = useState(false);
  const [finalSession, setFinalSession] = useState<StudySession | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const finalized = useRef(false);
  const colors = useColors();
  const styles = useStyles(makeStyles);

  const topic = topicId ? getNode(topicId) : undefined;
  const topicPath = topic ? getPath(topic.id).map((node) => node.title).join(" → ") : "Choose a topic from your Knowledge Tree";
  const plannedSeconds = (mode === "focus" ? focusMinutes : mode === "shortBreak" ? shortBreakMinutes : longBreakMinutes) * 60;
  const progress = plannedSeconds ? Math.min(1, (plannedSeconds - remaining) / plannedSeconds) : 0;
  const topicSessions = topicId ? sessionsForTopic(topicId) : [];

  useEffect(() => {
    if (!topicId && nodes.length && !nodesLoading) setTopicId(nodes[nodes.length - 1].id);
  }, [nodes, nodesLoading, topicId]);

  useEffect(() => {
    if (phase !== "running" || !running || remaining <= 0) return;
    const timer = setTimeout(() => {
      if (remaining <= 1) {
        setRemaining(0);
        finishSession(true);
      } else setRemaining((value) => value - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, running, remaining]);

  const start = () => {
    if (mode === "focus" && !topic) {
      Alert.alert("Choose a topic", "Pick a Knowledge Tree topic before starting a focus session.");
      return;
    }
    finalized.current = false;
    setStartedAt(Date.now());
    setPausedSeconds(0);
    setPauseCount(0);
    setPausedAt(null);
    setRemaining(plannedSeconds);
    setRunning(true);
    setPhase("running");
  };

  const pauseOrResume = () => {
    if (running) {
      setRunning(false);
      setPausedAt(Date.now());
      setPauseCount((value) => value + 1);
    } else {
      if (pausedAt) setPausedSeconds((value) => value + Math.round((Date.now() - pausedAt) / 1000));
      setPausedAt(null);
      setRunning(true);
    }
  };

  const finishSession = (completed: boolean) => {
    if (finalized.current) return;
    finalized.current = true;
    setRunning(false);
    const endedAt = Date.now();
    const currentPaused = pausedSeconds + (pausedAt ? Math.round((endedAt - pausedAt) / 1000) : 0);
    setPausedSeconds(currentPaused);
    if (mode !== "focus") {
      if (topic && startedAt) {
        saveSession({
          id: makeId(), topicId: topic.id, plannedSeconds, focusedSeconds: 0,
          pausedSeconds: currentPaused, breakSeconds: plannedSeconds - remaining,
          pauseCount, startedAt, endedAt, completed,
        });
      }
      setPhase("plan");
      setPausedAt(null);
      setRemaining(mode === "shortBreak" ? shortBreakMinutes * 60 : longBreakMinutes * 60);
      return;
    }
    if (!topic || !startedAt) return;
    const session: StudySession = {
      id: makeId(), topicId: topic.id, plannedSeconds, focusedSeconds: plannedSeconds - remaining,
      pausedSeconds: currentPaused, breakSeconds: 0, pauseCount, startedAt, endedAt, completed,
    };
    saveSession(session);
    setFinalSession(session);
    setPhase("summary");
    setPausedAt(null);
    setAnalyzing(true);
    analyzeStudySession({ apiKey, topic, session, priorSessions: topicSessions })
      .then((text) => { setAnalysis(text); updateSession(session.id, { analysis: text }); })
      .catch((error) => setAnalysis(error instanceof Error ? error.message : "The AI session summary could not be generated."))
      .finally(() => setAnalyzing(false));
  };

  const reset = () => {
    setRunning(false); setPausedAt(null); setPausedSeconds(0); setPauseCount(0);
    setRemaining(plannedSeconds); setStartedAt(null); finalized.current = false;
  };

  const getRecommendation = async () => {
    if (!topic) return setTopicPickerOpen(true);
    setRecommending(true);
    try {
      const plan = await recommendStudyPlan({ apiKey, topic, history: topicSessions });
      setRecommendation(plan);
    } catch (error) {
      Alert.alert("Study suggestion unavailable", error instanceof Error ? error.message : "Try again after checking your on-device model.");
    } finally { setRecommending(false); }
  };

  const applyCustomDuration = () => {
    const value = Math.max(1, Math.min(180, Number(customMinutes) || 25));
    setFocusMinutes(value); setCustomMinutes(String(value)); setRecommendation(null); setRemaining(value * 60);
  };

  const dailySeconds = sessions.filter((session) => new Date(session.startedAt).toDateString() === new Date().toDateString()).reduce((sum, session) => sum + session.focusedSeconds, 0);
  const weekSeconds = sessions.filter((session) => Date.now() - session.startedAt < 7 * 86400000).reduce((sum, session) => sum + session.focusedSeconds, 0);

  if (phase === "running") return <RunningTimer mode={mode} topicPath={topicPath} remaining={remaining} progress={progress} running={running} onPause={pauseOrResume} onStop={() => finishSession(false)} onReset={reset} onSkip={() => { setMode("focus"); reset(); setPhase("plan"); }} />;
  if (phase === "summary" && finalSession) return <SessionSummary session={finalSession} topicPath={topicPath} analysis={analysis} analyzing={analyzing} onContinue={() => { setPhase("plan"); setAnalysis(null); setFinalSession(null); setRemaining(focusMinutes * 60); }} onBreak={() => { setMode("shortBreak"); setRemaining(shortBreakMinutes * 60); setPhase("plan"); }} />;

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><View><Text style={styles.headerTitle}><BrandIcon name="timer" size={23} active /> Timer</Text><Text style={styles.headerSub}>Focus today. Grow tomorrow.</Text></View><Pressable onPress={() => setSettingsOpen(true)} style={styles.roundButton}><BrandIcon name="settings" size={20} /></Pressable></View>
      <Pressable style={styles.plannerCard} onPress={getRecommendation}><AiCompanion state={recommending ? "loading" : "thinking"} size={48} /><View style={{ flex: 1 }}><Text style={styles.plannerTitle}>{recommending ? "Planning your session…" : "AI Study Planner"}</Text><Text style={styles.plannerText}>Choose a topic and get a time suggestion based on your recorded study behavior.</Text></View><Ionicons name="chevron-forward" size={18} color={colors.linkBlue} /></Pressable>
      <TimerDial remaining={plannedSeconds} progress={0} label={mode === "focus" ? "Focus" : "Break"} />
      <View style={styles.modeRow}><ModeButton active={mode === "focus"} icon="timer-outline" label="Focus" detail={`${focusMinutes} min`} onPress={() => { setMode("focus"); setRemaining(focusMinutes * 60); }} /><ModeButton active={mode === "shortBreak"} icon="cafe-outline" label="Short Break" detail={`${shortBreakMinutes} min`} onPress={() => { setMode("shortBreak"); setRemaining(shortBreakMinutes * 60); }} /><ModeButton active={mode === "longBreak"} icon="moon-outline" label="Long Break" detail={`${longBreakMinutes} min`} onPress={() => { setMode("longBreak"); setRemaining(longBreakMinutes * 60); }} /></View>
      {mode === "focus" && <Pressable style={styles.topicCard} onPress={() => setTopicPickerOpen(true)}><View style={styles.topicIcon}><Ionicons name="book-outline" size={21} color={colors.accentTeal} /></View><View style={{ flex: 1 }}><Text style={styles.label}>Study topic</Text><Text style={styles.topicPath} numberOfLines={2}>{topicPath}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.linkBlue} /></Pressable>}
      {mode === "focus" && <View style={styles.durationCard}><Text style={styles.cardHeading}>Study duration</Text><View style={styles.presetRow}>{[25, 45, 60].map((minutes) => <Pressable key={minutes} onPress={() => { setFocusMinutes(minutes); setCustomMinutes(String(minutes)); setRecommendation(null); }} style={[styles.preset, focusMinutes === minutes && styles.presetActive]}><Text style={[styles.presetText, focusMinutes === minutes && styles.presetActiveText]}>{minutes} min</Text></Pressable>)}</View><View style={styles.customRow}><TextInput value={customMinutes} onChangeText={setCustomMinutes} keyboardType="number-pad" style={styles.input} placeholderTextColor={colors.textFaint} /><Text style={styles.minutesLabel}>minutes</Text><Pressable onPress={applyCustomDuration} style={styles.applyButton}><Text style={styles.applyText}>Apply</Text></Pressable></View></View>}
      {recommendation && <View style={styles.recommendation}><View style={styles.recommendationTop}><Ionicons name="sparkles" size={18} color={colors.accentText} /><Text style={styles.recommendTitle}>{recommendation.source === "ai" ? "AI recommendation" : "Starter suggestion"}</Text></View><Text style={styles.recommendMinutes}>{recommendation.minutes} minutes</Text><Text style={styles.recommendReason}>{recommendation.reason}</Text><Pressable onPress={() => { setFocusMinutes(recommendation.minutes); setCustomMinutes(String(recommendation.minutes)); setRecommendation(null); }} style={styles.acceptButton}><Text style={styles.acceptText}>Use this time</Text></Pressable></View>}
      <Stats sessions={sessions} dailySeconds={dailySeconds} weekSeconds={weekSeconds} topicSessions={topicSessions} topicTitle={topic?.title} />
      <Pressable onPress={start} style={styles.startButton}><LinearGradient colors={["#35E6C0", "#00BCA9"]} style={styles.startGradient}><Ionicons name="play" size={18} color="#001926" /><Text style={styles.startText}>Start {mode === "focus" ? "Focus Session" : "Break"}</Text></LinearGradient></Pressable>
    </ScrollView>
    <TopicPicker open={topicPickerOpen} nodes={nodes} getPath={getPath} selectedId={topicId} onChoose={(id) => { setTopicId(id); setTopicPickerOpen(false); setRecommendation(null); }} onClose={() => setTopicPickerOpen(false)} />
    <Settings open={settingsOpen} focus={focusMinutes} shortBreak={shortBreakMinutes} longBreak={longBreakMinutes} onSave={(focus, short, long) => { setFocusMinutes(focus); setShortBreakMinutes(short); setLongBreakMinutes(long); setSettingsOpen(false); setRemaining(focus * 60); }} onClose={() => setSettingsOpen(false)} />
  </View>;
}

function TimerDial({ remaining, progress, label }: { remaining: number; progress: number; label: string }) { const styles = useStyles(makeStyles); return <View style={styles.dialWrap}><LinearGradient colors={["#118ED7", "#31E7C3", "#796BFF"]} style={styles.dialRing}><View style={styles.dialInner}><Text style={styles.dialLabel}>{label}</Text><Text style={styles.dialTime}>{formatClock(remaining)}</Text><Text style={styles.dialHint}>{progress ? `${Math.round(progress * 100)}% complete` : "Ready when you are"}</Text></View></LinearGradient></View>; }
function ModeButton({ active, icon, label, detail, onPress }: any) { const colors = useColors(); const styles = useStyles(makeStyles); return <Pressable onPress={onPress} style={[styles.modeButton, active && styles.modeActive]}><Ionicons name={icon} size={16} color={active ? colors.accentText : colors.subtleText} /><Text style={[styles.modeLabel, active && { color: colors.accentText }]}>{label}</Text><Text style={styles.modeDetail}>{detail}</Text></Pressable>; }
function RunningTimer({ mode, topicPath, remaining, progress, running, onPause, onStop, onReset, onSkip }: any) { const colors = useColors(); const styles = useStyles(makeStyles); return <View style={styles.screen}><View style={styles.runningHeader}><Text style={styles.runningTitle}>{mode === "focus" ? "Study Session" : mode === "shortBreak" ? "Short Break" : "Long Break"}</Text><Text style={styles.runningTopic} numberOfLines={2}>{topicPath}</Text></View><TimerDial remaining={remaining} progress={progress} label={mode === "focus" ? "Focus" : "Break"} /><View style={styles.progressBlock}><View style={styles.progressLabels}><Text style={styles.label}>Session progress</Text><Text style={styles.label}>{Math.round(progress * 100)}%</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} /></View></View><View style={styles.controls}><Pressable onPress={onReset} style={styles.control}><Ionicons name="refresh" size={23} color={colors.linkBlue} /><Text style={styles.controlText}>Reset</Text></Pressable><Pressable onPress={onPause} style={styles.pauseButton}><Ionicons name={running ? "pause" : "play"} size={28} color={colors.onAccent} /><Text style={styles.pauseText}>{running ? "Pause" : "Resume"}</Text></Pressable><Pressable onPress={mode === "focus" ? onStop : onSkip} style={styles.control}><Ionicons name={mode === "focus" ? "stop" : "play-skip-forward"} size={23} color={colors.linkBlue} /><Text style={styles.controlText}>{mode === "focus" ? "End" : "Skip"}</Text></Pressable></View>{mode !== "focus" && <Text style={styles.breakNote}>Take a moment to reset. You can skip this break whenever you’re ready.</Text>}</View>; }
function SessionSummary({ session, topicPath, analysis, analyzing, onContinue, onBreak }: any) { const colors = useColors(); const styles = useStyles(makeStyles); return <View style={styles.screen}><ScrollView contentContainerStyle={styles.summaryContent}><Ionicons name="leaf" size={60} color={colors.accentText} style={{ alignSelf: "center" }} /><Text style={styles.summaryTitle}>{session.completed ? "Study Session Complete" : "Session Ended"}</Text><Text style={styles.summarySub}>You focused for {formatMinutes(session.focusedSeconds)} on</Text><Text style={styles.summaryTopic}>{topicPath}</Text><View style={styles.summaryCard}><Metric icon="timer-outline" label="Focused study" value={formatMinutes(session.focusedSeconds)} /><Metric icon="pause-outline" label="Paused" value={`${session.pauseCount} times • ${formatMinutes(session.pausedSeconds)}`} /><Metric icon="flag-outline" label="Planned time" value={formatMinutes(session.plannedSeconds)} /></View><View style={styles.analysisCard}><Text style={styles.analysisTitle}><Ionicons name="sparkles" size={18} color={colors.accentText} /> AI Analysis</Text><Text style={styles.analysisText}>{analyzing ? "Reviewing the recorded session behavior…" : analysis}</Text><Text style={styles.analysisNote}>Time tracked here describes study behavior; it does not by itself measure learning or understanding.</Text></View><Pressable onPress={onBreak} style={styles.startButton}><LinearGradient colors={["#35E6C0", "#00BCA9"]} style={styles.startGradient}><Text style={styles.startText}>Take a Short Break</Text></LinearGradient></Pressable><Pressable onPress={onContinue}><Text style={styles.secondaryAction}>Back to Timer</Text></Pressable></ScrollView></View>; }
function Metric({ icon, label, value }: any) { const colors = useColors(); const styles = useStyles(makeStyles); return <View style={styles.metric}><View style={styles.metricIcon}><Ionicons name={icon} size={18} color={colors.accentTeal} /></View><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>; }
function Stats({ sessions, dailySeconds, weekSeconds, topicSessions, topicTitle }: any) { const colors = useColors(); const styles = useStyles(makeStyles); const focusSessions = sessions.filter((item: StudySession) => item.focusedSeconds > 0); const topicTotal = topicSessions.reduce((sum: number, item: StudySession) => sum + item.focusedSeconds, 0); const topicBreakTotal = topicSessions.reduce((sum: number, item: StudySession) => sum + item.breakSeconds, 0); const topicFocusCount = topicSessions.filter((item: StudySession) => item.focusedSeconds > 0).length; return <View style={styles.statsSection}><Text style={styles.cardHeading}>Study insights</Text><View style={styles.statRow}><Stat label="Today" value={formatMinutes(dailySeconds)} /><Stat label="This week" value={formatMinutes(weekSeconds)} /><Stat label="Sessions" value={String(focusSessions.length)} /></View>{topicTitle && <View style={styles.historyCard}><Text style={styles.historyTitle}>{topicTitle} history</Text><Text style={styles.historyText}>{topicFocusCount} focus sessions • {formatMinutes(topicTotal)} focused • {formatMinutes(topicBreakTotal)} breaks • {topicSessions[0] ? `last studied ${new Date(topicSessions[0].startedAt).toDateString() === new Date().toDateString() ? "today" : new Date(topicSessions[0].startedAt).toLocaleDateString()}` : "not studied yet"}</Text></View>}{focusSessions.slice(0, 3).map((session: StudySession) => <View key={session.id} style={styles.recentRow}><Ionicons name="timer-outline" size={16} color={colors.linkBlue} /><Text style={styles.recentText}>{formatMinutes(session.focusedSeconds)} focus</Text><Text style={styles.recentMeta}>{new Date(session.startedAt).toLocaleDateString()}</Text></View>)}</View>; }
function Stat({ label, value }: any) { const styles = useStyles(makeStyles); return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function TopicPicker({ open, nodes, getPath, selectedId, onChoose, onClose }: any) { const colors = useColors(); const styles = useStyles(makeStyles); return <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}><View style={styles.modalShade}><View style={styles.sheet}><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Choose a topic</Text><Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.text} /></Pressable></View><Text style={styles.sheetSub}>Every session is saved to the topic you choose.</Text><ScrollView>{nodes.map((node: any) => <Pressable key={node.id} onPress={() => onChoose(node.id)} style={[styles.topicOption, node.id === selectedId && styles.topicOptionActive]}><Ionicons name={node.level === "field" ? "folder-outline" : "document-text-outline"} size={18} color={node.id === selectedId ? colors.accentTeal : colors.linkBlue} /><View style={{ flex: 1 }}><Text style={styles.optionTitle}>{node.title}</Text><Text style={styles.optionPath} numberOfLines={1}>{getPath(node.id).map((item: any) => item.title).join(" → ")}</Text></View>{node.id === selectedId && <Ionicons name="checkmark-circle" size={20} color={colors.accentTeal} />}</Pressable>)}</ScrollView></View></View></Modal>; }
function Settings({ open, focus, shortBreak, longBreak, onSave, onClose }: any) { const [f, setF] = useState(String(focus)); const [s, setS] = useState(String(shortBreak)); const [l, setL] = useState(String(longBreak)); useEffect(() => { if (open) { setF(String(focus)); setS(String(shortBreak)); setL(String(longBreak)); } }, [open, focus, shortBreak, longBreak]); const colors = useColors(); const styles = useStyles(makeStyles); const input = (label: string, value: string, set: any, icon: any) => <View style={styles.settingRow}><Ionicons name={icon} size={19} color={colors.accentTeal} /><Text style={styles.settingLabel}>{label}</Text><TextInput value={value} onChangeText={set} keyboardType="number-pad" style={styles.settingInput} /><Text style={styles.label}>min</Text></View>; return <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}><View style={styles.modalShade}><View style={styles.sheet}><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Customize Timer</Text><Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.text} /></Pressable></View>{input("Focus time", f, setF, "timer-outline")}{input("Short break", s, setS, "cafe-outline")}{input("Long break", l, setL, "moon-outline")}<Text style={styles.settingsHint}>AI suggestions use your selected topic and recorded study behavior. They do not treat time as evidence of learning.</Text><Pressable onPress={() => onSave(Math.max(1, Number(f) || 25), Math.max(1, Number(s) || 5), Math.max(1, Number(l) || 15))} style={styles.startButton}><LinearGradient colors={["#35E6C0", "#00BCA9"]} style={styles.startGradient}><Text style={styles.startText}>Save Settings</Text></LinearGradient></Pressable></View></View></Modal>; }

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingTop: 45, paddingBottom: 110, gap: 15 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, headerTitle: { color: colors.text, fontSize: 25, fontWeight: "800" }, headerSub: { color: colors.subtleText, fontSize: 12, marginTop: 3 }, roundButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" }, plannerCard: { minHeight: 70, borderRadius: 16, padding: 12, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong, flexDirection: "row", alignItems: "center", gap: 11 }, plannerIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" }, plannerTitle: { color: colors.text, fontWeight: "700", fontSize: 14 }, plannerText: { color: colors.subtleText, fontSize: 11, lineHeight: 15, marginTop: 3 }, dialWrap: { alignItems: "center", paddingVertical: 7 }, dialRing: { width: 210, height: 210, borderRadius: 105, padding: 10, justifyContent: "center", alignItems: "center" }, dialInner: { width: 190, height: 190, borderRadius: 95, backgroundColor: colors.input, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderStrong }, dialLabel: { color: colors.accentText, fontSize: 14, fontWeight: "700" }, dialTime: { color: colors.text, fontSize: 39, fontWeight: "700", fontVariant: ["tabular-nums"], marginTop: 5 }, dialHint: { color: colors.subtleText, fontSize: 12, marginTop: 4 }, modeRow: { flexDirection: "row", gap: 8 }, modeButton: { flex: 1, minHeight: 65, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.chip, alignItems: "center", justifyContent: "center", padding: 6 }, modeActive: { borderColor: colors.accentTeal, backgroundColor: colors.chipActive }, modeLabel: { color: colors.text, fontSize: 10, fontWeight: "700", marginTop: 4, textAlign: "center" }, modeDetail: { color: colors.subtleText, fontSize: 10, marginTop: 2 }, topicCard: { borderRadius: 16, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong, padding: 13, flexDirection: "row", alignItems: "center", gap: 11 }, topicIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.iconWell, alignItems: "center", justifyContent: "center" }, label: { color: colors.subtleText, fontSize: 11 }, topicPath: { color: colors.text, fontSize: 13, fontWeight: "600", marginTop: 3 }, durationCard: { borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 14 }, cardHeading: { color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: 11 }, presetRow: { flexDirection: "row", gap: 8 }, preset: { flex: 1, alignItems: "center", borderRadius: 10, backgroundColor: colors.chip, paddingVertical: 9, borderWidth: 1, borderColor: colors.border }, presetActive: { backgroundColor: colors.chipActive, borderColor: colors.accentTeal }, presetText: { color: colors.subtleText, fontSize: 12, fontWeight: "600" }, presetActiveText: { color: colors.accentText }, customRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 11 }, input: { width: 58, color: colors.text, paddingVertical: 7, paddingHorizontal: 9, backgroundColor: colors.input, borderRadius: 9, borderWidth: 1, borderColor: colors.borderStrong, textAlign: "center" }, minutesLabel: { flex: 1, color: colors.subtleText, fontSize: 12 }, applyButton: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 9, borderWidth: 1, borderColor: colors.accentTeal }, applyText: { color: colors.accentText, fontSize: 12, fontWeight: "700" }, recommendation: { borderRadius: 16, backgroundColor: colors.callout, borderWidth: 1, borderColor: colors.borderStrong, padding: 14 }, recommendationTop: { flexDirection: "row", alignItems: "center", gap: 7 }, recommendTitle: { color: colors.accentText, fontWeight: "700", fontSize: 13 }, recommendMinutes: { color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 7 }, recommendReason: { color: colors.subtleText, fontSize: 12, lineHeight: 17, marginTop: 4 }, acceptButton: { alignSelf: "flex-start", marginTop: 11, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: colors.accentSolid, borderRadius: 9 }, acceptText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 }, statsSection: { borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, padding: 14 }, statRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, stat: { flex: 1, backgroundColor: colors.chip, borderRadius: 10, paddingVertical: 10, alignItems: "center" }, statValue: { color: colors.text, fontSize: 16, fontWeight: "800" }, statLabel: { color: colors.subtleText, fontSize: 10, marginTop: 3 }, historyCard: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }, historyTitle: { color: colors.text, fontSize: 12, fontWeight: "700" }, historyText: { color: colors.subtleText, fontSize: 11, marginTop: 4, lineHeight: 15 }, recentRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 10 }, recentText: { flex: 1, color: colors.text, fontSize: 11 }, recentMeta: { color: colors.textFaint, fontSize: 10 }, startButton: { overflow: "hidden", borderRadius: 28 }, startGradient: { minHeight: 54, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }, startText: { color: "#001A26", fontSize: 15, fontWeight: "800" }, runningHeader: { paddingTop: 60, paddingHorizontal: 24, alignItems: "center" }, runningTitle: { color: colors.text, fontSize: 22, fontWeight: "800" }, runningTopic: { color: colors.subtleText, textAlign: "center", marginTop: 10, fontSize: 13 }, progressBlock: { paddingHorizontal: 35, marginTop: 10 }, progressLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 }, track: { height: 7, borderRadius: 5, backgroundColor: colors.border, overflow: "hidden" }, fill: { height: "100%", backgroundColor: colors.accentTeal, borderRadius: 5 }, controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 31, marginTop: 42 }, control: { alignItems: "center", gap: 5, minWidth: 48 }, controlText: { color: colors.subtleText, fontSize: 11 }, pauseButton: { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.accentTeal, alignItems: "center", justifyContent: "center" }, pauseText: { color: colors.onAccent, fontSize: 11, fontWeight: "800", marginTop: 2 }, breakNote: { color: colors.subtleText, fontSize: 13, lineHeight: 20, textAlign: "center", paddingHorizontal: 42, marginTop: 40 }, summaryContent: { padding: 28, paddingTop: 80, paddingBottom: 60, gap: 13 }, summaryTitle: { color: colors.text, fontSize: 25, fontWeight: "800", textAlign: "center", marginTop: 5 }, summarySub: { color: colors.subtleText, textAlign: "center", fontSize: 13 }, summaryTopic: { color: colors.accentText, textAlign: "center", fontSize: 13, fontWeight: "700" }, summaryCard: { borderRadius: 16, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong, padding: 13, gap: 11 }, metric: { flexDirection: "row", alignItems: "center", gap: 9 }, metricIcon: { width: 29, height: 29, borderRadius: 9, backgroundColor: colors.iconWell, alignItems: "center", justifyContent: "center" }, metricLabel: { flex: 1, color: colors.subtleText, fontSize: 12 }, metricValue: { color: colors.text, fontSize: 12, fontWeight: "700" }, analysisCard: { borderRadius: 16, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong, padding: 14 }, analysisTitle: { color: colors.text, fontWeight: "800", fontSize: 15 }, analysisText: { color: colors.subtleText, fontSize: 13, lineHeight: 19, marginTop: 10 }, analysisNote: { color: colors.textFaint, fontSize: 10, lineHeight: 14, marginTop: 10 }, secondaryAction: { color: colors.accentText, textAlign: "center", fontWeight: "700", marginTop: 2 }, modalShade: { flex: 1, backgroundColor: "rgba(0, 8, 17, 0.72)", justifyContent: "flex-end" }, sheet: { maxHeight: "82%", borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 12 }, sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, sheetTitle: { color: colors.text, fontSize: 19, fontWeight: "800" }, sheetSub: { color: colors.subtleText, fontSize: 12 }, topicOption: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }, topicOptionActive: { backgroundColor: colors.highlight, borderRadius: 10, paddingHorizontal: 8 }, optionTitle: { color: colors.text, fontSize: 13, fontWeight: "700" }, optionPath: { color: colors.textFaint, fontSize: 10, marginTop: 3 }, settingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }, settingLabel: { flex: 1, color: colors.text, fontSize: 13 }, settingInput: { width: 52, color: colors.text, textAlign: "center", backgroundColor: colors.input, borderRadius: 8, paddingVertical: 7 }, settingsHint: { color: colors.subtleText, fontSize: 11, lineHeight: 16, marginVertical: 4 },
});
