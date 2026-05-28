// themes.jsx — Three aesthetic directions for puddle.
// Each theme provides the same token surface; PuzzleApp does not care which
// is mounted. Keep the SAME keys across themes — missing keys produce silent
// undefined styles.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// A · EDITORIAL — Paper & ink. Crimson Pro / IBM Plex Mono.
// Cream background, deep walnut ink, a single rust accent. Hairline borders,
// classical type, monospaced data. Feels like a hand-set puzzle column.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const EDITORIAL = (() => {
  const bg = '#f5ecdb';
  const surface = '#fcf7ea';
  const surfaceAlt = '#efe5cf';
  const text = '#3a2f22';
  const textMuted = '#a59581';
  const border = '#ebe0c9';
  const accent = '#b85a3e';
  const accentText = '#fcf7ea';
  const success = '#6b8a52';
  const glow = 'rgba(184,90,62,.25)';
  const shadow = '0 1px 2px rgba(58,47,34,.04), 0 6px 24px rgba(58,47,34,.05)';
  const fontDisplay = '"Crimson Pro", "Iowan Old Style", Georgia, serif';
  const fontBody = '"Crimson Pro", "Iowan Old Style", Georgia, serif';
  // Editorial keeps a single typeface — "mono" slot reuses Crimson Pro so
  // data blocks read in the same serif voice, just larger / tabular.
  const fontMono = '"Crimson Pro", "Iowan Old Style", Georgia, serif';

  return {
    id: 'editorial',
    bg, surface, surfaceAlt, text, textMuted, border, accent, accentText, success, glow,
    fontDisplay, fontBody, fontMono,
    ease: 'cubic-bezier(.22,.99,.32,1)',
    pad: 40, measure: 600, headerGap: 28, tabGap: 28,

    // Header — 2×2 puzzle-tile mark (consistent with the landing page),
    // italic captions, no all-caps
    logoMark: {
      width: 26, height: 26,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gap: 2,
      borderRadius: 3,
      overflow: 'hidden',
      flexShrink: 0,
    },
    logoCells: [text, accent, accent, text],
    logoDot: { display: 'none' },
    logoText: {
      fontFamily: fontDisplay, fontWeight: 500, fontSize: 22,
      letterSpacing: -0.3, color: text, fontFeatureSettings: '"lnum"',
    },
    logoSub: {
      fontFamily: fontBody, fontSize: 13, color: textMuted,
      fontStyle: 'italic', marginTop: 1,
    },

    metricStyle: { display: 'flex', flexDirection: 'column', gap: 3 },
    metricLabel: {
      fontFamily: fontBody, fontSize: 13, color: textMuted, fontStyle: 'italic',
    },
    metricValue: {
      fontFamily: fontDisplay, fontSize: 22, fontWeight: 500,
      color: text, letterSpacing: -0.3, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
    },
    streakFlame: { color: accent, marginLeft: 4, fontSize: 13 },
    streakIcon: '●',

    xpTrack: { height: 5, background: border, borderRadius: 3, overflow: 'hidden', position: 'relative' },
    xpFill: { height: '100%', background: accent, borderRadius: 3 },

    // Tabs
    tabStyle: { padding: '16px 0', minWidth: 0, flex: '1 1 0' },
    tabIdx: {
      fontFamily: fontBody, fontSize: 14, color: textMuted, fontStyle: 'italic',
    },
    tabTitle: {
      fontFamily: fontDisplay, fontSize: 17, fontWeight: 500, letterSpacing: -0.2,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      minWidth: 0, flex: '1 1 auto',
    },
    tabCheck: {
      width: 16, height: 16, background: success, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, borderRadius: '50%',
    },
    tabCategory: {
      fontFamily: fontBody, fontSize: 13, color: textMuted, fontStyle: 'italic',
      marginTop: 3, marginLeft: 26,
    },

    // Puzzle head — italic kicker, soft round dots, lighter title weight
    kicker: {
      fontFamily: fontBody, fontSize: 15, color: accent,
      fontStyle: 'italic', fontWeight: 500,
    },
    dotSep: { color: textMuted },
    difficultyLine: { display: 'inline-flex', alignItems: 'center', gap: 5 },
    diffDot: { width: 6, height: 6, background: accent, borderRadius: '50%' },
    difficultyLabel: {
      fontFamily: fontBody, fontSize: 14, color: textMuted, marginLeft: 8,
      fontStyle: 'italic',
    },
    titleStyle: {
      fontFamily: fontDisplay, fontWeight: 500, fontSize: 42,
      color: text, letterSpacing: -0.6, lineHeight: 1.08, margin: '8px 0 0',
      fontFeatureSettings: '"ss01"',
    },

    promptStyle: { fontFamily: fontBody, fontSize: 19, lineHeight: 1.6, color: text, fontWeight: 400 },
    dataStyle: {
      fontFamily: fontDisplay, fontSize: 22, color: text, lineHeight: 1.45,
      padding: '16px 22px', background: surface, borderRadius: 16,
      letterSpacing: -0.1, boxShadow: shadow, fontWeight: 500,
      fontVariantNumeric: 'tabular-nums oldstyle-nums',
    },

    // Hint — pillow card, italic label, no hard left rule
    hintStyle: {
      padding: '16px 20px', background: surface, borderRadius: 16,
      fontSize: 16.5, lineHeight: 1.55, display: 'flex', gap: 14, color: text,
      boxShadow: shadow,
    },
    hintLabel: {
      fontFamily: fontBody, fontSize: 13.5, color: accent,
      fontStyle: 'italic', marginTop: 3,
      flexShrink: 0, fontWeight: 500,
    },

    // Choices — soft pillows, no hard border, shadow on hover
    choiceStyle: {
      padding: '16px 20px', background: surface, border: 'none',
      display: 'flex', alignItems: 'center', gap: 14, borderRadius: 14,
      color: text, boxShadow: shadow,
    },
    choiceActive: { background: text, color: surface, boxShadow: '0 2px 6px rgba(58,47,34,.18)' },
    choiceCorrect: { background: success, color: '#fff', boxShadow: '0 2px 12px rgba(107,138,82,.3)', animation: 'pa-editorial-glow 1.4s var(--ease) both' },
    choiceHover: 'box-shadow: 0 2px 8px rgba(58,47,34,.08), 0 10px 28px rgba(58,47,34,.07);',
    choiceKey: {
      fontFamily: fontBody, fontSize: 14, opacity: 0.55, fontStyle: 'italic',
      width: 14, flexShrink: 0,
    },
    choiceValue: {
      fontFamily: fontDisplay, fontSize: 24, fontWeight: 500, letterSpacing: -0.2,
    },

    // Numeric stepper — pillow, no inner dividers
    stepperWrap: {
      display: 'inline-flex', alignItems: 'stretch',
      background: surface, width: 240,
      borderRadius: 16, overflow: 'hidden', boxShadow: shadow,
    },
    stepperBtn: {
      width: 50, background: 'transparent', border: 'none', cursor: 'pointer',
      fontFamily: fontDisplay, fontSize: 26, color: text, fontWeight: 400,
    },
    stepperInput: {
      flex: 1, border: 'none', outline: 'none', background: 'transparent',
      fontFamily: fontDisplay, fontSize: 30, color: text, textAlign: 'center',
      fontVariantNumeric: 'tabular-nums', fontWeight: 500,
    },

    // Free-text input — pillow
    textInput: {
      width: '100%', padding: '16px 20px', background: surface,
      border: 'none', borderRadius: 16,
      color: text, fontSize: 24, letterSpacing: 0.3,
      boxSizing: 'border-box', boxShadow: shadow,
    },
    inputFocus: `box-shadow: 0 0 0 2px ${accent}, ${shadow};`,

    // Status
    statusLine: {
      marginTop: 14, fontFamily: fontDisplay, fontSize: 19, fontWeight: 500, fontStyle: 'italic',
      display: 'flex', alignItems: 'center', gap: 10,
    },
    checkBubble: {
      width: 22, height: 22, borderRadius: '50%', color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
    },
    successRing: {
      width: 60, height: 60, borderRadius: '50%',
      border: `2px solid ${success}`,
    },

    // Buttons — pillow primary, borderless italic ghosts
    primaryBtn: {
      background: text, color: surface, border: 'none',
      padding: '14px 28px', fontSize: 16, fontWeight: 500, letterSpacing: 0.2,
      cursor: 'pointer', borderRadius: 16, fontFamily: fontDisplay,
      boxShadow: '0 2px 6px rgba(58,47,34,.16)',
    },
    ghostBtn: {
      background: 'transparent', color: text, border: 'none',
      padding: '10px 14px', fontSize: 15, fontWeight: 500, fontStyle: 'italic',
      display: 'inline-flex', alignItems: 'center', gap: 7,
      cursor: 'pointer', borderRadius: 12, fontFamily: fontDisplay,
    },
    ghostBtnActive: { background: text, color: surface, fontStyle: 'normal' },
    btnNote: { fontFamily: fontBody, fontSize: 12.5, opacity: 0.55, fontStyle: 'italic' },
    hintIcon: { color: accent, fontSize: 14 },
    attemptsLabel: {
      fontFamily: fontBody, fontSize: 14, color: textMuted, fontStyle: 'italic',
      animation: `pa-editorial-pulse 1.6s var(--ease) infinite`,
    },

    // Scratch
    scratchTitle: {
      fontFamily: fontDisplay, fontSize: 15, color: textMuted, fontStyle: 'italic',
    },
    iconBtn: {
      width: 28, height: 28, border: 'none', background: 'transparent',
      cursor: 'pointer', color: textMuted, fontSize: 18, lineHeight: 1,
      borderRadius: '50%',
    },
  };
})();


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// B · QUIET MODERN — Soft white, sans, calm. Generous whitespace,
// rounded corners, a single sage accent. Type does the work.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const MODERN = (() => {
  const bg = '#fafaf7';
  const surface = '#ffffff';
  const surfaceAlt = '#f3f3ee';
  const text = '#1a1a18';
  const textMuted = '#7e7e76';
  const border = '#e8e8e1';
  const accent = '#5d8b6a';
  const accentText = '#ffffff';
  const success = '#5d8b6a';
  const glow = 'rgba(93,139,106,.35)';
  const fontDisplay = '"Instrument Serif", "Cormorant Garamond", Georgia, serif';
  const fontBody = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  const fontMono = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace';

  return {
    id: 'modern',
    bg, surface, surfaceAlt, text, textMuted, border, accent, accentText, success, glow,
    fontDisplay, fontBody, fontMono,
    ease: 'cubic-bezier(.22,.99,.32,1)',
    pad: 40, measure: 580, headerGap: 22, tabGap: 22,

    logoMark: {
      width: 28, height: 28, borderRadius: 14, background: text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    logoDot: { width: 10, height: 10, background: accent, borderRadius: 5, display: 'block' },
    logoText: {
      fontFamily: fontBody, fontWeight: 600, fontSize: 17,
      letterSpacing: -0.3, color: text,
    },
    logoSub: {
      fontFamily: fontBody, fontSize: 12, color: textMuted, marginTop: 1,
    },

    metricStyle: { display: 'flex', flexDirection: 'column', gap: 3 },
    metricLabel: {
      fontFamily: fontBody, fontSize: 11, color: textMuted, fontWeight: 500,
    },
    metricValue: {
      fontFamily: fontDisplay, fontSize: 26, fontWeight: 400,
      color: text, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.4,
    },
    streakFlame: { color: accent, marginLeft: 4, fontSize: 14, fontFamily: fontBody },

    xpTrack: { height: 6, background: surfaceAlt, borderRadius: 3, overflow: 'hidden', position: 'relative' },
    xpFill: { height: '100%', background: accent, borderRadius: 3 },

    tabStyle: { padding: '14px 0', minWidth: 0, flex: '1 1 0' },
    tabIdx: { fontFamily: fontMono, fontSize: 11, color: textMuted, letterSpacing: 0.5, fontWeight: 500 },
    tabTitle: {
      fontFamily: fontBody, fontSize: 14, fontWeight: 600, letterSpacing: -0.1,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      minWidth: 0, flex: '1 1 auto',
    },
    tabCheck: {
      width: 18, height: 18, background: accent, color: '#fff', borderRadius: 9,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
    },
    tabCategory: { fontFamily: fontBody, fontSize: 12, color: textMuted, marginTop: 4, marginLeft: 28, fontWeight: 500 },

    kicker: {
      fontFamily: fontBody, fontSize: 12, color: accent, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: 0.8,
    },
    dotSep: { color: textMuted },
    difficultyLine: { display: 'inline-flex', alignItems: 'center', gap: 5 },
    diffDot: { width: 6, height: 6, background: accent, borderRadius: 3 },
    difficultyLabel: { fontFamily: fontBody, fontSize: 12, color: textMuted, marginLeft: 8, fontWeight: 500 },
    titleStyle: {
      fontFamily: fontDisplay, fontWeight: 400, fontSize: 44,
      color: text, letterSpacing: -1.2, lineHeight: 1.04, margin: '6px 0 0',
    },

    promptStyle: { fontFamily: fontBody, fontSize: 17, lineHeight: 1.6, color: text, fontWeight: 400 },
    dataStyle: {
      fontFamily: fontMono, fontSize: 14, color: text, lineHeight: 1.65,
      padding: '12px 16px', background: surface, borderRadius: 8,
      letterSpacing: 0.4, border: `1px solid ${border}`,
    },

    hintStyle: {
      padding: '12px 14px', background: surface, borderRadius: 10,
      border: `1px solid ${border}`,
      fontSize: 15, lineHeight: 1.5, display: 'flex', gap: 12, color: text,
    },
    hintLabel: {
      fontFamily: fontBody, fontSize: 11, color: accent,
      fontWeight: 600, marginTop: 3, flexShrink: 0,
    },

    choiceStyle: {
      padding: '14px 16px', background: surface, border: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', gap: 12, borderRadius: 10,
      color: text,
    },
    choiceActive: { background: text, color: surface, borderColor: text },
    choiceCorrect: { background: accent, color: '#fff', borderColor: accent, animation: 'pa-modern-glow 1.4s var(--ease) both' },
    choiceHover: `background: ${surfaceAlt}; border-color: #d4d4cb;`,
    choiceKey: {
      fontFamily: fontMono, fontSize: 11, opacity: 0.5,
      width: 14, flexShrink: 0, fontWeight: 500,
    },
    choiceValue: {
      fontFamily: fontDisplay, fontSize: 22, fontWeight: 400,
    },

    stepperWrap: {
      display: 'inline-flex', alignItems: 'stretch',
      border: `1px solid ${border}`, background: surface, width: 220, borderRadius: 12, overflow: 'hidden',
    },
    stepperBtn: {
      width: 48, background: 'transparent', border: 'none', cursor: 'pointer',
      fontSize: 22, color: text, fontWeight: 400,
    },
    stepperInput: {
      flex: 1, border: 'none', outline: 'none', background: 'transparent',
      fontFamily: fontDisplay, fontSize: 28, color: text, textAlign: 'center',
      fontVariantNumeric: 'tabular-nums', fontWeight: 400,
    },

    textInput: {
      width: '100%', padding: '14px 16px', background: surface,
      border: `1px solid ${border}`, borderRadius: 12,
      color: text, fontSize: 22,
      boxSizing: 'border-box',
    },
    inputFocus: `border-color: ${accent}; box-shadow: 0 0 0 4px ${glow.replace('.35', '.15')};`,

    statusLine: {
      marginTop: 14, fontFamily: fontBody, fontSize: 14, fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 10,
    },
    checkBubble: {
      width: 22, height: 22, borderRadius: 11, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
    },
    successRing: {
      width: 60, height: 60, borderRadius: '50%',
      border: `2px solid ${accent}`,
    },

    primaryBtn: {
      background: text, color: surface, border: 'none',
      padding: '12px 22px', fontSize: 14, fontWeight: 600, letterSpacing: 0.1,
      cursor: 'pointer', borderRadius: 10,
    },
    ghostBtn: {
      background: surface, color: text, border: `1px solid ${border}`,
      padding: '10px 14px', fontSize: 13, fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: 7,
      cursor: 'pointer', borderRadius: 10,
    },
    ghostBtnActive: { background: text, color: surface, borderColor: text },
    btnNote: { fontFamily: fontMono, fontSize: 10.5, opacity: 0.55, fontWeight: 500 },
    hintIcon: { color: accent, fontSize: 13 },
    attemptsLabel: {
      fontFamily: fontBody, fontSize: 12, color: textMuted, fontWeight: 500,
      animation: `pa-modern-pulse 1.6s var(--ease) infinite`,
    },

    scratchTitle: {
      fontFamily: fontBody, fontSize: 12, color: textMuted, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: 0.6,
    },
    iconBtn: {
      width: 24, height: 24, border: 'none', background: 'transparent',
      cursor: 'pointer', color: textMuted, fontSize: 18, lineHeight: 1,
      borderRadius: 6,
    },
  };
})();


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// C · DEEP FOCUS — Dark, mono accent. Mid-night UI for late-night
// solving. Soft glow on success, no harsh fluorescents.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FOCUS = (() => {
  const bg = '#0e1115';
  const surface = '#161a20';
  const surfaceAlt = '#11151b';
  const text = '#e6e2d6';
  const textMuted = '#7a8088';
  const border = '#222831';
  const accent = '#d4a85e';
  const accentText = '#0e1115';
  const success = '#7fbf7f';
  const glow = 'rgba(212,168,94,.5)';
  const fontDisplay = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  const fontBody = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  const fontMono = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace';

  return {
    id: 'focus',
    bg, surface, surfaceAlt, text, textMuted, border, accent, accentText, success, glow,
    fontDisplay, fontBody, fontMono,
    ease: 'cubic-bezier(.22,.99,.32,1)',
    pad: 36, measure: 580, headerGap: 22, tabGap: 22,

    logoMark: {
      width: 28, height: 28, borderRadius: 6, background: accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 24px ${glow}`,
    },
    logoDot: { width: 10, height: 10, background: bg, borderRadius: 1, display: 'block' },
    logoText: {
      fontFamily: fontMono, fontWeight: 500, fontSize: 15,
      letterSpacing: 0.3, color: text,
    },
    logoSub: {
      fontFamily: fontMono, fontSize: 10.5, color: textMuted,
      textTransform: 'uppercase', letterSpacing: 1.6, marginTop: 2,
    },

    metricStyle: { display: 'flex', flexDirection: 'column', gap: 3 },
    metricLabel: {
      fontFamily: fontMono, fontSize: 10, color: textMuted,
      textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: 500,
    },
    metricValue: {
      fontFamily: fontMono, fontSize: 20, fontWeight: 500,
      color: text, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.4,
    },
    streakFlame: { color: accent, marginLeft: 4, fontSize: 13 },

    xpTrack: { height: 4, background: surface, borderRadius: 2, overflow: 'hidden', position: 'relative', border: `1px solid ${border}` },
    xpFill: { height: '100%', background: accent, boxShadow: `0 0 12px ${glow}` },

    tabStyle: { padding: '14px 0', minWidth: 0, flex: '1 1 0' },
    tabIdx: { fontFamily: fontMono, fontSize: 11, color: textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 },
    tabTitle: {
      fontFamily: fontBody, fontSize: 14, fontWeight: 600, letterSpacing: -0.1,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      minWidth: 0, flex: '1 1 auto',
    },
    tabCheck: {
      width: 16, height: 16, background: success, color: bg, borderRadius: 3,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
    },
    tabCategory: { fontFamily: fontMono, fontSize: 10, color: textMuted, marginTop: 4, marginLeft: 28, textTransform: 'uppercase', letterSpacing: 1.2 },

    kicker: {
      fontFamily: fontMono, fontSize: 10.5, color: accent,
      textTransform: 'uppercase', letterSpacing: 1.6, fontWeight: 500,
    },
    dotSep: { color: textMuted },
    difficultyLine: { display: 'inline-flex', alignItems: 'center', gap: 4 },
    diffDot: { width: 5, height: 5, background: accent, borderRadius: 1 },
    difficultyLabel: { fontFamily: fontMono, fontSize: 10.5, color: textMuted, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 },
    titleStyle: {
      fontFamily: fontDisplay, fontWeight: 600, fontSize: 36,
      color: text, letterSpacing: -0.8, lineHeight: 1.08, margin: '6px 0 0',
    },

    promptStyle: { fontFamily: fontBody, fontSize: 16, lineHeight: 1.6, color: text, fontWeight: 400 },
    dataStyle: {
      fontFamily: fontMono, fontSize: 14, color: accent, lineHeight: 1.7,
      padding: '12px 16px', background: surface, borderRadius: 4,
      letterSpacing: 0.5, border: `1px solid ${border}`, borderLeft: `2px solid ${accent}`,
    },

    hintStyle: {
      padding: '12px 14px', background: surface, borderRadius: 6,
      border: `1px solid ${border}`, borderLeft: `2px solid ${accent}`,
      fontSize: 14.5, lineHeight: 1.55, display: 'flex', gap: 12, color: text,
    },
    hintLabel: {
      fontFamily: fontMono, fontSize: 10, color: accent,
      textTransform: 'uppercase', letterSpacing: 1.3, marginTop: 4,
      flexShrink: 0, fontWeight: 500,
    },

    choiceStyle: {
      padding: '14px 16px', background: surface, border: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', gap: 12, borderRadius: 6,
      color: text,
    },
    choiceActive: { background: 'rgba(212,168,94,.12)', color: accent, borderColor: accent },
    choiceCorrect: { background: 'rgba(127,191,127,.18)', color: success, borderColor: success, boxShadow: `0 0 24px rgba(127,191,127,.25)`, animation: 'pa-focus-glow 1.6s var(--ease) both' },
    choiceHover: `background: #1c2129; border-color: #2c333e;`,
    choiceKey: {
      fontFamily: fontMono, fontSize: 11, opacity: 0.55,
      letterSpacing: 1, width: 14, flexShrink: 0,
    },
    choiceValue: {
      fontFamily: fontMono, fontSize: 18, fontWeight: 500, letterSpacing: 0.3,
    },

    stepperWrap: {
      display: 'inline-flex', alignItems: 'stretch',
      border: `1px solid ${border}`, background: surface, width: 220, borderRadius: 6, overflow: 'hidden',
    },
    stepperBtn: {
      width: 44, background: 'transparent', border: 'none', cursor: 'pointer',
      fontFamily: fontMono, fontSize: 20, color: text, fontWeight: 500,
    },
    stepperInput: {
      flex: 1, border: 'none', outline: 'none', background: 'transparent',
      fontFamily: fontMono, fontSize: 26, color: accent, textAlign: 'center',
      borderLeft: `1px solid ${border}`, borderRight: `1px solid ${border}`,
      fontVariantNumeric: 'tabular-nums', fontWeight: 500, letterSpacing: 1,
    },

    textInput: {
      width: '100%', padding: '14px 16px', background: surface,
      border: `1px solid ${border}`, borderRadius: 6,
      color: accent, fontSize: 22, letterSpacing: 1,
      boxSizing: 'border-box',
    },
    inputFocus: `border-color: ${accent}; box-shadow: 0 0 0 1px ${accent}, 0 0 24px ${glow};`,

    statusLine: {
      marginTop: 14, fontFamily: fontMono, fontSize: 13, fontWeight: 500,
      textTransform: 'uppercase', letterSpacing: 1.2,
      display: 'flex', alignItems: 'center', gap: 10,
    },
    checkBubble: {
      width: 22, height: 22, borderRadius: 4, color: bg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
      boxShadow: `0 0 16px rgba(127,191,127,.5)`,
    },
    successRing: {
      width: 60, height: 60, borderRadius: '50%',
      border: `1.5px solid ${success}`, boxShadow: `0 0 24px rgba(127,191,127,.4)`,
    },

    primaryBtn: {
      background: accent, color: accentText, border: 'none',
      padding: '12px 22px', fontSize: 13, fontWeight: 600, letterSpacing: 1,
      textTransform: 'uppercase', cursor: 'pointer', borderRadius: 6,
      boxShadow: `0 0 24px ${glow}`,
    },
    ghostBtn: {
      background: 'transparent', color: text, border: `1px solid ${border}`,
      padding: '10px 14px', fontSize: 12, fontWeight: 500, letterSpacing: 0.8,
      fontFamily: fontMono, textTransform: 'uppercase',
      display: 'inline-flex', alignItems: 'center', gap: 7,
      cursor: 'pointer', borderRadius: 6,
    },
    ghostBtnActive: { background: accent, color: accentText, borderColor: accent },
    btnNote: { fontSize: 10, opacity: 0.55 },
    hintIcon: { color: accent, fontSize: 13 },
    attemptsLabel: {
      fontFamily: fontMono, fontSize: 10.5, color: textMuted,
      textTransform: 'uppercase', letterSpacing: 1.4,
      animation: `pa-focus-pulse 1.6s var(--ease) infinite`,
    },

    scratchTitle: {
      fontFamily: fontMono, fontSize: 10.5, color: textMuted,
      textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: 500,
    },
    iconBtn: {
      width: 22, height: 22, border: `1px solid ${border}`, background: 'transparent',
      cursor: 'pointer', color: textMuted, fontSize: 14, lineHeight: 1,
      borderRadius: 4,
    },
  };
})();

Object.assign(window, { EDITORIAL, MODERN, FOCUS });
