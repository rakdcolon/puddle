// puzzle-app.jsx — Shared PuzzleApp component. Theme is fully token-driven so
// the same UI can render in editorial / modern / focus directions.
//
// All puzzles are pure text in, text out. Three input modes: choice, numeric,
// freetext (case/space-insensitive comparison).

const PUZZLES = [
  {
    id: 'bridge',
    category: 'Logic · Deduction',
    difficulty: 2,
    title: 'The midnight bridge',
    prompt: [
      "Four travelers reach a narrow bridge at night. They share one flashlight, and at most two may cross at a time. Whoever crosses must carry the flashlight, and a pair walks at the slower person's pace.",
      "Their individual crossing times are 1, 2, 5, and 10 minutes.",
      "What is the minimum total time, in minutes, for all four to reach the other side?",
    ],
    input: { kind: 'choice', options: ['15', '17', '19', '21'] },
    answer: '17',
    hints: [
      "The 10-minute walker is your bottleneck — try to pair them with someone else slow.",
      "After two cross, somebody has to walk back with the flashlight. That return trip is wasted time. Minimize it.",
      "The 1- and 2-minute walkers are cheap couriers. Cross them first to stash the flashlight on the far side.",
    ],
  },
  {
    id: 'horses',
    category: 'Quant · Interview',
    difficulty: 3,
    title: '25 horses, no clock',
    prompt: [
      "You have 25 horses and a track that holds exactly 5 horses per race. There is no stopwatch — each race only tells you the finishing order of those 5.",
      "Assume every horse runs at a fixed, distinct speed.",
      "What is the minimum number of races needed to determine the three fastest horses overall?",
    ],
    input: { kind: 'numeric', min: 1, max: 25 },
    answer: '7',
    hints: [
      "Five races of 5 horses partition all 25 and give you a within-group ranking.",
      "A 6th race of the five group winners reveals the fastest horse overall — and lets you eliminate horses whose group leader is slow.",
      "After race 6 only seven horses can still be in the top 3. A single race ranks them.",
    ],
  },
  {
    id: 'looksay',
    category: 'Pattern · Sequence',
    difficulty: 2,
    title: 'Read the previous line',
    prompt: [
      "Each term in this sequence is built from the one that precedes it. The rule is consistent and uses no arithmetic.",
      "1,  11,  21,  1211,  111221,  312211,  ?",
      "What is the next term?",
    ],
    input: { kind: 'freetext', placeholder: 'type the next term' },
    answer: '13112221',
    hints: [
      "The sequence has nothing to do with addition or multiplication. Read each line aloud.",
      "Describe the previous line out loud: \"one 1\" becomes 11. \"two 1s\" becomes 21.",
      "Look at 312211. Say what you see: \"one 3, one 1, two 2s, two 1s.\"",
    ],
  },
];

// Normalize free-text answers: strip whitespace + punctuation + lowercase.
const norm = (s) => String(s).toLowerCase().replace(/[\s,.\-_]/g, '');

// Soft sine-wave chime. Two notes, ~250ms each, gentle attack/release. Reused
// for the correct-answer cue so the audio sits inside the brand.
const audioCtx = { ctx: null };
function chime(kind = 'correct') {
  try {
    if (!audioCtx.ctx) audioCtx.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx.ctx;
    if (ctx.state === 'suspended') ctx.resume();
    const notes = kind === 'correct' ? [659.25, 987.77] : kind === 'wrong' ? [220, 174.61] : [523.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.12, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.4);
    });
  } catch {}
}

// useTime — ticks once per second while running. Pauses on correct/skip so
// the timer reads as a record, not a stopwatch.
function useTimer(running) {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  React.useEffect(() => { if (!running) return; setT(0); }, [running]);
  return t;
}

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// nyDateKey — today's date in America/New_York as YYYY-MM-DD. Used as the
// localStorage cohort key so the "solved today" state automatically expires
// at midnight ET when a new puzzle drops.
function nyDateKey() {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const get = (t) => parts.find(p => p.type === t).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

// Write the day's outcome to localStorage so Landing (and anywhere else that
// listens) can flip into a "solved today" affordance. Wrapped in try/catch
// for Safari private mode.
function recordDaily(data) {
  try {
    localStorage.setItem('puddle.daily', JSON.stringify({ date: nyDateKey(), ...data }));
  } catch (e) {}
}

// PuzzleApp — single full-bleed puzzle page. All visuals come from `theme`;
// no hardcoded colors below the token layer.
function PuzzleApp({ theme: T, width, height, homeHref, puzzles = PUZZLES, issue, solutionHref, compact }) {
  // Mobile overrides — merged into T so all subcomponents see the smaller
  // values without prop drilling. We don't mutate the original theme.
  if (compact) {
    T = {
      ...T,
      pad: 18,
      measure: 560,
      headerGap: 12,
      tabGap: 14,
      choiceCols: 2,
      titleStyle:    { ...T.titleStyle,    fontSize: 30, letterSpacing: -0.4, lineHeight: 1.06 },
      promptStyle:   { ...T.promptStyle,   fontSize: 16.5, lineHeight: 1.55 },
      dataStyle:     { ...T.dataStyle,     fontSize: 18, padding: '12px 16px' },
      hintStyle:     { ...T.hintStyle,     fontSize: 14.5, padding: '12px 14px', borderRadius: 12 },
      choiceStyle:   { ...T.choiceStyle,   padding: '12px 14px', borderRadius: 12 },
      choiceValue:   { ...T.choiceValue,   fontSize: 19 },
      textInput:     { ...T.textInput,     fontSize: 20, padding: '12px 16px' },
      stepperInput:  { ...T.stepperInput,  fontSize: 24 },
      stepperBtn:    { ...T.stepperBtn,    width: 40 },
      kicker:        { ...T.kicker,        fontSize: 13 },
      primaryBtn:    { ...T.primaryBtn,    padding: '12px 20px', fontSize: 15 },
      ghostBtn:      { ...T.ghostBtn,      padding: '8px 12px', fontSize: 14 },
      successRing:   { ...T.successRing,   width: 48, height: 48 },
    };
  }

  const [idx, setIdx] = React.useState(0);
  const puzzle = puzzles[idx];

  const [answer, setAnswer] = React.useState('');
  const [status, setStatus] = React.useState('idle'); // idle | correct | wrong | revealed
  const [attempts, setAttempts] = React.useState(0);
  const [hintLevel, setHintLevel] = React.useState(0); // 0..hints.length
  const [streak, setStreak] = React.useState(2);
  const [xp, setXp] = React.useState(140);
  const [showScratch, setShowScratch] = React.useState(false);
  const [scratch, setScratch] = React.useState('');
  const [solved, setSolved] = React.useState({}); // {puzzleId: true}
  const [shaking, setShaking] = React.useState(false);
  const [burst, setBurst] = React.useState(0); // success-burst trigger

  const elapsed = useTimer(status !== 'correct' && status !== 'revealed');

  // Reset transient state when puzzle changes.
  React.useEffect(() => {
    setAnswer('');
    setStatus(solved[puzzle.id] ? 'correct' : 'idle');
    setAttempts(0);
    setHintLevel(0);
    setShaking(false);
  }, [idx]);

  const submit = () => {
    if (!answer.toString().trim()) return;
    if (norm(answer) === norm(puzzle.answer)) {
      setStatus('correct');
      setSolved((s) => ({ ...s, [puzzle.id]: true }));
      setStreak((s) => s + 1);
      setXp((x) => x + 40 + Math.max(0, 30 - elapsed) + (10 - hintLevel * 3));
      setBurst((b) => b + 1);
      chime('correct');
      recordDaily({
        state: 'solved',
        time: fmtTime(elapsed),
        hints: hintLevel,
        attempts: attempts + 1,
        title: puzzle.title,
        issueNo: issue ? issue.no : null,
      });
    } else {
      setStatus('wrong');
      setAttempts((a) => a + 1);
      setShaking(true);
      setTimeout(() => setShaking(false), 420);
      chime('wrong');
      // Soften wrong state back to idle so subsequent edits feel fresh.
      setTimeout(() => setStatus((s) => (s === 'wrong' ? 'idle' : s)), 1200);
    }
  };

  const reveal = () => { setHintLevel((h) => Math.min(h + 1, puzzle.hints.length)); chime('hint'); };
  const skip = () => {
    setStatus('revealed');
    chime('hint');
    recordDaily({
      state: 'revealed',
      title: puzzle.title,
      issueNo: issue ? issue.no : null,
      answer: puzzle.answer,
    });
  };

  const xpPct = (xp % 200) / 200;
  const level = Math.floor(xp / 200) + 1;
  const visibleHints = puzzle.hints.slice(0, hintLevel);

  // -----------------------------------------------------------------
  // STYLES — every visual value reads from T. Hover/focus refinements live
  // here too so theme deltas (e.g. dark mode) propagate without forks.
  // -----------------------------------------------------------------
  const root = {
    width, height, background: T.bg, color: T.text,
    fontFamily: T.fontBody, fontFeatureSettings: '"ss01","cv02"',
    boxSizing: 'border-box', position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  };

  // Three keyframes per theme are injected once via a scoped <style>: shake,
  // burst (success ring), and hintReveal. ID = themeId so dupes are skipped.
  const styleTag = (
    <style dangerouslySetInnerHTML={{ __html: `
      .pa-${T.id} *::selection { background: ${T.accent}; color: ${T.accentText}; }
      .pa-${T.id} { --ease: ${T.ease}; }
      @keyframes pa-${T.id}-shake {
        0%,100%{transform:translateX(0)}
        20%{transform:translateX(-6px)} 40%{transform:translateX(5px)}
        60%{transform:translateX(-3px)} 80%{transform:translateX(2px)}
      }
      @keyframes pa-${T.id}-pop { 0%{transform:scale(.6);opacity:0} 60%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
      @keyframes pa-${T.id}-ring { 0%{transform:scale(.4);opacity:.55} 100%{transform:scale(2.4);opacity:0} }
      @keyframes pa-${T.id}-reveal { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:translateY(0)} }
      @keyframes pa-${T.id}-glow { 0%{box-shadow:0 0 0 0 ${T.glow}} 70%{box-shadow:0 0 0 14px transparent} 100%{box-shadow:0 0 0 0 transparent} }
      @keyframes pa-${T.id}-bar { from{width:0%} to{width:var(--w)} }
      @keyframes pa-${T.id}-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
      .pa-${T.id} .pa-btn { transition: all .18s var(--ease); }
      .pa-${T.id} .pa-btn:hover:not(:disabled) { transform: translateY(-1px); }
      .pa-${T.id} .pa-btn:active:not(:disabled) { transform: translateY(0); }
      .pa-${T.id} .pa-input:focus { outline: none; ${T.inputFocus} }
      .pa-${T.id} .pa-choice:hover:not([data-locked]) { ${T.choiceHover} }
      .pa-${T.id} .pa-shake { animation: pa-${T.id}-shake .42s var(--ease); }
      .pa-${T.id} .pa-tab[data-active="true"]::after {
        content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:${T.accent};
      }
    ` }} />
  );

  return (
    <div className={`pa-${T.id}`} style={root}>
      {styleTag}

      {/* ════════ HEADER ════════ */}
      <Header T={T} streak={streak} xp={xp} xpPct={xpPct} level={level} elapsed={elapsed} homeHref={homeHref} issue={issue} compact={compact} />

      {/* ════════ PUZZLE NAV (hidden when only one puzzle) ════════ */}
      {puzzles.length > 1 && (
        <PuzzleTabs T={T} idx={idx} setIdx={setIdx} solved={solved} puzzles={puzzles} />
      )}

      {/* ════════ MAIN ════════ */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* puzzle body */}
        <div style={{
          flex: 1, padding: `${T.pad}px ${T.pad + 8}px ${T.pad - 4}px`,
          display: 'flex', flexDirection: 'column', minWidth: 0,
          position: 'relative',
        }}>
          {/* scrollable middle — head + prompt + hints. Pinning the input row
              at the bottom means revealing hints can never push controls off-screen. */}
          <div style={{
            flex: '1 1 auto', minHeight: 0, overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
            paddingRight: 4, marginRight: -4,
          }}>
            <PuzzleHead T={T} puzzle={puzzle} issue={issue} />

            <div style={{
              ...T.promptStyle,
              marginTop: 18, marginBottom: 22, flex: '0 0 auto',
              maxWidth: T.measure,
            }}>
              {puzzle.prompt.map((p, i) => {
                const isData = (puzzle.id === 'bridge' && i === 1) || (puzzle.id === 'looksay' && i === 1);
                return (
                  <p key={i} style={{
                    margin: '0 0 14px',
                    ...(isData ? T.dataStyle : null),
                  }}>{p}</p>
                );
              })}
            </div>

            {visibleHints.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18, maxWidth: T.measure }}>
                {visibleHints.map((h, i) => (
                  <div key={i} style={{
                    ...T.hintStyle,
                    animation: `pa-${T.id}-reveal .42s var(--ease) both`,
                  }}>
                    <span style={T.hintLabel}>Hint {i + 1}</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* pinned bottom block — input + actions stay on-screen no matter
              how many hints have been revealed. */}
          <div style={{ flexShrink: 0, paddingTop: 8 }}>
            <InputZone
              T={T} puzzle={puzzle} answer={answer} setAnswer={setAnswer}
              status={status} shaking={shaking} submit={submit} burst={burst}
              compact={compact}
            />

            <Actions
              T={T} puzzle={puzzle} status={status}
              hintLevel={hintLevel} reveal={reveal} skip={skip} submit={submit}
              answer={answer} attempts={attempts}
              showScratch={showScratch} setShowScratch={setShowScratch}
              compact={compact}
            />

            <PostSolve
              T={T} status={status}
              elapsed={elapsed} hintLevel={hintLevel} attempts={attempts}
              answer={puzzle.answer}
              solutionHref={solutionHref}
            />
          </div>
        </div>

        {/* scratchpad — slides in/out */}
        <Scratchpad T={T} open={showScratch} value={scratch} setValue={setScratch} onClose={() => setShowScratch(false)} />
      </div>
    </div>
  );
}

// =============================================================
// HEADER — logo, daily date, streak, XP bar
// =============================================================
function Header({ T, streak, xp, xpPct, level, elapsed, homeHref, issue, compact }) {
  const today = React.useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, []);
  // When mounted in a real page, the brand mark doubles as a "home" link;
  // in the design canvas (no homeHref) it stays inert.
  const LogoTag = homeHref ? 'a' : 'div';
  const logoProps = homeHref
    ? { href: homeHref, style: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, textDecoration: 'none', color: 'inherit', cursor: 'pointer' } }
    : { style: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 } };
  // Sub-line under the wordmark: prefer the issue dateline (Vol/No) when
  // provided, otherwise fall back to the localized date.
  const subText = issue
    ? <span>Vol. {issue.vol} <span style={{ color: T.accent }}>·</span> No. {issue.no}</span>
    : <span>Daily · {today}</span>;

  // ━━━ mobile header ━━━
  // Drop the XP bar entirely (level becomes a small chip), shrink the
  // logo wordmark, and inline-collapse the metrics into a single right cluster.
  if (compact) {
    return (
      <div style={{
        padding: `12px ${T.pad}px 10px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, borderBottom: `1px solid ${T.border}`,
      }}>
        <LogoTag {...logoProps}>
          <div style={T.logoMark}>
            {T.logoCells
              ? T.logoCells.map((bg, i) => <span key={i} style={{ background: bg, display: 'block' }} />)
              : <span style={T.logoDot} />}
          </div>
          <div style={{ whiteSpace: 'nowrap', minWidth: 0 }}>
            <div style={{ ...T.logoText, fontSize: 18 }}>puddle</div>
            <div style={{ ...T.logoSub, fontSize: 11.5, marginTop: 0 }}>{subText}</div>
          </div>
        </LogoTag>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          fontFamily: T.fontDisplay, fontVariantNumeric: 'tabular-nums',
        }}>
          <span style={{ fontSize: 17, fontWeight: 500, color: T.text, letterSpacing: -0.2 }}>
            {fmtTime(elapsed)}
          </span>
          <span style={{ color: T.hairStrong || T.border }}>·</span>
          <span style={{ fontSize: 17, fontWeight: 500, color: T.text, letterSpacing: -0.2 }}>
            {streak}<span style={{ ...T.streakFlame, marginLeft: 3 }}>{T.streakIcon || '◆'}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: `${T.pad - 6}px ${T.pad + 8}px ${T.pad - 14}px`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 24, borderBottom: `1px solid ${T.border}`,
    }}>
      {/* logo */}
      <LogoTag {...logoProps}>
        <div style={T.logoMark}>
          {T.logoCells
            ? T.logoCells.map((bg, i) => <span key={i} style={{ background: bg, display: 'block' }} />)
            : <span style={T.logoDot} />}
        </div>
        <div style={{ whiteSpace: 'nowrap' }}>
          <div style={T.logoText}>puddle</div>
          <div style={T.logoSub}>{subText}</div>
        </div>
      </LogoTag>

      <div style={{ display: 'flex', alignItems: 'center', gap: T.headerGap, flexShrink: 0 }}>
        {/* timer pill */}
        <div style={{ ...T.metricStyle, whiteSpace: 'nowrap' }}>
          <span style={T.metricLabel}>Time</span>
          <span style={{ ...T.metricValue, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(elapsed)}</span>
        </div>
        {/* streak */}
        <div style={{ ...T.metricStyle, whiteSpace: 'nowrap' }}>
          <span style={T.metricLabel}>Streak</span>
          <span style={T.metricValue}>{streak}<span style={{ ...T.streakFlame }}> {T.streakIcon || '◆'}</span></span>
        </div>
        {/* xp bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 150 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
            <span style={T.metricLabel}>Lvl {level}</span>
            <span style={{ ...T.metricLabel, fontVariantNumeric: 'tabular-nums' }}>{xp % 200}/200</span>
          </div>
          <div style={T.xpTrack}>
            <div style={{
              ...T.xpFill,
              width: `${xpPct * 100}%`,
              transition: 'width .8s cubic-bezier(.22,.99,.32,1)',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// PUZZLE TABS — 3 puzzles
// =============================================================
function PuzzleTabs({ T, idx, setIdx, solved, puzzles = PUZZLES }) {
  return (
    <div style={{
      display: 'flex', gap: T.tabGap, padding: `0 ${T.pad + 8}px`,
      borderBottom: `1px solid ${T.border}`, alignItems: 'stretch',
    }}>
      {puzzles.map((p, i) => {
        const active = i === idx;
        const done = solved[p.id];
        return (
          <button key={p.id} className="pa-tab pa-btn" data-active={active}
            onClick={() => setIdx(i)}
            style={{
              ...T.tabStyle,
              opacity: active ? 1 : 0.62,
              color: active ? T.text : T.textMuted,
              position: 'relative',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'left',
              minWidth: 0,
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ ...T.tabIdx, flexShrink: 0 }}>0{i + 1}</span>
              <span style={T.tabTitle}>{p.title}</span>
              {done && <span style={{ ...T.tabCheck, flexShrink: 0 }}>✓</span>}
            </div>
            <div style={T.tabCategory}>{p.category}</div>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================
// PUZZLE HEAD — category, difficulty dots, title
// =============================================================
function PuzzleHead({ T, puzzle }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <span style={T.kicker}>{puzzle.category}</span>
        <span style={T.dotSep}>·</span>
        <span style={T.difficultyLine}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} style={{
              ...T.diffDot,
              opacity: n <= puzzle.difficulty ? 1 : 0.18,
            }} />
          ))}
          <span style={T.difficultyLabel}>{['', 'gentle', 'medium', 'hard', 'spicy', 'wicked'][puzzle.difficulty]}</span>
        </span>
      </div>
      <h1 style={T.titleStyle}>{puzzle.title}</h1>
    </div>
  );
}

// =============================================================
// INPUT — choice | numeric | freetext, with shake + success ring
// =============================================================
function InputZone({ T, puzzle, answer, setAnswer, status, shaking, submit, burst, compact }) {
  const locked = status === 'correct' || status === 'revealed';
  const kind = puzzle.input.kind;

  return (
    <div style={{
      position: 'relative', maxWidth: T.measure, width: '100%',
    }}>
      <div className={shaking ? 'pa-shake' : ''}
        style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          opacity: status === 'revealed' ? 0.7 : 1,
        }}>
        {kind === 'choice' && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${T.choiceCols || 4}, 1fr)`, gap: 10 }}>
            {puzzle.input.options.map((opt, i) => {
              const picked = answer === opt;
              const isCorrect = locked && norm(opt) === norm(puzzle.answer);
              return (
                <button key={opt} className="pa-btn pa-choice" data-locked={locked || undefined}
                  onClick={() => !locked && setAnswer(opt)}
                  style={{
                    ...T.choiceStyle,
                    ...(picked && !isCorrect ? T.choiceActive : null),
                    ...(isCorrect ? T.choiceCorrect : null),
                    cursor: locked ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                  }}>
                  <span style={T.choiceKey}>{String.fromCharCode(65 + i)}</span>
                  <span style={T.choiceValue}>{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {kind === 'numeric' && (
          <NumericStepper T={T} value={answer} onChange={setAnswer} locked={locked}
            min={puzzle.input.min} max={puzzle.input.max} />
        )}

        {kind === 'freetext' && (
          <input type="text" className="pa-input"
            value={answer} disabled={locked}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder={puzzle.input.placeholder}
            style={{
              ...T.textInput,
              fontFamily: T.fontMono,
            }} />
        )}
      </div>

      {/* success ring + label */}
      {status === 'correct' && (
        <div key={burst} style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            ...T.successRing,
            animation: `pa-${T.id}-ring .9s var(--ease) both`,
          }} />
        </div>
      )}

      <SubmitStatus T={T} status={status} answer={puzzle.answer} />
    </div>
  );
}

function NumericStepper({ T, value, onChange, locked, min = 0, max = 999 }) {
  const num = value === '' ? '' : parseInt(value, 10);
  const set = (n) => onChange(String(Math.max(min, Math.min(max, n))));
  return (
    <div style={T.stepperWrap}>
      <button className="pa-btn" disabled={locked} onClick={() => set((num || 0) - 1)} style={T.stepperBtn}>−</button>
      <input type="text" inputMode="numeric" className="pa-input"
        value={value} disabled={locked}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder="—"
        style={T.stepperInput} />
      <button className="pa-btn" disabled={locked} onClick={() => set((num || 0) + 1)} style={T.stepperBtn}>+</button>
    </div>
  );
}

function SubmitStatus({ T, status, answer }) {
  if (status === 'correct') return (
    <div style={{ ...T.statusLine, color: T.success, animation: `pa-${T.id}-pop .5s var(--ease) both` }}>
      <span style={{ ...T.checkBubble, background: T.success }}>✓</span>
      <span>Nicely done.</span>
    </div>
  );
  if (status === 'revealed') return (
    <div style={{ ...T.statusLine, color: T.textMuted }}>
      <span>Answer was <strong style={{ color: T.text }}>{answer}</strong>.</span>
    </div>
  );
  return <div style={{ ...T.statusLine, opacity: 0, height: 22 }}>·</div>;
}

// =============================================================
// ACTIONS — hint, skip, scratchpad, submit
// =============================================================
function Actions({ T, puzzle, status, hintLevel, reveal, skip, submit, answer, attempts, showScratch, setShowScratch, compact }) {
  const solved = status === 'correct' || status === 'revealed';
  const allHints = hintLevel >= puzzle.hints.length;
  return (
    <div style={{
      marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${T.border}`,
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    }}>
      <button className="pa-btn" onClick={reveal} disabled={allHints || solved}
        style={{ ...T.ghostBtn, opacity: allHints || solved ? 0.4 : 1, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
        <span style={T.hintIcon}>◐</span>
        <span>Hint {hintLevel}/{puzzle.hints.length}</span>
        <span style={T.btnNote}>· free</span>
      </button>

      <button className="pa-btn" onClick={() => setShowScratch((v) => !v)}
        style={{ ...T.ghostBtn, fontFamily: 'inherit', whiteSpace: 'nowrap', display: compact ? 'none' : null, ...(showScratch ? T.ghostBtnActive : null) }}>
        <span>Notes</span>
      </button>

      <button className="pa-btn" onClick={skip} disabled={solved}
        style={{ ...T.ghostBtn, opacity: solved ? 0.4 : 1, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
        <span>Give up</span>
      </button>

      <div style={{ flex: 1 }} />

      {attempts > 0 && status !== 'correct' && (
        <span style={{ ...T.attemptsLabel, marginRight: 4 }}>{attempts} {attempts === 1 ? 'try' : 'tries'}</span>
      )}

      <button className="pa-btn" onClick={submit}
        disabled={!answer.toString().trim() || solved}
        style={{
          ...T.primaryBtn,
          opacity: !answer.toString().trim() || solved ? 0.45 : 1,
          fontFamily: 'inherit',
        }}>
        {solved ? '✓ Solved' : 'Check answer'}
      </button>
    </div>
  );
}

// =============================================================
// POST-SOLVE — appears after status flips to correct/revealed; gives the
// solver a summary line plus a link to the worked-solution walkthrough.
// =============================================================
function PostSolve({ T, status, elapsed, hintLevel, attempts, answer, solutionHref }) {
  if (status !== 'correct' && status !== 'revealed') return null;
  if (!solutionHref) return null;

  const params = new URLSearchParams();
  params.set('from', status === 'correct' ? 'solved' : 'revealed');
  if (status === 'correct') {
    params.set('time', fmtTime(elapsed));
    params.set('hints', String(hintLevel));
  }
  const href = `${solutionHref}?${params.toString()}`;

  const lineCorrect = (
    <>
      Solved in <strong style={{ color: T.text, fontWeight: 500 }}>{fmtTime(elapsed)}</strong>
      {' · '}
      {hintLevel === 0
        ? <span>unaided</span>
        : <span><strong style={{ color: T.text, fontWeight: 500 }}>{hintLevel}</strong> hint{hintLevel === 1 ? '' : 's'}</span>}
      {attempts > 0 && (
        <>
          {' · '}
          <strong style={{ color: T.text, fontWeight: 500 }}>{attempts}</strong> {attempts === 1 ? 'try' : 'tries'}
        </>
      )}
    </>
  );
  const lineRevealed = (
    <>The answer was <strong style={{ color: T.text, fontWeight: 500 }}>{answer}</strong>.</>
  );

  return (
    <div style={{
      marginTop: 14,
      padding: '16px 22px',
      background: T.surface,
      borderRadius: 14,
      boxShadow: '0 1px 2px rgba(58,47,34,.05), 0 4px 16px rgba(58,47,34,.06)',
      display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
      animation: `pa-${T.id}-reveal .5s var(--ease) both`,
    }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{
          fontFamily: T.fontDisplay,
          fontSize: 19, fontWeight: 500,
          color: status === 'correct' ? T.success : T.text,
          marginBottom: 4,
          letterSpacing: -0.2,
        }}>
          {status === 'correct' ? 'Nicely done.' : 'See you tomorrow.'}
        </div>
        <div style={{
          fontSize: 14.5,
          color: T.textMuted,
          fontStyle: 'italic',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {status === 'correct' ? lineCorrect : lineRevealed}
        </div>
      </div>
      <a href={href} style={{
        ...T.primaryBtn,
        textDecoration: 'none',
        fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        whiteSpace: 'nowrap',
      }}>
        <span>Read the worked solution</span>
        <span>→</span>
      </a>
    </div>
  );
}

// =============================================================
// SCRATCHPAD — slide-in column
// =============================================================
function Scratchpad({ T, open, value, setValue, onClose }) {
  return (
    <div style={{
      width: open ? 260 : 0,
      flexShrink: 0,
      borderLeft: open ? `1px solid ${T.border}` : 'none',
      background: T.surfaceAlt,
      transition: 'width .35s cubic-bezier(.22,.99,.32,1)',
      overflow: 'hidden',
    }}>
      <div style={{ width: 260, height: '100%', padding: 18, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={T.scratchTitle}>Scratch</span>
          <button onClick={onClose} style={{ ...T.iconBtn, fontFamily: 'inherit' }}>×</button>
        </div>
        <textarea value={value} onChange={(e) => setValue(e.target.value)}
          placeholder="Think out loud…"
          style={{
            flex: 1, resize: 'none', width: '100%', boxSizing: 'border-box',
            border: 'none', outline: 'none', background: 'transparent',
            color: T.text, fontFamily: T.fontMono, fontSize: 12.5, lineHeight: 1.55,
          }} />
      </div>
    </div>
  );
}

Object.assign(window, { PuzzleApp, PUZZLES });
