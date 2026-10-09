import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

type Props = { onFinish: (openAi: boolean) => void };

const PAGE_COUNT = 3;

export function SplashScreen({ onContinue = () => {} }: { onContinue?: () => void }) {
  const bloom = useRef(new Animated.Value(0.7)).current;
  const glow = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bloom, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      }),
      Animated.timing(glow, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bloom, glow]);

  return (
    <View style={[styles.screen, styles.splashBackground]}>
      <SafeAreaView style={styles.splashSafe} edges={["top"]}>
        <Pressable accessibilityRole="button" onPress={onContinue} style={styles.continueButton}>
          <Text style={styles.continueText}>Continue</Text>
          <Ionicons name="arrow-forward" size={16} color="#A7F6E4" />
        </Pressable>
      </SafeAreaView>
      <View style={styles.splashContent}>
        <View style={styles.splashPlantStage}>
          <Animated.View style={{ opacity: glow, transform: [{ scale: bloom }] }}>
            <Image
              source={require("../../assets/icon.png")}
              style={styles.splashOwl}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
        <Animated.View style={[styles.splashBrandBlock, { opacity: glow, transform: [{ translateY: bloom.interpolate({ inputRange: [0.7, 1], outputRange: [12, 0] }) }] }]}>
          <Text style={styles.brand}>STRIX</Text>
          <Text style={styles.tagline}>Build what you know.</Text>
        </Animated.View>
      </View>
    </View>
  );
}

export default function OnboardingScreen({ onFinish }: Props) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [treeOpen, setTreeOpen] = useState(true);
  const [programmingOpen, setProgrammingOpen] = useState(true);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const goTo = (next: number) => {
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setPage(next);
  };
  const advance = () => (page === PAGE_COUNT - 1 ? onFinish(false) : goTo(page + 1));

  return (
    <LinearGradient colors={["#020B15", "#001B30", "#03182A"]} style={styles.screen}>
      <AmbientBackground />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <View style={styles.dots}>
            {Array.from({ length: PAGE_COUNT }, (_, index) => (
              <View key={index} style={[styles.dot, page === index && styles.dotActive]} />
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={() => onFinish(false)} hitSlop={10}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / width))}
        >
          <View style={[styles.page, { width }]}>
            <Text style={styles.heroCopy}>Your personal space{"\n"}for <Accent>learning, organizing,</Accent>{"\n"}and <Accent blue>understanding</Accent>{"\n"}knowledge.</Text>
            <View style={styles.growingScene}>
              <FloatingIcon icon="book-outline" color="#22D3EE" style={{ left: 70, top: 75 }} />
              <FloatingIcon icon="document-text-outline" color="#8B7CFF" style={{ right: 62, top: 55 }} />
              <FloatingIcon icon="image-outline" color="#A78BFA" style={{ left: 42, top: 164 }} />
              <FloatingIcon icon="musical-notes-outline" color="#8B7CFF" style={{ right: 32, top: 145 }} />
              <Sprout />
            </View>
          </View>

          <View style={[styles.page, { width }]}>
            <Text style={styles.title}>Build your{"\n"}<Accent>knowledge</Accent></Text>
            <Text style={styles.description}>Organize what you learn into your own knowledge tree — from broad fields to subjects, lessons, and individual words or notes.</Text>
            <View style={styles.treeCard}>
              <Pressable style={styles.treeRow} onPress={() => setTreeOpen(!treeOpen)}>
                <IconSquare icon="grid" color="#2498E8" />
                <Text style={styles.treeLabel}>Technology</Text>
                <Ionicons name={treeOpen ? "chevron-up" : "chevron-down"} size={17} color="#83C5FF" />
              </Pressable>
              {treeOpen && <View style={styles.treeBranch}>
                <Pressable style={styles.treeRow} onPress={() => setProgrammingOpen(!programmingOpen)}>
                  <IconSquare icon="code-slash" color="#315EDB" />
                  <Text style={styles.treeLabel}>Programming</Text>
                  <Ionicons name={programmingOpen ? "chevron-up" : "chevron-down"} size={17} color="#83C5FF" />
                </Pressable>
                {programmingOpen && <View style={styles.leafList}>
                  <TreeLeaf label="Java" />
                  <TreeLeaf label="Python" />
                </View>}
                <Pressable style={styles.treeRow} onPress={() => setProgrammingOpen(!programmingOpen)}>
                  <IconSquare icon="git-network" color="#315EDB" />
                  <Text style={styles.treeLabel}>Networking</Text>
                  <Ionicons name="chevron-down" size={17} color="#83C5FF" />
                </Pressable>
              </View>}
            </View>
          </View>

          <View style={[styles.page, { width }]}>
            <Text style={styles.title}>Meet your{"\n"}<Accent>AI Companion</Accent></Text>
            <Text style={styles.description}>Get help, stay organized, and understand better with AI.</Text>
            <View style={styles.toolList}>
              <AiTool icon="chatbubble-ellipses" title="Discuss My Notes" description="Ask questions and explore concepts using your saved knowledge." color="#7C4DFF" selected={selectedTool === "chat"} onPress={() => setSelectedTool("chat")} />
              <AiTool icon="bulb" title="Judge My Understanding" description="Get feedback on what you understand, what's missing, and what to improve." color="#14C9A7" selected={selectedTool === "judge"} onPress={() => setSelectedTool("judge")} />
              <AiTool icon="compass" title="AI Organization" description="Let AI suggest where a new term belongs in your knowledge tree." color="#3D7BFF" selected={selectedTool === "organize"} onPress={() => setSelectedTool("organize")} />
            </View>
            <View style={styles.privacyRow}>
              <View style={styles.shield}><Ionicons name="shield-checkmark-outline" size={16} color="#89C7FF" /></View>
              <Text style={styles.privacyText}>You're always in control. AI is your assistant, not the owner of your knowledge.</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={advance}>
            <LinearGradient colors={["#36E6C0", "#00BFAE"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryGradient}>
              <Text style={styles.primaryText}>{page === 2 ? "Set Up AI" : "Next"}</Text>
              <Ionicons name="arrow-forward" size={19} color="#001722" />
            </LinearGradient>
          </Pressable>
          {page === 2 && <Pressable accessibilityRole="button" onPress={() => onFinish(false)}><Text style={styles.skipNow}>Skip for now</Text></Pressable>}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Accent({ children, blue }: { children: React.ReactNode; blue?: boolean }) {
  return <Text style={{ color: blue ? "#7288FF" : "#1DE0C2", fontWeight: "800" }}>{children}</Text>;
}

function AmbientBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>

      {/* Soft ambient glows */}
      <View style={styles.ambientOne} />
      <View style={styles.ambientTwo} />
      <View style={styles.ambientThree} />
      <View style={styles.ambientFour} />

      {/* Sparkles */}
      <Text style={[styles.spark, { top: "12%", left: "9%" }]}>✦</Text>
      <Text style={[styles.spark, { top: "20%", right: "17%" }]}>✦</Text>
      <Text style={[styles.spark, { top: "38%", left: "18%" }]}>✦</Text>
      <Text style={[styles.spark, { top: "51%", right: "13%" }]}>✦</Text>
      <Text style={[styles.spark, { top: "67%", left: "8%" }]}>✦</Text>
      <Text style={[styles.spark, { top: "78%", right: "19%" }]}>✦</Text>
      <Text style={[styles.spark, { top: "91%", left: "25%" }]}>✦</Text>

      {/* Smaller decorative stars */}
      <Text style={[styles.smallSpark, { top: "27%", left: "28%" }]}>✧</Text>
      <Text style={[styles.smallSpark, { top: "46%", right: "27%" }]}>✧</Text>
      <Text style={[styles.smallSpark, { top: "61%", left: "17%" }]}>✧</Text>
      <Text style={[styles.smallSpark, { top: "84%", right: "10%" }]}>✧</Text>

      {/* Tiny dots */}
      <View style={[styles.ambientDot, { top: "16%", left: "36%" }]} />
      <View style={[styles.ambientDot, { top: "34%", right: "9%" }]} />
      <View style={[styles.ambientDot, { top: "57%", left: "6%" }]} />
      <View style={[styles.ambientDot, { top: "73%", right: "31%" }]} />
      <View style={[styles.ambientDot, { top: "88%", left: "12%" }]} />

    </View>
  );
}


function Sprout({ large, variant }: { large?: boolean; variant?: "splash" }) {
  const splash = variant === "splash";
  const size = splash ? 105 : large ? 78 : 58;
  return <View style={[styles.sprout, large && !splash && styles.sproutLarge, splash && styles.splashSprout]}>
    <View style={[styles.stem, splash && styles.splashStem, { height: splash ? 112 : large ? 80 : 62 }]} />
    <Ionicons name="leaf" size={100} color="#2FD9A8" style={[styles.iconLeaf, splash ? styles.splashLeafLeft : styles.iconLeafLeft]} />
    <Ionicons name="leaf" size={size} color="#35E5B2" style={[styles.iconLeaf, splash ? styles.splashLeafRight : styles.iconLeafRight]} />
    <Ionicons name="leaf" size={120} color="#62F0C8" style={[styles.iconLeaf, splash ? styles.splashLeafTop : styles.iconLeafTop]} />
    {!large && <View style={styles.sproutBase} />}
  </View>;
}

function FloatingIcon({ icon, color, style }: { icon: any; color: string; style: any }) {
  return <LinearGradient colors={[`${color}BB`, "#092C57"]} style={[styles.floatingIcon, style]}><Ionicons name={icon} size={27} color="#E2F3FF" /></LinearGradient>;
}

function IconSquare({ icon, color }: { icon: any; color: string }) {
  return <LinearGradient colors={[color, "#11366B"]} style={styles.iconSquare}><Ionicons name={icon} size={19} color="#DFF5FF" /></LinearGradient>;
}

function TreeLeaf({ label }: { label: string }) { return <View style={styles.treeLeaf}><View style={styles.leafDot} /><Text style={styles.treeLeafText}>{label}</Text></View>; }

function AiTool({ icon, title, description, color, selected, onPress }: { icon: any; title: string; description: string; color: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.aiTool, selected && { borderColor: colors.accentTeal, backgroundColor: "#082B46" }]}>
    <LinearGradient colors={[color, `${color}99`]} style={styles.aiIcon}><Ionicons name={icon} size={27} color="#fff" /></LinearGradient>
    <View style={{ flex: 1 }}><Text style={styles.aiTitle}>{title}</Text><Text style={styles.aiDescription}>{description}</Text></View>
    <Ionicons name="chevron-forward" size={21} color="#7AB8F2" />
  </Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, safe: { flex: 1 }, splashSafe: { position: "absolute", zIndex: 2, top: 0, right: 0, left: 0, alignItems: "flex-end", paddingHorizontal: 22 }, continueButton: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: "#1A6B78", backgroundColor: "rgba(4, 53, 70, 0.72)" }, continueText: { color: "#A7F6E4", fontSize: 13, fontWeight: "700" }, topBar: { height: 58, paddingHorizontal: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, dots: { flexDirection: "row", gap: 10 }, dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#285987" }, dotActive: { backgroundColor: "#25E1C3" }, skip: { color: "#A4D5FF", fontSize: 15 }, page: { flex: 1, paddingHorizontal: 28 }, heroCopy: { color: "#F0F6FF", fontSize: 27, lineHeight: 36, fontWeight: "500", marginTop: 50 }, title: { color: "#F0F6FF", fontSize: 31, lineHeight: 35, fontWeight: "700", marginTop: 38 }, description: { color: "#A9D9FF", fontSize: 16, lineHeight: 24, marginTop: 16, maxWidth: 340 }, footer: { paddingHorizontal: 28, paddingBottom: 12, gap: 14 }, primaryButton: { borderRadius: 28, overflow: "hidden", shadowColor: "#14DDB8", shadowOpacity: 0.45, shadowRadius: 15, elevation: 8 }, primaryGradient: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }, primaryText: { color: "#001722", fontSize: 16, fontWeight: "800" }, skipNow: { color: "#B4DDFF", fontSize: 15, textAlign: "center", marginBottom: 1 }, ambientOne: { position: "absolute", width: 330, height: 330, borderRadius: 180, backgroundColor: "#003D60", opacity: 0.18, top: "37%", left: -135 }, ambientTwo: { position: "absolute", width: 300, height: 300, borderRadius: 160, borderWidth: 1, borderColor: "#067CAF", opacity: 0.16, bottom: -125, right: -110 }, spark: { position: "absolute", color: "#22E2C3", fontSize: 12 },
  ambientThree: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(120, 90, 255, 0.06)",
    top: "42%",
    left: "-15%",
  },
  ambientFour: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(0, 200, 255, 0.04)",
    bottom: "-8%",
    right: "-15%",
  },
  smallSpark: {
    position: "absolute",
    color: "rgba(255, 255, 255, 0.22)",
    fontSize: 12,
  },
  ambientDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },

  lightParticle: {
    position: "absolute",
    width: 34,
    height: 1,
    borderRadius: 2,
    backgroundColor: "rgba(34, 226, 195, 0.22)",
  },
  splashCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }, brand: { color: "#F5F7FF", fontSize: 40, fontWeight: "700", textAlign: "center", marginTop: 22 }, tagline: { color: "#A9D9FF", fontSize: 18, textAlign: "center", marginTop: 6 }, sprout: { width: 170, height: 185, alignItems: "center", justifyContent: "flex-end" }, sproutLarge: { transform: [{ scale: 1.4 }], marginBottom: 38 }, stem: { width: 5, borderRadius: 4, backgroundColor: "#1CE7BD", position: "absolute", bottom: 28, shadowColor: "#16DAB1", shadowOpacity: 0.85, shadowRadius: 11 }, iconLeaf: { position: "absolute", bottom: 66, textShadowColor: "#24F6CA", textShadowRadius: 12 }, iconLeafLeft: { left: 27, transform: [{ rotate: "-38deg" }] }, iconLeafRight: { right: 27, transform: [{ rotate: "38deg" }] }, iconLeafTop: { bottom: 106, transform: [{ rotate: "-43deg" }] }, sproutBase: { width: 190, height: 31, borderRadius: 100, backgroundColor: "#076D78", opacity: 0.45, bottom: 0 }, growingScene: { flex: 1, minHeight: 330, marginTop: 16, justifyContent: "flex-end", alignItems: "center" }, floatingIcon: { width: 59, height: 59, borderRadius: 12, alignItems: "center", justifyContent: "center", position: "absolute", borderWidth: 1, borderColor: "#1F8CBE", shadowColor: "#0BD3E8", shadowOpacity: 0.35, shadowRadius: 12 }, treeCard: { backgroundColor: "rgba(4, 40, 70, 0.84)", borderRadius: 21, marginTop: 72, padding: 12, borderWidth: 1, borderColor: "#0D4E7D" }, treeBranch: { borderLeftWidth: 2, borderColor: "#18D8C0", marginLeft: 17, paddingLeft: 15, marginTop: 2, gap: 8 }, treeRow: { minHeight: 54, borderRadius: 14, backgroundColor: "#082B4B", padding: 9, flexDirection: "row", alignItems: "center", gap: 12 }, treeLabel: { flex: 1, color: "#F0F6FF", fontSize: 15, fontWeight: "600" }, iconSquare: { width: 39, height: 39, borderRadius: 10, alignItems: "center", justifyContent: "center" }, leafList: { marginLeft: 13, gap: 12, paddingVertical: 3 }, treeLeaf: { flexDirection: "row", alignItems: "center", gap: 12 }, leafDot: { width: 8, height: 8, borderRadius: 5, backgroundColor: "#18B9D2" }, treeLeafText: { color: "#DBF1FF", fontSize: 14 }, toolList: { marginTop: 27, gap: 10 }, aiTool: { minHeight: 104, borderRadius: 20, padding: 13, backgroundColor: "rgba(5, 40, 70, 0.85)", borderWidth: 1, borderColor: "#0D4B75", flexDirection: "row", alignItems: "center", gap: 13 }, aiIcon: { width: 58, height: 58, borderRadius: 15, alignItems: "center", justifyContent: "center" }, aiTitle: { color: "#F3F8FF", fontSize: 15, fontWeight: "700" }, aiDescription: { color: "#9BC8EE", fontSize: 12, lineHeight: 16, marginTop: 4 }, privacyRow: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 20, paddingHorizontal: 2 }, shield: { width: 31, height: 31, borderRadius: 16, backgroundColor: "#083353", alignItems: "center", justifyContent: "center" }, privacyText: { flex: 1, color: "#86BDE7", fontSize: 11, lineHeight: 15 },
  splashBackground: { backgroundColor: "#030C2B" },
  splashContent: { flex: 1, alignItems: "center" },
  splashOwl: { width: 320, height: 320 },
  splashPlantStage: { width: "100%", height: "56%", justifyContent: "flex-end", alignItems: "center", paddingBottom: 20 },
  splashBrandBlock: { width: "100%", height: "44%", alignItems: "center", paddingTop: 52 },
  splashSprout: { width: 250, height: 250, justifyContent: "flex-end" },
  splashStem: { bottom: 20, width: 10, borderRadius: 8 },
  splashLeafLeft: { left: 24, bottom: 82, transform: [{ rotate: "-5deg" }] },
  splashLeafRight: { right: 18, bottom: 70, transform: [{ rotate: "127deg" }] },
  splashLeafTop: { left: 71, bottom: 126, transform: [{ rotate: "62deg" }] },
});
