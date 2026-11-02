(() => {
  'use strict';

  const S = window.SCENARIOS;
  const app = document.getElementById('app');
  const STORE = 'missing-piece-v1';
  const ROUND_SECONDS = 6 * 60;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Seeded dealing ----------
     A game code encodes the scenario (G/W), the team size (4/5) and 4 random
     characters. Every device that knows the code deals the same roles, so
     players can join on their own phones without a server. */
  const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  function makeCode(scenarioId, size) {
    let r = '';
    const buf = new Uint32Array(4);
    crypto.getRandomValues(buf);
    for (const n of buf) r += ALPHABET[n % ALPHABET.length];
    return S[scenarioId].letter + size + r;
  }

  function parseCode(raw) {
    const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 6) return null;
    const scenario = Object.values(S).find((s) => s.letter === code[0]);
    const size = Number(code[1]);
    if (!scenario || (size !== 4 && size !== 5)) return null;
    for (const ch of code.slice(2)) if (!ALPHABET.includes(ch)) return null;
    return { code, scenarioId: scenario.id, size };
  }

  function prettyCode(code) {
    return code.slice(0, 2) + ' ' + code.slice(2);
  }

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Roles in player order: deal(code)[0] is Player 1's role. */
  function deal(code) {
    const p = parseCode(code);
    const roles = S[p.scenarioId].roles.filter((r) => p.size === 5 || r.seat !== 2);
    const rand = mulberry32(hash(p.code));
    const out = roles.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /* ---------- State ---------- */
  const fresh = () => ({
    screen: 'home',
    scenarioId: 'gym',
    size: 5,
    mode: 'pass',
    names: ['', '', '', '', ''],
    code: null,
    dealIndex: 0,
    shown: false,
    round: 1,
    played: [],
    timer: { remaining: ROUND_SECONDS, endsAt: null },
    found: {},
    nudge: false,
    // player-on-own-phone view
    joinCode: '',
    joinError: '',
    player: null,
    showBrief: false,
  });

  let state = load() || fresh();

  function load() {
    try {
      const s = JSON.parse(sessionStorage.getItem(STORE));
      return s && s.screen ? { ...fresh(), ...s } : null;
    } catch { return null; }
  }
  function save() {
    try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch {}
  }

  function set(patch, opts = {}) {
    state = { ...state, ...patch };
    save();
    render(opts);
  }

  /* ---------- Small helpers ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const scenario = () => S[state.scenarioId];
  const playerName = (i) => (state.names[i] || '').trim() || `Player ${i + 1}`;
  const otherScenario = (id) => (id === 'gym' ? 'welcome' : 'gym');
  const fmt = (sec) => {
    const s = Math.max(0, Math.ceil(sec));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const PIECE_PATH = 'M20 30H40C40 20 45 12 50 12S60 20 60 30H80V50C90 50 98 55 98 60S90 70 80 70V90H20V70C30 70 35 65 35 60S30 50 20 50Z';
  const piece = (cls = '') => `<svg class="piece ${cls}" viewBox="14 8 88 86" aria-hidden="true" focusable="false"><path d="${PIECE_PATH}"/></svg>`;

  /* ---------- Card ---------- */
  function cardFront(role, sc, playerLabel) {
    const quiet = role.rule.type === 'ask';
    const rule = quiet
      ? `<p class="rule rule--ask">Only share if someone asks about ${esc(role.rule.topic)}</p>`
      : `<p class="rule rule--free">Speak freely</p>`;
    const art = role.image
      ? `<img src="${esc(role.image)}" alt="" width="640" height="640" decoding="async">`
      : piece('piece--art');
    const visual = (role.visual || []).map((v) => `<li>${esc(v)}</li>`).join('');
    return `
      <article class="card seat-${role.seat}" aria-label="Your role card: ${esc(role.name)}">
        <header class="card__head">
          <div class="card__headtext">
            <p class="card__meta">${esc(playerLabel)} · Seat ${role.seat}</p>
            <h2 class="card__role">${esc(role.name)}</h2>
            <p class="card__blurb">${esc(role.blurb)}</p>
          </div>
          <div class="card__art">${art}</div>
        </header>
        <div class="card__body">
          ${role.does ? `<section class="card__does"><h3>What this role does</h3><p>${esc(role.does)}</p></section>` : ''}
          <section class="card__info">
            <h3>Your information</h3>
            <p>${esc(role.info)}</p>
          </section>
          ${visual ? `<div class="card__visual"><h3>Quick visual</h3><ol>${visual}</ol></div>` : ''}
          ${rule}
        </div>
      </article>`;
  }

  function cardBack() {
    return `
      <div class="card card--back" aria-hidden="true">
        <div class="card__pattern">${piece()}${piece()}${piece()}${piece()}</div>
        <p class="card__backtitle">The Missing Piece</p>
      </div>`;
  }

  function flipCard(role, sc, label, shown) {
    return `
      <div class="flip ${shown ? 'is-shown' : ''}">
        <div class="flip__inner">
          <div class="flip__face flip__face--back" ${shown ? 'aria-hidden="true"' : ''}>${cardBack()}</div>
          <div class="flip__face flip__face--front" ${shown ? '' : 'aria-hidden="true" inert'}>${cardFront(role, sc, label)}</div>
        </div>
      </div>`;
  }

  /* ---------- Shell ---------- */
  function shell(inner, { tone = 'light', status = '' } = {}) {
    return `
      <div class="shell shell--${tone}">
        <header class="bar">
          <button class="wordmark" data-action="home" aria-label="The Missing Piece, back to start">
            ${piece('piece--mark')}<span>The Missing Piece</span>
          </button>
          ${status ? `<p class="bar__status">${status}</p>` : ''}
        </header>
        <main class="main" id="main" tabindex="-1">${inner}</main>
      </div>`;
  }

  /* ---------- Screens ---------- */
  const screens = {
    home() {
      return shell(`
        <section class="hero">
          <div class="hero__text">
            <h1>The Missing Piece</h1>
            <p class="lead">A 6-minute team game about collaboration across difference. Every role is dealt at random. The senior voices hold a confident plan; the quiet ones hold what the team actually needs, and can only share it if someone asks.</p>
            <div class="actions">
              <button class="btn btn--primary" data-action="go" data-to="setup">Run a game</button>
              <button class="btn btn--ghost" data-action="go" data-to="join">Join with a code</button>
            </div>
          </div>
          <div class="hero__cards" aria-hidden="true">
            <div class="fan">
              <div class="fan__card fan__card--a">${cardFront(S.gym.roles[0], S.gym, 'Your role')}</div>
              <div class="fan__card fan__card--b">${cardFront(S.gym.roles[2], S.gym, 'Your role')}</div>
            </div>
          </div>
        </section>
        <section class="how">
          <h2>How a round works</h2>
          <ol class="steps">
            <li><strong>Deal.</strong> Pass one device around, or let everyone open their card on their own phone with a game code. Roles are random each round.</li>
            <li><strong>Brief.</strong> Read the client brief aloud and start the 6-minute timer.</li>
            <li><strong>Plan.</strong> The team agrees on one plan. Quiet roles can only share their piece when someone asks about their topic.</li>
            <li><strong>Reveal.</strong> Slot in each missing piece the final plan included. One point per piece, then debrief.</li>
          </ol>
          <p class="note">Unit MQBS2010 · Lens: collaboration across difference: inclusive facilitation, conflict resolution, valuing diverse expertise. <a href="missing-piece-cards.pdf">Printable cards (PDF)</a></p>
        </section>`);
    },

    setup() {
      const opt = (name, value, label, desc, checked) => `
        <label class="choice">
          <input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''} data-action="field">
          <span class="choice__box"><strong>${label}</strong>${desc ? `<span>${desc}</span>` : ''}</span>
        </label>`;
      const names = Array.from({ length: state.size }, (_, i) => `
        <label class="namefield"><span>Player ${i + 1}</span>
          <input type="text" maxlength="24" autocomplete="off" data-action="name" data-i="${i}" value="${esc(state.names[i] || '')}" placeholder="Name (optional)">
        </label>`).join('');
      return shell(`
        <section class="panel">
          <h1>Set up round ${state.round}</h1>
          <form class="setup" data-form="setup">
            <fieldset>
              <legend>Scenario</legend>
              <div class="choices">
                ${opt('scenario', 'gym', S.gym.title, 'Marketing agency team', state.scenarioId === 'gym')}
                ${opt('scenario', 'welcome', S.welcome.title, 'Student experience team', state.scenarioId === 'welcome')}
              </div>
            </fieldset>
            <fieldset>
              <legend>Team size</legend>
              <div class="choices choices--row">
                ${opt('size', '5', '5 players', 'Every role', state.size === 5)}
                ${opt('size', '4', '4 players', 'Seat 2 sits out', state.size === 4)}
              </div>
            </fieldset>
            <fieldset>
              <legend>How to deal</legend>
              <div class="choices choices--row">
                ${opt('mode', 'pass', 'Pass one device', 'Each player peeks, then passes it on', state.mode === 'pass')}
                ${opt('mode', 'phones', 'Everyone’s own phone', 'Players join with a game code', state.mode === 'phones')}
              </div>
            </fieldset>
            ${state.mode === 'pass' ? `<fieldset><legend>Player names</legend><div class="names">${names}</div></fieldset>` : ''}
            <div class="actions">
              <button type="submit" class="btn btn--primary">Deal random roles</button>
              <button type="button" class="btn btn--ghost" data-action="home">Back</button>
            </div>
          </form>
        </section>`);
    },

    deal() {
      const roles = deal(state.code);
      const sc = scenario();
      const i = state.dealIndex;
      if (i >= roles.length) {
        return shell(`
          <section class="panel center">
            ${piece('piece--big')}
            <h1>All ${roles.length} cards dealt</h1>
            <p class="lead">Hand the device back to the facilitator. Keep your card to yourself and follow its rule.</p>
            <div class="actions actions--center">
              <button class="btn btn--primary" data-action="go" data-to="brief">Read the brief</button>
            </div>
          </section>`, { status: `Round ${state.round}` });
      }
      const who = playerName(i);
      return shell(`
        <section class="deal">
          <div class="deal__text">
            <p class="deal__count">Card ${i + 1} of ${roles.length}</p>
            <h1>${state.shown ? `${esc(who)}, this is your card` : `Pass the device to ${esc(who)}`}</h1>
            <p class="lead">${state.shown ? 'Remember your information and your rule. Hide the card before you pass it on.' : 'Everyone else, look away. Only tap once the device is in the right hands.'}</p>
            <div class="actions">
              ${state.shown
                ? `<button class="btn btn--primary" data-action="next-card">${i + 1 < roles.length ? 'Hide card and pass on' : 'Hide card'}</button>`
                : `<button class="btn btn--primary" data-action="show-card">I’m ${esc(who)}, show my card</button>`}
            </div>
          </div>
          <div class="deal__card">${flipCard(roles[i], sc, who, state.shown)}</div>
        </section>`, { status: `Round ${state.round} · ${esc(sc.short)}` });
    },

    lobby() {
      const sc = scenario();
      const link = `${location.origin}${location.pathname}#join=${state.code}`;
      return shell(`
        <section class="lobby">
          <div>
            <h1>Join this game</h1>
            <p class="lead">Everyone opens this site on their phone, taps <strong>Join with a code</strong>, enters the code and picks their own player number. Count off around the table first so nobody shares a number.</p>
            <p class="lobby__link">Or share the link: <a href="${esc(link)}">${esc(link)}</a></p>
            <div class="actions">
              <button class="btn btn--primary" data-action="go" data-to="brief">Everyone has a card: read the brief</button>
              <button class="btn btn--ghost" data-action="copy-link" data-link="${esc(link)}">Copy link</button>
            </div>
          </div>
          <div class="codebox">
            <p>Game code</p>
            <p class="codebox__code">${prettyCode(state.code)}</p>
            <p>${esc(sc.short)} · players 1 to ${state.size}</p>
          </div>
        </section>`, { tone: 'dark', status: `Round ${state.round}` });
    },

    brief() {
      const sc = scenario();
      const t = state.timer;
      const remaining = t.endsAt ? (t.endsAt - Date.now()) / 1000 : t.remaining;
      const running = !!t.endsAt;
      const done = remaining <= 0;
      return shell(`
        <section class="brief">
          <div class="brief__text">
            ${sc.image ? `<img class="brief__img" src="${esc(sc.image)}" alt="" width="640" height="640">` : ''}
            <p class="brief__kicker">Client brief. Read it aloud to the team.</p>
            <h1>${esc(sc.title)}</h1>
            <p class="lead">${esc(sc.team)} In 6 minutes, agree on one plan covering:</p>
            <ul class="asks">${sc.asks.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
            <p class="lead">Each person holds one piece of information. Keep your card private and follow the rule on it.</p>
          </div>
          <div class="timer ${done ? 'is-done' : remaining <= 60.5 ? 'is-final' : ''}">
            <p class="timer__time" role="timer" aria-label="Time left" id="clock">${fmt(remaining)}</p>
            <p class="sr-only" aria-live="polite" id="clock-live"></p>
            <div class="actions actions--center">
              ${done
                ? `<button class="btn btn--accent" data-action="go" data-to="reveal">Time’s up: reveal the pieces</button>`
                : `<button class="btn btn--accent" data-action="${running ? 'pause' : 'start'}">${running ? 'Pause' : remaining < ROUND_SECONDS ? 'Resume' : 'Start 6 minutes'}</button>
                   <button class="btn btn--ghost-dark" data-action="add-minute">+1 minute</button>`}
            </div>
            ${!done ? `<button class="linkbtn" data-action="go" data-to="reveal">We’ve agreed early: reveal now</button>` : ''}
            ${state.nudge
              ? `<p class="nudge" role="status">Before you decide: has every person been asked what they know?</p>`
              : `<button class="linkbtn" data-action="nudge">Show the facilitator nudge</button>`}
          </div>
        </section>`, { tone: 'dark', status: `Round ${state.round} · ${esc(sc.short)}` });
    },

    reveal() {
      const sc = scenario();
      const roles = deal(state.code);
      const hidden = roles.map((r, i) => ({ r, i })).filter(({ r }) => r.piece);
      const score = hidden.filter(({ r }) => state.found[r.seat]).length;
      const items = hidden.map(({ r, i }) => {
        const on = !!state.found[r.seat];
        return `
          <li class="slot ${on ? 'is-found' : ''}">
            <button class="slot__btn" data-action="toggle-piece" data-seat="${r.seat}" aria-pressed="${on}">
              ${piece('piece--slot')}
              <span class="slot__text">
                <strong>${esc(r.piece.label)}</strong>
                <span>${esc(r.info)}</span>
                <span class="slot__who">Held by ${esc(state.mode === 'pass' ? playerName(i) : `Player ${i + 1}`)}, the ${esc(r.name)}. The question that unlocks it: ${esc(r.piece.unlock)}</span>
              </span>
              <span class="slot__state">${on ? 'In the plan' : 'Missed'}</span>
            </button>
          </li>`;
      }).join('');
      return shell(`
        <section class="reveal">
          <div class="reveal__head">
            <h1>Which pieces made it into the plan?</h1>
            <p class="lead">Ask the team to read out their final plan. Tap each piece it included.</p>
          </div>
          <p class="score" aria-live="polite"><span class="score__n">${score}</span> of ${hidden.length} pieces found</p>
          <ol class="slots">${items}</ol>
          <div class="full">
            <h2>The full picture</h2>
            <p>${esc(sc.fullPicture)}</p>
          </div>
          <div class="actions">
            <button class="btn btn--primary" data-action="go" data-to="debrief">Debrief</button>
          </div>
        </section>`, { status: `Round ${state.round} · ${esc(sc.short)}` });
    },

    debrief() {
      const sc = scenario();
      const roles = deal(state.code);
      const senior = sc.roles[0].name;
      const seat2 = sc.roles[1].name;
      const hidden = roles.filter((r) => r.piece);
      const score = hidden.filter((r) => state.found[r.seat]).length;
      const qs = state.round === 1
        ? [
            'Who spoke most? Who was asked for their view?',
            `You found ${score} of ${hidden.length} pieces. What question would have uncovered the rest?`,
            `The ${senior} had the final say. How did that shape the conversation?`,
            state.size === 5 ? `The ${seat2}’s plan used the whole budget. How did the team handle the conflict when new information came up?` : null,
            'Where does this happen in real workplaces or uni group work?',
          ]
        : [
            'What did your team do differently this round?',
            'Did anyone ask each person “What do you know that we don’t?” When did it happen?',
            `You found ${score} of ${hidden.length} pieces. Which one was hardest to draw out, and why?`,
            `How did the ${senior} use the final say this time?`,
            'What one habit will you take into your next group assignment?',
          ];
      const next = otherScenario(state.scenarioId);
      return shell(`
        <section class="debrief">
          <div class="debrief__side">
            <h1>Debrief</h1>
            <p class="lead">Hierarchy and confidence can hide expertise. A team finds the missing pieces by asking questions and drawing out quieter members.</p>
          <div class="actions">
            ${state.round === 1
              ? `<button class="btn btn--primary" data-action="round2" data-next="${next}">Play round 2: ${esc(S[next].short)}, new roles</button>`
              : `<button class="btn btn--primary" data-action="round2" data-next="${next}">Play another round</button>`}
            <button class="btn btn--ghost" data-action="reset">Finish</button>
          </div>
          </div>
          <ol class="questions">${qs.filter(Boolean).map((q) => `<li>${esc(q)}</li>`).join('')}</ol>
        </section>`, { status: `Round ${state.round} · ${esc(sc.short)}` });
    },

    join() {
      const parsed = parseCode(state.joinCode);
      const numbers = parsed
        ? `<fieldset><legend>Your player number</legend><div class="numbers">${Array.from({ length: parsed.size }, (_, i) =>
            `<button type="button" class="num" data-action="pick-player" data-n="${i}">${i + 1}</button>`).join('')}</div></fieldset>`
        : '';
      return shell(`
        <section class="panel narrow">
          <h1>Join a game</h1>
          <p class="lead">Your facilitator has the code on their screen.</p>
          <form data-form="join" class="join" novalidate>
            <label for="code" class="field-label">Game code</label>
            <input id="code" class="codeinput" name="code" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false"
              maxlength="8" value="${esc(state.joinCode)}" placeholder="G5 ABCD" aria-describedby="code-help" data-action="joincode">
            <p id="code-help" class="help ${state.joinError ? 'help--error' : ''}" ${state.joinError ? 'role="alert"' : ''}>${esc(state.joinError || '6 characters, for example G5 KQ7X')}</p>
            ${numbers}
          </form>
        </section>`);
    },

    player() {
      const p = parseCode(state.joinCode);
      if (!p || state.player == null) return screens.join();
      const sc = S[p.scenarioId];
      const role = deal(p.code)[state.player];
      return shell(`
        <section class="deal deal--player">
          <div class="deal__text">
            <p class="deal__count">${esc(sc.short)} · game ${prettyCode(p.code)}</p>
            <h1>Player ${state.player + 1}</h1>
            <p class="lead">${state.shown ? 'Remember your information and your rule. Keep your screen to yourself.' : 'Tap to see your role. Make sure nobody is looking at your screen.'}</p>
            <div class="actions">
              <button class="btn btn--primary" data-action="${state.shown ? 'hide-card' : 'show-card'}">${state.shown ? 'Hide my card' : 'Show my card'}</button>
              <button class="btn btn--ghost" data-action="toggle-brief" aria-expanded="${state.showBrief}">${state.showBrief ? 'Hide the brief' : 'Read the brief'}</button>
            </div>
          </div>
          <div class="deal__card">${flipCard(role, sc, `Player ${state.player + 1}`, state.shown)}</div>
          <div class="deal__extra">
            ${state.showBrief ? `<div class="minibrief"><h2>${esc(sc.title)}</h2><p>${esc(sc.team)} Agree on one plan covering:</p><ul class="asks">${sc.asks.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}
            <button class="linkbtn linkbtn--ink" data-action="leave">Wrong number or code? Change it</button>
          </div>
        </section>`);
    },
  };

  /* ---------- Render ---------- */
  let lastScreen = null;
  function render({ focus = false } = {}) {
    const fn = screens[state.screen] || screens.home;
    app.innerHTML = fn();
    if (state.screen !== lastScreen) {
      lastScreen = state.screen;
      window.scrollTo(0, 0);
      const h = app.querySelector('h1');
      if (h && focus !== 'none') { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    } else if (typeof focus === 'string') {
      app.querySelector(focus)?.focus();
    }
    syncTimer();
  }

  /* ---------- Timer ---------- */
  let tick = null;
  let wakeLock = null;
  let lastAnnounced = null;

  function syncTimer() {
    const running = state.screen === 'brief' && state.timer.endsAt;
    if (running && !tick) tick = setInterval(onTick, 250);
    if (!running && tick) { clearInterval(tick); tick = null; }
    if (running) requestWake(); else releaseWake();
  }

  function onTick() {
    const left = (state.timer.endsAt - Date.now()) / 1000;
    const clock = document.getElementById('clock');
    if (left <= 0) {
      state.timer = { remaining: 0, endsAt: null };
      save();
      chime();
      render({ focus: 'none' });
      document.getElementById('clock-live').textContent = 'Time is up.';
      return;
    }
    if (clock) clock.textContent = fmt(left);
    const mins = Math.ceil(left / 60);
    if (left <= 60.5 && lastAnnounced !== 'last') {
      lastAnnounced = 'last';
      const live = document.getElementById('clock-live');
      if (live) live.textContent = 'One minute left.';
      document.querySelector('.timer')?.classList.add('is-final');
    } else if (left > 60.5 && lastAnnounced !== mins && mins % 2 === 0) {
      lastAnnounced = mins;
    }
  }

  async function requestWake() {
    try { if (!wakeLock && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch {}
  }
  function releaseWake() {
    if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
  }

  function chime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.28, 0.56].forEach((t, k) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = [660, 660, 880][k];
        g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.24);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + t);
        o.stop(ctx.currentTime + t + 0.26);
      });
    } catch {}
    navigator.vibrate?.([200, 100, 200]);
  }

  /* ---------- Actions ---------- */
  function newRound(patch = {}) {
    const next = { ...state, ...patch };
    return {
      ...patch,
      code: makeCode(next.scenarioId, next.size),
      dealIndex: 0,
      shown: false,
      found: {},
      nudge: false,
      timer: { remaining: ROUND_SECONDS, endsAt: null },
      screen: next.mode === 'pass' ? 'deal' : 'lobby',
    };
  }

  let passing = false;
  const actions = {
    home: () => set({ screen: 'home', player: null, shown: false }),
    go: (el) => set({ screen: el.dataset.to, shown: false }),
    'show-card': () => set({ shown: true }, { focus: '.btn--primary' }),
    'hide-card': () => set({ shown: false }, { focus: '.btn--primary' }),
    'next-card': () => {
      if (passing) return; // a double tap must not skip a player
      passing = true;
      // Flip the card face-down first so it is never visible to the next player.
      set({ shown: false });
      setTimeout(() => {
        passing = false;
        set({ dealIndex: state.dealIndex + 1 }, { focus: '.btn--primary' });
      }, reduceMotion ? 0 : 420);
    },
    start: () => (lastAnnounced = null, set({ timer: { remaining: state.timer.remaining, endsAt: Date.now() + state.timer.remaining * 1000 } }, { focus: '.btn--accent' })),
    pause: () => {
      const left = Math.max(0, (state.timer.endsAt - Date.now()) / 1000);
      set({ timer: { remaining: left, endsAt: null } }, { focus: '.btn--accent' });
    },
    'add-minute': () => {
      const t = state.timer;
      set({ timer: t.endsAt ? { ...t, endsAt: t.endsAt + 60000 } : { ...t, remaining: t.remaining + 60 } });
    },
    nudge: () => set({ nudge: true }),
    'toggle-piece': (el) => {
      const seat = el.dataset.seat;
      set({ found: { ...state.found, [seat]: !state.found[seat] } }, { focus: `[data-seat="${seat}"]` });
    },
    round2: (el) => {
      const sid = el.dataset.next;
      set({ round: state.round + 1, played: [...state.played, state.scenarioId], scenarioId: sid, screen: 'setup' });
    },
    reset: () => { state = fresh(); save(); render(); },
    'pick-player': (el) => set({ player: Number(el.dataset.n), shown: false, screen: 'player' }),
    'toggle-brief': () => set({ showBrief: !state.showBrief }, { focus: '[data-action="toggle-brief"]' }),
    leave: () => set({ screen: 'join', player: null, shown: false }),
    'copy-link': async (el) => {
      try { await navigator.clipboard.writeText(el.dataset.link); el.textContent = 'Link copied'; } catch { el.textContent = 'Copy failed'; }
    },
  };

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.tagName === 'INPUT') return;
    const fn = actions[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el); }
  });

  app.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.action !== 'field') return;
    if (el.name === 'scenario') set({ scenarioId: el.value }, { focus: `input[name="scenario"][value="${el.value}"]` });
    if (el.name === 'size') set({ size: Number(el.value) }, { focus: `input[name="size"][value="${el.value}"]` });
    if (el.name === 'mode') set({ mode: el.value }, { focus: `input[name="mode"][value="${el.value}"]` });
  });

  app.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.action === 'name') {
      const names = state.names.slice();
      names[Number(el.dataset.i)] = el.value;
      state.names = names;
      save();
    }
    if (el.dataset.action === 'joincode') {
      const before = !!parseCode(state.joinCode);
      state.joinCode = el.value;
      const ok = parseCode(el.value);
      const clean = el.value.replace(/[^a-z0-9]/gi, '');
      state.joinError = clean.length >= 6 && !ok ? 'That code doesn’t match a game. Check it with your facilitator.' : '';
      save();
      if (before !== !!ok || state.joinError) {
        const pos = el.selectionStart;
        render({ focus: '#code' });
        const input = document.getElementById('code');
        input?.setSelectionRange(pos, pos);
      }
    }
  });

  app.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.dataset.form === 'setup') set(newRound());
  });

  /* ---------- Deep link: #join=CODE ---------- */
  function readHash() {
    const m = location.hash.match(/join=([A-Za-z0-9]+)/);
    if (m) {
      state = { ...state, screen: 'join', joinCode: m[1].toUpperCase(), player: null, shown: false, joinError: '' };
      history.replaceState(null, '', location.pathname);
      save();
    }
  }
  window.addEventListener('hashchange', () => { readHash(); render(); });

  readHash();
  render({ focus: 'none' });
})();
