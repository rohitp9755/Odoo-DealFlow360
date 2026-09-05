<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>DealFlow360 — self-governing sales ops</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</style>
  :root{
    --bg:#050607;
    --panel:#0c0f0d;
    --panel2:#111614;
    --line:#1e2b24;
    --line-bright:#2c463a;
    --green:#39ff88;
    --green-dim:#1c8a4c;
    --magenta:#ff2f9e;
    --amber:#ffc93c;
    --red:#ff4757;
    --ink:#e9fbf0;
    --ink-dim:#7fa693;
    --ink-dimmer:#3f5a4d;
    --mono:'JetBrains Mono', monospace;
    --display:'Space Grotesk', sans-serif;
    --body:'Inter', sans-serif;
  }
  *{margin:0; padding:0; box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  body{
    background:var(--bg); color:var(--ink); font-family:var(--body);
    overflow-x:hidden; position:relative; cursor:default;
  }
  ::selection{background:var(--green); color:#000;}

  .scanlines{
    position:fixed; inset:0; z-index:50; pointer-events:none;
    background:repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px);
    mix-blend-mode:multiply; opacity:0.5;
  }
  .grid-bg{
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:
      linear-gradient(rgba(57,255,136,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(57,255,136,0.05) 1px, transparent 1px);
    background-size:44px 44px;
    animation: gridDrift 18s linear infinite;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 20%, black 30%, transparent 90%);
  }
  @keyframes gridDrift{ from{background-position:0 0;} to{background-position:44px 44px;} }
  .vignette{
    position:fixed; inset:0; z-index:1; pointer-events:none;
    background:radial-gradient(ellipse at 50% 0%, transparent 40%, rgba(0,0,0,0.75) 100%);
  }
  #spotlight{
    position:fixed; z-index:2; pointer-events:none; width:520px; height:520px; border-radius:50%;
    background:radial-gradient(circle, rgba(57,255,136,0.10), transparent 65%);
    transform:translate(-50%,-50%); left:50%; top:30%; transition:background .3s;
    filter:blur(2px);
  }
  .noise{
    position:fixed; inset:0; z-index:49; pointer-events:none; opacity:0.035;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .ticker{
    position:relative; z-index:3; border-top:1px solid var(--line); border-bottom:1px solid var(--line);
    background:var(--panel); overflow:hidden; white-space:nowrap; padding:10px 0;
  }
  .ticker-track{display:inline-block; animation:tickerMove 26s linear infinite;}
  .ticker span{font-family:var(--mono); font-size:12.5px; color:var(--green); letter-spacing:0.04em; margin:0 28px;}
  .ticker span.dim{color:var(--ink-dimmer);}
  @keyframes tickerMove{ from{transform:translateX(0);} to{transform:translateX(-50%);} }

  header.hero{
    position:relative; z-index:3; min-height:92vh; display:flex; flex-direction:column;
    justify-content:center; align-items:flex-start; padding:60px 6vw; overflow:hidden;
  }
  .boot-line{font-family:var(--mono); font-size:12.5px; color:var(--green); margin-bottom:26px; display:flex; align-items:center; gap:10px;}
  .boot-line .cursor-blink{width:9px; height:16px; background:var(--green); animation:blink 1s step-end infinite;}
  @keyframes blink{0%,49%{opacity:1;}50%,100%{opacity:0;}}

  h1.glitch{
    font-family:var(--display); font-weight:700; letter-spacing:-0.02em;
    font-size:clamp(3rem, 9vw, 7.5rem); line-height:0.94; position:relative;
    color:var(--ink); text-shadow: 0 0 40px rgba(57,255,136,0.25);
  }
  h1.glitch::before, h1.glitch::after{
    content:attr(data-text); position:absolute; top:0; left:0; width:100%; overflow:hidden; background:var(--bg);
  }
  h1.glitch::before{ left:3px; text-shadow:-2px 0 var(--magenta); animation: glitchTop 5s infinite linear alternate-reverse; }
  h1.glitch::after{ left:-3px; text-shadow:2px 0 var(--green); animation: glitchBot 6.5s infinite linear alternate-reverse; }
  @keyframes glitchTop{
    0%,90%,100%{clip-path:inset(0 0 100% 0); opacity:0;}
    91%{clip-path:inset(10% 0 60% 0); opacity:1;}
    93%{clip-path:inset(40% 0 20% 0); opacity:1;}
    95%{clip-path:inset(0 0 100% 0); opacity:0;}
  }
  @keyframes glitchBot{
    0%,85%,100%{clip-path:inset(0 0 100% 0); opacity:0;}
    86%{clip-path:inset(60% 0 5% 0); opacity:1;}
    88%{clip-path:inset(20% 0 50% 0); opacity:1;}
    90%{clip-path:inset(0 0 100% 0); opacity:0;}
  }
  .hero-sub{margin-top:30px; max-width:600px; color:var(--ink-dim); font-size:1.1rem; line-height:1.65;}
  .hero-actions{margin-top:44px; display:flex; gap:16px; flex-wrap:wrap;}
  .btn{
    font-family:var(--mono); font-size:13.5px; padding:15px 26px; cursor:pointer; border-radius:2px;
    border:1px solid var(--line-bright); background:transparent; color:var(--ink); position:relative;
    transition:.2s all; text-transform:uppercase; letter-spacing:0.05em;
  }
  .btn.primary{background:var(--green); color:#031008; border-color:var(--green); font-weight:700;}
  .btn.primary:hover{box-shadow:0 0 0 1px var(--green), 0 0 40px rgba(57,255,136,0.5); transform:translateY(-2px);}
  .btn.ghost:hover{border-color:var(--magenta); color:var(--magenta); box-shadow:0 0 24px rgba(255,47,158,0.25);}

  section{position:relative; z-index:3; max-width:1180px; margin:0 auto; padding:130px 6vw;}
  .tag-eyebrow{
    display:inline-flex; align-items:center; gap:8px; font-family:var(--mono); font-size:11.5px;
    color:var(--magenta); border:1px solid rgba(255,47,158,0.35); padding:5px 12px; border-radius:20px;
    background:rgba(255,47,158,0.06);
  }
  .tag-eyebrow::before{content:"";width:6px;height:6px;background:var(--magenta);border-radius:50%; box-shadow:0 0 10px var(--magenta);}
  .section-head{margin-bottom:56px; max-width:680px;}
  .section-head h2{font-family:var(--display); font-size:clamp(2rem, 4.5vw, 3.1rem); margin-top:16px; letter-spacing:-0.01em; line-height:1.06;}
  .section-head p{color:var(--ink-dim); margin-top:16px; font-size:1.02rem;}

  .stat-row{display:grid; grid-template-columns:repeat(4,1fr); gap:2px; background:var(--line);}
  .stat{background:var(--panel); padding:30px 22px; position:relative; overflow:hidden;}
  .stat::before{content:"";position:absolute; inset:0; background:linear-gradient(120deg, transparent, rgba(57,255,136,0.06), transparent); transform:translateX(-100%); transition:.6s;}
  .stat:hover::before{transform:translateX(100%);}
  .stat .n{font-family:var(--display); font-size:2.4rem; color:var(--green); text-shadow:0 0 24px rgba(57,255,136,0.4);}
  .stat .l{font-family:var(--mono); font-size:0.78rem; color:var(--ink-dimmer); margin-top:6px; text-transform:uppercase;}

  .tilt-wrap{perspective:1400px;}
  .demo-panel{
    border:1px solid var(--line-bright); background:var(--panel);
    padding:40px; position:relative; overflow:hidden; transform-style:preserve-3d;
    transition:transform .15s ease-out; box-shadow:0 40px 80px -40px rgba(0,0,0,0.8);
  }
  .demo-panel::before{
    content:""; position:absolute; inset:-2px; z-index:-1; border-radius:2px;
    background:linear-gradient(120deg, var(--green), transparent 30%, transparent 70%, var(--magenta));
    opacity:0.25; filter:blur(18px);
  }
  .scanbeam{
    position:absolute; left:0; right:0; height:2px; background:linear-gradient(90deg, transparent, var(--green), transparent);
    animation:beamMove 3s linear infinite; opacity:0.5;
  }
  @keyframes beamMove{0%{top:0;}100%{top:100%;}}

  .demo-grid{display:grid; grid-template-columns:1.1fr 0.9fr; gap:44px; position:relative; z-index:1;}
  @media (max-width:820px){.demo-grid{grid-template-columns:1fr;}}
  .field-row{margin-bottom:28px;}
  .field-row label{display:flex; justify-content:space-between; font-family:var(--mono); font-size:12px; color:var(--ink-dim); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.04em;}
  .field-row label span.val{color:var(--green); font-weight:700;}
  select{width:100%; background:var(--panel2); border:1px solid var(--line-bright); color:var(--ink); padding:12px; border-radius:2px; font-family:var(--mono); font-size:13.5px;}
  input[type=range]{width:100%; -webkit-appearance:none; height:4px; background:var(--line-bright); outline:none;}
  input[type=range]::-webkit-slider-thumb{
    -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:var(--green); cursor:pointer;
    box-shadow:0 0 0 5px rgba(57,255,136,0.15), 0 0 18px rgba(57,255,136,0.7); transition:.15s transform;
  }
  input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.2);}

  .risk-readout{border:1px solid var(--line-bright); background:var(--panel2); padding:28px; display:flex; flex-direction:column; gap:20px;}
  .risk-score-wrap{display:flex; align-items:center; gap:22px;}
  .risk-dial{
    position:relative; width:104px; height:104px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-family:var(--display); font-size:1.9rem; font-weight:700;
    background:conic-gradient(var(--green) 0deg, var(--line) 0deg); transition:background .4s ease;
  }
  .risk-dial::before{content:""; position:absolute; inset:9px; background:var(--panel2); border-radius:50%;}
  .risk-dial span{position:relative; z-index:1;}
  .badge{display:inline-block; font-family:var(--mono); font-size:11.5px; padding:6px 12px; margin-bottom:9px; text-transform:uppercase; letter-spacing:0.04em; border:1px solid; border-radius:2px;}
  .badge.safe{color:var(--green); border-color:var(--green); background:rgba(57,255,136,0.08); box-shadow:0 0 16px rgba(57,255,136,0.2);}
  .badge.warn{color:var(--amber); border-color:var(--amber); background:rgba(255,201,60,0.08); box-shadow:0 0 16px rgba(255,201,60,0.2);}
  .badge.hot{color:var(--red); border-color:var(--red); background:rgba(255,71,87,0.1); box-shadow:0 0 16px rgba(255,71,87,0.3); animation:hotPulse 1s ease-in-out infinite;}
  @keyframes hotPulse{0%,100%{box-shadow:0 0 16px rgba(255,71,87,0.3);}50%{box-shadow:0 0 30px rgba(255,71,87,0.6);}}
  .reason{color:var(--ink-dim); font-size:13.5px; max-width:38ch; font-family:var(--mono);}
  .approval-path{display:flex; gap:8px; flex-wrap:wrap; font-family:var(--mono); font-size:11.5px; text-transform:uppercase;}
  .approval-step{padding:8px 13px; border:1px solid var(--line-bright); color:var(--ink-dimmer); transition:.3s all;}
  .approval-step.active{border-color:var(--magenta); color:var(--magenta); background:rgba(255,47,158,0.1); box-shadow:0 0 16px rgba(255,47,158,0.25);}
  .arrow{color:var(--ink-dimmer); align-self:center;}

  .feat-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:var(--line);}
  @media (max-width:900px){.feat-grid{grid-template-columns:1fr 1fr;}}
  @media (max-width:600px){.feat-grid{grid-template-columns:1fr;}}
  .feat{background:var(--panel); padding:28px 24px; transition:.25s all; position:relative; cursor:default;}
  .feat:hover{background:var(--panel2); transform:translateY(-4px); box-shadow:0 20px 40px -20px rgba(0,0,0,0.6);}
  .feat .idx{font-family:var(--mono); font-size:11px; color:var(--ink-dimmer);}
  .feat h4{font-family:var(--display); font-size:1.05rem; margin-top:10px; color:var(--ink);}
  .feat p{color:var(--ink-dim); font-size:0.9rem; margin-top:10px;}
  .feat code{font-family:var(--mono); color:var(--green); font-size:0.82rem;}

  .arch-wrap{border:1px solid var(--line-bright); background:var(--panel); padding:50px 30px; overflow-x:auto;}
  .arch-row{display:flex; align-items:stretch; gap:26px; min-width:780px; justify-content:center;}
  .arch-node{border:1px solid var(--line-bright); padding:20px 22px; background:var(--panel2); min-width:170px; text-align:center; transition:.2s all; position:relative;}
  .arch-node .tag{font-family:var(--mono); font-size:10px; color:var(--ink-dimmer); text-transform:uppercase; letter-spacing:0.05em;}
  .arch-node .name{font-family:var(--display); margin-top:8px; font-size:0.98rem;}
  .arch-node:hover{border-color:var(--green); box-shadow:0 0 28px rgba(57,255,136,0.3); transform:translateY(-4px);}
  .arch-connector{display:flex; align-items:center; justify-content:center; color:var(--green); font-size:20px; font-family:var(--mono);}
  .arch-substack{display:flex; flex-direction:column; gap:10px;}

  .tree{font-family:var(--mono); font-size:13px; line-height:1.9; color:var(--ink-dim); background:var(--panel); border:1px solid var(--line-bright); padding:28px 30px; overflow-x:auto;}
  .tree .dir{color:var(--magenta);} .tree .file{color:var(--ink);} .tree .comment{color:var(--ink-dimmer);}
  .tree .prompt{color:var(--green);}

  .accordion{border:1px solid var(--line-bright); background:var(--panel);}
  .acc-item + .acc-item{border-top:1px solid var(--line-bright);}
  .acc-head{padding:22px 26px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; font-family:var(--display); font-size:1.05rem;}
  .acc-head:hover{background:rgba(57,255,136,0.04);}
  .acc-head .plus{font-family:var(--mono); color:var(--green); font-size:20px; transition:.25s transform;}
  .acc-item.open .plus{transform:rotate(45deg);}
  .acc-body{max-height:0; overflow:hidden; transition:max-height .35s ease;}
  .acc-item.open .acc-body{max-height:900px;}
  .acc-body-inner{padding:0 26px 24px;}
  table.endpoints{width:100%; border-collapse:collapse; font-size:13.5px;}
  table.endpoints td{padding:10px 8px; border-top:1px solid var(--line); vertical-align:top;}
  table.endpoints td:first-child{font-family:var(--mono); color:var(--amber); white-space:nowrap; width:64px;}
  table.endpoints td:nth-child(2){font-family:var(--mono); color:var(--green); white-space:nowrap;}
  table.endpoints td:last-child{color:var(--ink-dim);}

  .stepper{display:grid;}
  .step{display:grid; grid-template-columns:52px 1fr; gap:20px; padding:22px 0; position:relative;}
  .step:not(:last-child)::before{content:""; position:absolute; left:25px; top:56px; bottom:-6px; width:1px; background:var(--line-bright);}
  .step-num{width:38px; height:38px; border:1px solid var(--green); background:var(--panel2); color:var(--green); display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-size:13px; z-index:1; box-shadow:0 0 14px rgba(57,255,136,0.25);}
  .step p{color:var(--ink-dim); font-size:0.96rem; padding-top:8px;}
  .step strong{color:var(--ink);}

  .scope-grid{display:grid; grid-template-columns:1fr 1fr; gap:2px; background:var(--line);}
  @media (max-width:760px){.scope-grid{grid-template-columns:1fr;}}
  .scope-col{background:var(--panel); padding:30px;}
  .scope-col h4{font-family:var(--mono); font-size:12px; letter-spacing:0.05em; margin-bottom:18px; text-transform:uppercase;}
  .scope-col.cut h4{color:var(--ink-dimmer);}
  .scope-col.next h4{color:var(--green);}
  .scope-col ul{list-style:none;}
  .scope-col li{padding:11px 0 11px 24px; border-bottom:1px solid var(--line); color:var(--ink-dim); font-size:0.93rem; position:relative;}
  .scope-col.cut li::before{content:"✕"; position:absolute; left:0; color:var(--ink-dimmer); font-size:11px;}
  .scope-col.next li::before{content:"▸"; position:absolute; left:0; color:var(--green);}

  .chips{display:flex; flex-wrap:wrap; gap:10px;}
  .chip{font-family:var(--mono); font-size:12px; padding:9px 15px; border:1px solid var(--line-bright); background:var(--panel); color:var(--ink-dim); transition:.2s all;}
  .chip:hover{border-color:var(--green); color:var(--green); box-shadow:0 0 14px rgba(57,255,136,0.2);}

  footer{position:relative; z-index:3; text-align:center; padding:80px 24px 110px; color:var(--ink-dimmer); font-family:var(--mono); font-size:12px;}
  code.inline{background:var(--panel2); border:1px solid var(--line-bright); padding:2px 8px; font-family:var(--mono); font-size:0.85em; color:var(--green);}

  @media (prefers-reduced-motion: reduce){ *{animation:none !important; transition:none !important;} }
</style>
</head>
<body>

<div class="grid-bg"></div>
<div class="vignette"></div>
<div id="spotlight"></div>
<div class="scanlines"></div>
<div class="noise"></div>

<div class="ticker"><div class="ticker-track" id="tickerTrack"></div></div>

<header class="hero">
  <div class="boot-line">&gt; dealflow360 --boot<span class="cursor-blink"></span></div>
  <h1 class="glitch" data-text="Every quote governs itself.">Every quote<br>governs itself.</h1>
  <p class="hero-sub">DealFlow360 evaluates risk, routes approvals, splits warehouse stock, and recommends upsells the moment a rep types a discount — no hardcoded numbers, no bypassing governance.</p>
  <div class="hero-actions">
    <button class="btn primary" onclick="document.getElementById('demo').scrollIntoView({behavior:'smooth'})">▶ run the risk engine</button>
    <button class="btn ghost" onclick="document.getElementById('quickstart').scrollIntoView({behavior:'smooth'})">$ cd server && npm start</button>
  </div>
</header>

<section id="stats">
  <div class="stat-row">
    <div class="stat"><div class="n">4</div><div class="l">pure logic engines</div></div>
    <div class="stat"><div class="n">0</div><div class="l">build steps</div></div>
    <div class="stat"><div class="n">3</div><div class="l">role-based views</div></div>
    <div class="stat"><div class="n">100</div><div class="l">pt risk scale</div></div>
  </div>
</section>

<section id="demo">
  <div class="section-head">
    <span class="tag-eyebrow">how it thinks</span>
    <h2>The blended discount risk score, live</h2>
    <p>Every line is checked against the stricter of two ceilings: the customer's tier limit and the product category's limit. Drag it — this is the real formula the engine runs, rendered live.</p>
  </div>
  <div class="tilt-wrap">
    <div class="demo-panel" id="tiltPanel">
      <div class="scanbeam"></div>
      <div class="demo-grid">
        <div>
          <div class="field-row">
            <label>Customer tier <span class="val" id="tierLabel">Gold (15%)</span></label>
            <select id="tierSelect">
              <option value="25">Platinum — 25%</option>
              <option value="15" selected>Gold — 15%</option>
              <option value="10">Silver — 10%</option>
            </select>
          </div>
          <div class="field-row">
            <label>Product category <span class="val" id="catLabel">Services (10%)</span></label>
            <select id="catSelect">
              <option value="15">Hardware — 15%</option>
              <option value="10" selected>Services — 10%</option>
              <option value="20">Subscriptions — 20%</option>
            </select>
          </div>
          <div class="field-row">
            <label>Discount given <span class="val" id="discLabel">18%</span></label>
            <input type="range" id="discSlider" min="0" max="40" value="18">
          </div>
        </div>
        <div class="risk-readout">
          <div class="risk-score-wrap">
            <div class="risk-dial" id="riskDial"><span id="riskNum">0</span></div>
            <div>
              <div class="badge safe" id="riskBadge">SAFE</div>
              <div class="reason" id="riskReason">discount within threshold</div>
            </div>
          </div>
          <div class="approval-path">
            <div class="approval-step" id="stepAuto">auto-approved</div>
            <span class="arrow">→</span>
            <div class="approval-step" id="stepMgr">sales manager</div>
            <span class="arrow">→</span>
            <div class="approval-step" id="stepFin">finance</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="engines">
  <div class="section-head">
    <span class="tag-eyebrow">not decorative</span>
    <h2>Four pure functions, zero fakery</h2>
  </div>
  <div class="feat-grid">
    <div class="feat"><div class="idx">01</div><h4>AI upsell panel</h4><p>Margin = <code>price − cost</code> per suggestion, ranked by seeded confidence. Recalculates the instant it's added.</p></div>
    <div class="feat"><div class="idx">02</div><h4>Warehouse split</h4><p>Greedy allocation across warehouses by preference, pulling real per-warehouse stock. Backorders computed, not assumed.</p></div>
    <div class="feat"><div class="idx">03</div><h4>Hybrid billing</h4><p>Lines split one-time vs. recurring by product type, with a computed next billing date.</p></div>
    <div class="feat"><div class="idx">04</div><h4>Customer negotiation</h4><p>A counter-discount re-invokes the same risk engine the rep uses. No better deal than governance allows.</p></div>
    <div class="feat"><div class="idx">05</div><h4>Audit trail</h4><p>Every change, submission, approval, rejection writes a real log entry — user, action, timestamp, old/new values.</p></div>
    <div class="feat"><div class="idx">06</div><h4>Zero hardcoding</h4><p>Every number on screen is computed from real logic against seeded data — nothing is a static prop.</p></div>
  </div>
</section>

<section id="architecture">
  <div class="section-head">
    <span class="tag-eyebrow">architecture</span>
    <h2>Logic layer has zero dependency on Express</h2>
    <p>The exact function the rep's builder calls is the same one re-run when a customer negotiates from the portal. Swapping the store for Postgres later only touches <code class="inline">store.js</code>.</p>
  </div>
  <div class="arch-wrap">
    <div class="arch-row">
      <div class="arch-node"><div class="tag">client</div><div class="name">Hash-routed SPA<br>no build step</div></div>
      <div class="arch-connector">⇄</div>
      <div class="arch-node"><div class="tag">server</div><div class="name">Express routes</div></div>
      <div class="arch-connector">→</div>
      <div class="arch-substack">
        <div class="arch-node"><div class="tag">logic</div><div class="name">riskEngine.js</div></div>
        <div class="arch-node"><div class="tag">logic</div><div class="name">upsellEngine.js</div></div>
        <div class="arch-node"><div class="tag">logic</div><div class="name">warehouseEngine.js</div></div>
        <div class="arch-node"><div class="tag">logic</div><div class="name">billingEngine.js</div></div>
      </div>
      <div class="arch-connector">→</div>
      <div class="arch-node"><div class="tag">store</div><div class="name">In-memory<br>seeded on boot</div></div>
    </div>
  </div>
</section>

<section id="quickstart">
  <div class="section-head">
    <span class="tag-eyebrow">quick start</span>
    <h2>One command. Nothing to provision.</h2>
    <p>No <code class="inline">npm install</code>, no <code class="inline">.env</code>, no seed script. Four customers, seven products, three warehouses, two in-flight quotations — ready on boot.</p>
  </div>
  <div class="tree">
<span class="prompt">$</span> cd server<br>
<span class="prompt">$</span> npm start<br><br>
<span class="comment"># then open</span> http://localhost:4000<br><br>
<span class="comment"># requirements: Node.js 18+, nothing else</span>
  </div>
</section>

<section id="structure">
  <div class="section-head"><span class="tag-eyebrow">project structure</span><h2>Where everything lives</h2></div>
  <div class="tree">
<span class="dir">dealflow360/</span><br>
├── <span class="file">README.md</span><br>
├── <span class="dir">docs/screenshots/</span><br>
├── <span class="dir">server/</span> <span class="comment">Express API + static file server</span><br>
│&nbsp;&nbsp;&nbsp;├── <span class="file">index.js</span><br>
│&nbsp;&nbsp;&nbsp;├── <span class="file">store.js</span> <span class="comment">in-memory store + audit helper</span><br>
│&nbsp;&nbsp;&nbsp;├── <span class="dir">data/seed.js</span><br>
│&nbsp;&nbsp;&nbsp;├── <span class="dir">logic/</span> <span class="comment">pure business logic, no Express</span><br>
│&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span class="file">riskEngine.js</span><br>
│&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span class="file">upsellEngine.js</span><br>
│&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span class="file">warehouseEngine.js</span><br>
│&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── <span class="file">billingEngine.js</span><br>
│&nbsp;&nbsp;&nbsp;└── <span class="dir">routes/</span> masterData · quotations · approvals · portal · dashboard<br>
└── <span class="dir">client/</span> <span class="comment">no-build vanilla JS SPA</span>
  </div>
</section>

<section id="stack">
  <div class="section-head"><span class="tag-eyebrow">tech stack</span><h2>No framework harmed in the making of this frontend</h2></div>
  <div class="chips">
    <span class="chip">Node.js (ES modules)</span><span class="chip">Express 4</span><span class="chip">In-memory JS store</span>
    <span class="chip">Vanilla JS SPA</span><span class="chip">Hand-rolled hash router</span><span class="chip">Hand-written CSS</span>
    <span class="chip">Space Grotesk / Inter / JetBrains Mono</span>
  </div>
</section>

<section id="api">
  <div class="section-head"><span class="tag-eyebrow">api reference</span><h2>Every endpoint, expandable</h2></div>
  <div class="accordion" id="accordion">
    <div class="acc-item open">
      <div class="acc-head">Master data<span class="plus">+</span></div>
      <div class="acc-body"><div class="acc-body-inner"><table class="endpoints">
        <tr><td>GET</td><td>/api/customers</td><td>List all customers</td></tr>
        <tr><td>GET</td><td>/api/products</td><td>List all products</td></tr>
        <tr><td>GET</td><td>/api/warehouses</td><td>List all warehouses with stock</td></tr>
      </table></div></div>
    </div>
    <div class="acc-item">
      <div class="acc-head">Quotations<span class="plus">+</span></div>
      <div class="acc-body"><div class="acc-body-inner"><table class="endpoints">
        <tr><td>GET</td><td>/api/quotations</td><td>List all quotations with summary + risk</td></tr>
        <tr><td>GET</td><td>/api/quotations/:id</td><td>Full detail — evaluation, upsell, billing, audit log</td></tr>
        <tr><td>POST</td><td>/api/quotations</td><td>Create a draft { customerId }</td></tr>
        <tr><td>POST</td><td>/api/quotations/:id/lines</td><td>Add a line { productId, qty, discount }</td></tr>
        <tr><td>PATCH</td><td>/api/quotations/:id/lines/:lineId</td><td>Update qty/discount</td></tr>
        <tr><td>DELETE</td><td>/api/quotations/:id/lines/:lineId</td><td>Remove a line</td></tr>
        <tr><td>POST</td><td>/api/quotations/:id/upsell/:productId</td><td>Accept an AI recommendation</td></tr>
        <tr><td>POST</td><td>/api/quotations/:id/submit</td><td>Run risk engine, route for approval or auto-approve</td></tr>
        <tr><td>POST</td><td>/api/quotations/:id/warehouse-split/accept</td><td>Compute and accept fulfillment split</td></tr>
        <tr><td>POST</td><td>/api/quotations/:id/confirm</td><td>Confirm order, mark invoice paid</td></tr>
      </table></div></div>
    </div>
    <div class="acc-item">
      <div class="acc-head">Approvals<span class="plus">+</span></div>
      <div class="acc-body"><div class="acc-body-inner"><table class="endpoints">
        <tr><td>GET</td><td>/api/approvals</td><td>List quotations pending a decision</td></tr>
        <tr><td>POST</td><td>/api/approvals/:id/decide</td><td>{ decision: approve | reject | revise, role, reason }</td></tr>
      </table></div></div>
    </div>
    <div class="acc-item">
      <div class="acc-head">Customer portal<span class="plus">+</span></div>
      <div class="acc-body"><div class="acc-body-inner"><table class="endpoints">
        <tr><td>GET</td><td>/api/portal/:id</td><td>Customer-safe view of a quotation</td></tr>
        <tr><td>POST</td><td>/api/portal/:id/negotiate</td><td>{ lineId, requestedDiscount, comment } — re-runs the risk engine</td></tr>
        <tr><td>POST</td><td>/api/portal/:id/confirm</td><td>Customer confirms an approved quotation</td></tr>
      </table></div></div>
    </div>
    <div class="acc-item">
      <div class="acc-head">Dashboard<span class="plus">+</span></div>
      <div class="acc-body"><div class="acc-body-inner"><table class="endpoints">
        <tr><td>GET</td><td>/api/dashboard</td><td>KPIs, deal health split, alerts, pipeline-by-stage</td></tr>
      </table></div></div>
    </div>
  </div>
</section>

<section id="demoscript">
  <div class="section-head"><span class="tag-eyebrow">demo script</span><h2>The 8-step flow, run before presenting</h2></div>
  <div class="stepper">
    <div class="step"><div class="step-num">1</div><p><strong>Login</strong> as Sales Representative → lands on the Dashboard.</p></div>
    <div class="step"><div class="step-num">2</div><p><strong>New Quotation</strong> → pick a Gold-tier customer.</p></div>
    <div class="step"><div class="step-num">3</div><p>Add <strong>Enterprise Laptop</strong>, qty 10, 12% discount → stays <strong>SAFE</strong>.</p></div>
    <div class="step"><div class="step-num">4</div><p>Add <strong>Installation Service</strong>, 18% discount → instantly flagged <strong>OVER LIMIT</strong>.</p></div>
    <div class="step"><div class="step-num">5</div><p>Accept an <strong>AI upsell</strong> → total and margin update immediately.</p></div>
    <div class="step"><div class="step-num">6</div><p><strong>Submit for Approval</strong> → quotation routes automatically.</p></div>
    <div class="step"><div class="step-num">7</div><p>Switch to <strong>Sales Manager</strong> → approve (escalates to Finance if risk is high).</p></div>
    <div class="step"><div class="step-num">8</div><p><strong>Compute Warehouse Split</strong> → send the portal link, negotiate, and confirm.</p></div>
  </div>
</section>

<section id="scope">
  <div class="section-head"><span class="tag-eyebrow">scope notes</span><h2>Deliberate cuts for a 24-hour window</h2></div>
  <div class="scope-grid">
    <div class="scope-col cut">
      <h4>cut for this build</h4>
      <ul>
        <li>No persistent database — state resets on restart</li>
        <li>No auth database — role select is a UI-only switch</li>
        <li>No proration, refunds, or multi-currency</li>
        <li>No admin UI for discount tiers or approval chains</li>
        <li>Warehouse split applies to Hardware lines only</li>
      </ul>
    </div>
    <div class="scope-col next">
      <h4>what we'd build next</h4>
      <ul>
        <li>Real persistence (Postgres) + JWT auth per role</li>
        <li>A trained recommendation model behind the upsell panel</li>
        <li>Subscription proration, cancellation, credit notes</li>
        <li>Admin UI for discount tiers and approval chains</li>
        <li>Email/Slack notifications on approvals and stalls</li>
      </ul>
    </div>
  </div>
</section>

<footer>built for a 24-hour hackathon · MIT license</footer>

<script>
  const tickerItems = ["RISK ENGINE: ONLINE","4 PURE LOGIC ENGINES","0 BUILD STEPS","AUDIT TRAIL: LOGGING",
    "WAREHOUSE SPLIT: LIVE","GOVERNANCE: ENFORCED","NO HARDCODED NUMBERS","NODE.JS 18+ REQUIRED"];
  const track = document.getElementById('tickerTrack');
  let tickerHtml = "";
  for(let r=0;r<2;r++){ tickerItems.forEach(t => tickerHtml += `<span>${t}</span><span class="dim">//</span>`); }
  track.innerHTML = tickerHtml;

  const spotlight = document.getElementById('spotlight');
  window.addEventListener('mousemove', e => {
    spotlight.style.left = e.clientX + 'px';
    spotlight.style.top = e.clientY + 'px';
  });

  const tiltPanel = document.getElementById('tiltPanel');
  tiltPanel.addEventListener('mousemove', e => {
    const r = tiltPanel.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tiltPanel.style.transform = `rotateY(${x*6}deg) rotateX(${-y*6}deg)`;
  });
  tiltPanel.addEventListener('mouseleave', () => { tiltPanel.style.transform = 'rotateY(0) rotateX(0)'; });

  const tierSelect = document.getElementById('tierSelect');
  const catSelect = document.getElementById('catSelect');
  const discSlider = document.getElementById('discSlider');
  const tierLabel = document.getElementById('tierLabel');
  const catLabel = document.getElementById('catLabel');
  const discLabel = document.getElementById('discLabel');
  const riskDial = document.getElementById('riskDial');
  const riskNum = document.getElementById('riskNum');
  const riskBadge = document.getElementById('riskBadge');
  const riskReason = document.getElementById('riskReason');
  const stepAuto = document.getElementById('stepAuto');
  const stepMgr = document.getElementById('stepMgr');
  const stepFin = document.getElementById('stepFin');
  const tierNames = {25:"Platinum",15:"Gold",10:"Silver"};
  const catNames = {15:"Hardware",10:"Services",20:"Subscriptions"};

  function recalc(){
    const tierLimit = parseInt(tierSelect.value,10);
    const catLimit = parseInt(catSelect.value,10);
    const given = parseInt(discSlider.value,10);
    tierLabel.textContent = tierNames[tierLimit] + " (" + tierLimit + "%)";
    catLabel.textContent = catNames[catLimit] + " (" + catLimit + "%)";
    discLabel.textContent = given + "%";
    const allowed = Math.min(tierLimit, catLimit);
    const overage = Math.max(0, given - allowed);
    const risk = Math.min(100, overage * 6);
    riskNum.textContent = risk;
    const deg = (risk/100) * 360;
    let color = "#39ff88", badgeClass = "safe", badgeText = "SAFE";
    if(risk > 40){ color = "#ff4757"; badgeClass = "hot"; badgeText = "OVER LIMIT — HIGH"; }
    else if(risk > 0){ color = "#ffc93c"; badgeClass = "warn"; badgeText = "OVER LIMIT"; }
    riskDial.style.background = "conic-gradient(" + color + " " + deg + "deg, var(--line) " + deg + "deg)";
    riskBadge.className = "badge " + badgeClass;
    riskBadge.textContent = badgeText;
    riskReason.textContent = overage > 0
      ? catNames[catLimit] + " discount exceeds allowed threshold by " + overage + "%."
      : "discount within allowed threshold — no approval needed.";
    stepAuto.classList.toggle('active', risk === 0);
    stepMgr.classList.toggle('active', risk > 0 && risk <= 40);
    stepFin.classList.toggle('active', risk > 40);
  }
  [tierSelect, catSelect, discSlider].forEach(el => el.addEventListener('input', recalc));
  recalc();

  document.querySelectorAll('.acc-head').forEach(head => {
    head.addEventListener('click', () => {
      const item = head.parentElement;
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.acc-item').forEach(i => i.classList.remove('open'));
      if(!wasOpen) item.classList.add('open');
    });
  });
</script>
</body>
</html>
