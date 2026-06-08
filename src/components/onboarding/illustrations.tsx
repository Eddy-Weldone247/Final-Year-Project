import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { CheckIcon, LogoMark, MailIcon, ShieldIcon, SparkleIcon } from '@/components/icons';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

import { FloatingElement } from './FloatingElement';

// ---- shared building blocks ----------------------------------------------

/** A soft radial glow disc, absolutely positioned behind the hero. */
function Disc({
  id,
  color,
  size,
  style,
}: {
  id: string;
  color: string;
  size: number;
  style?: object;
}) {
  return (
    <View pointerEvents="none" style={[styles.absolute, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.55} />
            <Stop offset="60%" stopColor={color} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** A small frosted chip housing an icon. */
function GlassChip({ children, style }: { children: ReactNode; style?: object }) {
  const { c } = useAuthTheme();
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: c.glassBg, borderColor: c.glassBorder, shadowColor: c.glow },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A gradient coin token. */
function Coin({ size = 34 }: { size?: number }) {
  const { c } = useAuthTheme();
  return (
    <LinearGradient
      colors={c.primaryGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.coin, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.coinText, { color: c.onPrimary, fontSize: size * 0.45 }]}>$</Text>
    </LinearGradient>
  );
}

// ---- 1. Welcome ------------------------------------------------------------

export function WelcomeArt() {
  const { c } = useAuthTheme();
  return (
    <View style={styles.stage}>
      <Disc id="welcomeGlow" color={c.primary} size={300} />
      <FloatingElement amplitude={12} duration={3200}>
        <View style={[styles.heroBadge, { shadowColor: c.glow }]}>
          <LogoMark size={120} />
        </View>
      </FloatingElement>

      <FloatingElement
        style={[styles.absolute, { top: '12%', left: '16%' }]}
        amplitude={14}
        delay={200}
      >
        <GlassChip>
          <SparkleIcon size={20} color={c.accent} />
        </GlassChip>
      </FloatingElement>
      <FloatingElement
        style={[styles.absolute, { top: '18%', right: '14%' }]}
        amplitude={16}
        delay={500}
        rotate={8}
      >
        <GlassChip>
          <CheckIcon size={18} color={c.success} />
        </GlassChip>
      </FloatingElement>
      <FloatingElement
        style={[styles.absolute, { bottom: '14%', left: '22%' }]}
        amplitude={12}
        delay={800}
      >
        <Coin size={40} />
      </FloatingElement>
      <FloatingElement
        style={[styles.absolute, { bottom: '20%', right: '20%' }]}
        amplitude={18}
        delay={350}
      >
        <View style={[styles.dot, { backgroundColor: c.secondary }]} />
      </FloatingElement>
    </View>
  );
}

// ---- 2. Track Expenses Automatically --------------------------------------

export function AutoTrackArt() {
  const { c } = useAuthTheme();
  return (
    <View style={styles.stage}>
      <Disc id="trackGlow" color={c.accent} size={300} />

      <FloatingElement amplitude={10} duration={3400}>
        <View
          style={[
            styles.panel,
            { backgroundColor: c.glassBg, borderColor: c.glassBorder, shadowColor: c.glow },
          ]}
        >
          {/* incoming SMS bubble */}
          <View style={[styles.bubble, { backgroundColor: `${c.accent}26` }]}>
            <MailIcon size={16} color={c.accent} />
            <View style={styles.bubbleLines}>
              <View style={[styles.lineBar, { backgroundColor: c.textMuted, width: 70 }]} />
              <View style={[styles.lineBar, { backgroundColor: c.textFaint, width: 48 }]} />
            </View>
          </View>
          {/* parsed transaction row */}
          <View style={styles.txnRow}>
            <View style={[styles.txnIcon, { backgroundColor: `${c.primary}26` }]}>
              <Text style={styles.txnEmoji}>🍔</Text>
            </View>
            <View style={styles.txnMid}>
              <View style={[styles.lineBar, { backgroundColor: c.text, width: 82 }]} />
              <View style={[styles.lineBar, { backgroundColor: c.textFaint, width: 54 }]} />
            </View>
            <View style={[styles.amountPill, { backgroundColor: `${c.success}26` }]}>
              <Text style={[styles.amountText, { color: c.success }]}>-$12</Text>
            </View>
          </View>
        </View>
      </FloatingElement>

      <FloatingElement
        style={[styles.absolute, { top: '10%', right: '16%' }]}
        amplitude={16}
        delay={300}
      >
        <Coin size={38} />
      </FloatingElement>
      <FloatingElement
        style={[styles.absolute, { bottom: '14%', left: '14%' }]}
        amplitude={14}
        delay={600}
      >
        <Coin size={30} />
      </FloatingElement>
      <FloatingElement
        style={[styles.absolute, { top: '20%', left: '12%' }]}
        amplitude={12}
        delay={150}
        rotate={10}
      >
        <GlassChip>
          <CheckIcon size={16} color={c.success} />
        </GlassChip>
      </FloatingElement>
    </View>
  );
}

// ---- 3. Smart Budgeting ----------------------------------------------------

const RING_R = 56;
const RING_C = 2 * Math.PI * RING_R;

export function BudgetArt() {
  const { c } = useAuthTheme();
  const pct = 0.72;
  const bars = [
    { color: '#f97316', fill: 0.8 },
    { color: '#3b82f6', fill: 0.55 },
    { color: '#8b5cf6', fill: 0.35 },
  ];

  return (
    <View style={styles.stage}>
      <Disc id="budgetGlow" color={c.secondary} size={300} />

      <FloatingElement amplitude={10} duration={3600}>
        <View
          style={[
            styles.panel,
            styles.budgetPanel,
            { backgroundColor: c.glassBg, borderColor: c.glassBorder, shadowColor: c.glow },
          ]}
        >
          <View style={styles.ringWrap}>
            <Svg width={150} height={150}>
              <Defs>
                <SvgLinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={c.primary} />
                  <Stop offset="1" stopColor={c.secondary} />
                </SvgLinearGradient>
              </Defs>
              <Circle
                cx={75}
                cy={75}
                r={RING_R}
                stroke={c.inputBorder}
                strokeWidth={14}
                fill="none"
              />
              <Circle
                cx={75}
                cy={75}
                r={RING_R}
                stroke="url(#ringGrad)"
                strokeWidth={14}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - pct)}
                transform="rotate(-90 75 75)"
              />
            </Svg>
            <View style={styles.ringLabel}>
              <Text style={[styles.ringPct, { color: c.text }]}>72%</Text>
              <Text style={[styles.ringCaption, { color: c.textMuted }]}>of budget</Text>
            </View>
          </View>
          <View style={styles.bars}>
            {bars.map((b, i) => (
              <View key={i} style={[styles.barTrack, { backgroundColor: c.inputBorder }]}>
                <View
                  style={[styles.barFill, { width: `${b.fill * 100}%`, backgroundColor: b.color }]}
                />
              </View>
            ))}
          </View>
        </View>
      </FloatingElement>

      <FloatingElement
        style={[styles.absolute, { top: '12%', right: '16%' }]}
        amplitude={14}
        delay={250}
      >
        <GlassChip>
          <ShieldIcon size={18} color={c.success} />
        </GlassChip>
      </FloatingElement>
      <FloatingElement
        style={[styles.absolute, { bottom: '16%', left: '16%' }]}
        amplitude={16}
        delay={550}
      >
        <View style={[styles.dot, { backgroundColor: c.accent }]} />
      </FloatingElement>
    </View>
  );
}

// ---- 4. AI Predictions -----------------------------------------------------

export function AIPredictArt() {
  const { c } = useAuthTheme();
  return (
    <View style={styles.stage}>
      <Disc id="aiGlow" color={c.primary} size={300} />

      <FloatingElement amplitude={10} duration={3400}>
        <View
          style={[
            styles.panel,
            styles.chartPanel,
            { backgroundColor: c.glassBg, borderColor: c.glassBorder, shadowColor: c.glow },
          ]}
        >
          <Svg width={230} height={130} viewBox="0 0 230 130">
            <Defs>
              <SvgLinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={c.primary} />
                <Stop offset="1" stopColor={c.secondary} />
              </SvgLinearGradient>
            </Defs>
            {[35, 70, 105].map((y) => (
              <Line
                key={y}
                x1="10"
                y1={y}
                x2="220"
                y2={y}
                stroke={c.inputBorder}
                strokeWidth={1}
                opacity={0.4}
              />
            ))}
            {/* history */}
            <Path
              d="M14 100 L55 84 L96 92 L137 58"
              stroke="url(#lineGrad)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* forecast */}
            <Path
              d="M137 58 L178 40 L216 18"
              stroke={c.accent}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="2 9"
              fill="none"
            />
            <Circle cx={216} cy={18} r={6} fill={c.accent} />
          </Svg>
        </View>
      </FloatingElement>

      <FloatingElement
        style={[styles.absolute, { top: '14%', right: '14%' }]}
        amplitude={16}
        delay={200}
      >
        <GlassChip>
          <SparkleIcon size={20} color={c.accent} />
        </GlassChip>
      </FloatingElement>
      <FloatingElement
        style={[styles.absolute, { top: '18%', left: '14%' }]}
        amplitude={12}
        delay={500}
      >
        <View
          style={[styles.trendPill, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}
        >
          <Text style={[styles.trendText, { color: c.success }]}>+24%</Text>
        </View>
      </FloatingElement>
      <FloatingElement
        style={[styles.absolute, { bottom: '16%', right: '22%' }]}
        amplitude={18}
        delay={700}
      >
        <View style={[styles.dot, { backgroundColor: c.secondary }]} />
      </FloatingElement>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  absolute: { position: 'absolute' },
  heroBadge: {
    borderRadius: 34,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 16,
  },
  chip: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  coin: { alignItems: 'center', justifyContent: 'center' },
  coinText: { fontFamily: fontFamily.bold },
  dot: { width: 16, height: 16, borderRadius: 8 },
  panel: {
    width: 280,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 26,
    elevation: 12,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  bubbleLines: { gap: 6 },
  lineBar: { height: 7, borderRadius: 4 },
  txnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnEmoji: { fontSize: 20 },
  txnMid: { flex: 1, gap: 7 },
  amountPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  amountText: { fontSize: 13, fontFamily: fontFamily.bold },
  budgetPanel: { alignItems: 'center' },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringLabel: { position: 'absolute', alignItems: 'center' },
  ringPct: { fontSize: 26, fontFamily: fontFamily.extrabold },
  ringCaption: { fontSize: 12, fontFamily: fontFamily.medium },
  bars: { alignSelf: 'stretch', gap: 10, marginTop: 4 },
  barTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  chartPanel: { alignItems: 'center' },
  trendPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  trendText: { fontSize: 15, fontFamily: fontFamily.bold },
});
