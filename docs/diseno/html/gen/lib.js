var MS = "font-family:'Material Symbols Rounded'";
var BSf = "font-family:'Big Shoulders Display';font-weight:900";
var BCf = "font-family:'Barlow Condensed';font-weight:800";
var T = { bg: '#07090C', s1: '#10141A', s2: '#181E26', line: '#242C36', line2: '#2D3A4A', tx: '#F4F7FA', tx2: '#8E9AAB', lime: '#D0FF41', red: '#FF5247', amber: '#FFB020', wa: '#25D366', ok: '#3DDC84', jug: '#5B9BFF', del: '#B38CFF', arb: '#3FE0D0', afi: '#FF7AD9', liga: '#E9E4D8', blue: '#0250B0' };
var CR = { DP: ['#0250B0', '#FFFFFF'], TL: ['#F28C1B', '#07090C'], RC: ['#8A1C2B', '#8A1C2B'], JT: ['#B8228F', '#B8228F'], AP: ['#1F7A3A', '#1F7A3A'], UD: ['#08716D', '#08716D'], SN: ['#5B6878', '#5B6878'], HI: ['#2D3A4A', '#2D3A4A'], LC: ['#1F7A3A', '#D0FF41'] };

function page(body, withSlot) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<meta name="design_doc_mode" content="canvas">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600;700&family=Big+Shoulders+Display:wght@700;800;900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..600,0..1,0&display=block" rel="stylesheet">
${withSlot ? '<script src="./image-slot.js"></script>\n' : ''}<style>body{margin:0;background:#03070F;}a{color:#D0FF41;}a:hover{color:#fff;}</style>
</helmet>
<div style="display:flex;flex-direction:column;align-items:center;gap:40px;padding:40px;">
${body}
</div>
</x-dc>
</body>
</html>
`;
}
function lam(id, num, title, desc, body, justify) {
  return `<section id="${id}" data-screen-label="${num} ${title}" style="width:1440px;height:810px;background:#0250B0;padding:34px 48px;box-sizing:border-box;display:flex;flex-direction:column;gap:22px;font-family:'Barlow',sans-serif;color:#fff;overflow:hidden;">
  <div style="display:flex;align-items:flex-end;gap:18px;">
    <span style="${BSf};font-size:56px;line-height:.82;color:#D0FF41;white-space:nowrap;">${num}</span>
    <span style="${BSf};font-style:italic;font-size:56px;line-height:.82;white-space:nowrap;">${title}</span>
    <span style="font-size:15px;line-height:1.3;max-width:520px;">${desc}</span>
  </div>
  <div style="display:flex;justify-content:${justify || 'space-between'};align-items:flex-start;gap:24px;">
${body}
  </div>
</section>`;
}
function col(title, sub, inner, w) {
  return `<div style="display:flex;flex-direction:column;gap:10px;${w ? 'width:' + w + 'px;' : ''}flex:none;">
  <div style="display:flex;align-items:baseline;gap:10px;"><span style="${BSf};font-style:italic;font-size:22px;white-space:nowrap;">${title}</span><span style="font-size:13px;white-space:nowrap;">${sub || ''}</span></div>
  ${inner}
</div>`;
}
function cel(o, inner) {
  const a = [`role="${o.role || 'jugador'}"`, `active="${o.active || 'Inicio'}"`, `time="${o.time || '20:00'}"`];
  if (o.nav === false) a.push('nav="{{ false }}"');
  if (o.fab) a.push('fab="{{ true }}"');
  if (o.noGlow) a.push('no-glow="{{ true }}"');
  if (o.noTop) a.push('no-top="{{ true }}"');
  if (o.bg) a.push(`bg="${o.bg}"`);
  return `<dc-import name="Cel" ${a.join(' ')} hint-size="300px,628px">${inner}</dc-import>`;
}
var ic = (n, s, c, fill) => `<span style="${MS};font-size:${s || 20}px;${c ? 'color:' + c + ';' : ''}${fill ? "font-variation-settings:'FILL' 1;" : ''}letter-spacing:0;line-height:1;">${n}</span>`;
var bs = (t, s, c, it, ex) => `<span style="${BSf};${it !== false ? 'font-style:italic;' : ''}font-size:${s}px;line-height:.86;${c ? 'color:' + c + ';' : ''}${ex || ''}">${t}</span>`;
var lbl = (t, c, s, ex) => `<span style="${BCf};font-size:${s || 12}px;letter-spacing:.16em;color:${c || T.tx2};${ex || ''}">${t}</span>`;
var sq = (n, badge) => `<div style="width:40px;height:40px;border-radius:12px;background:${T.s1};border:1px solid ${T.line};box-sizing:border-box;display:flex;align-items:center;justify-content:center;position:relative;flex:none;">${ic(n, 21)}${badge ? `<span style="position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;border-radius:9px;background:${T.red};color:#060709;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;">${badge}</span>` : ''}</div>`;
var hLogo = (b) => `<div style="height:54px;flex:none;display:flex;align-items:center;gap:10px;padding:0 16px;"><img src="assets/chilena-logo-azul.png" alt="Chilena" style="width:44px;height:44px;display:block;"><span style="flex:1;"></span>${sq('search')}${sq('notifications', b)}</div>`;
var hBack = (t, right, icon) => `<div style="height:52px;flex:none;display:flex;align-items:center;gap:8px;padding:0 12px;">${ic(icon || 'arrow_back', 24)}<span style="flex:1;min-width:0;${BCf};font-size:15px;letter-spacing:.16em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t}</span>${right || ''}</div>`;
var body = (inner, pad, ex) => `<div style="flex:1;min-height:0;overflow:hidden;padding:${pad || '4px 14px 100px'};display:flex;flex-direction:column;gap:12px;${ex || ''}">${inner}</div>`;
function btn(t, k, icn, ex) {
  const K = { lime: `background:${T.lime};color:#07090C;box-shadow:inset 0 -3px 0 rgba(0,0,0,.18);`, out: `border:1.5px solid ${T.line};color:${T.tx};`, wa: `background:${T.wa};color:#07090C;`, red: `background:${T.red};color:#07090C;`, ghost: `background:${T.s2};color:${T.tx};` }[k || 'lime'];
  return `<div style="height:46px;padding:0 14px;border-radius:12px;${K}box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:6px;${BCf};font-size:14px;letter-spacing:.14em;white-space:nowrap;${ex || ''}">${icn ? ic(icn, 19) : ''}${t}</div>`;
}
var chip = (t, bg, fg, ex) => `<span style="height:24px;padding:0 9px;border-radius:7px;background:${bg};color:${fg};display:inline-flex;align-items:center;gap:5px;${BCf};font-size:11px;letter-spacing:.12em;white-space:nowrap;flex:none;${ex || ''}">${t}</span>`;
var pill = (t, on, ex) => `<span style="height:32px;padding:0 12px;border-radius:99px;${on ? `background:${T.lime};color:#07090C;` : `border:1.5px solid ${T.line};color:${T.tx};`}box-sizing:border-box;display:inline-flex;align-items:center;gap:5px;${BCf};font-size:12px;letter-spacing:.12em;white-space:nowrap;flex:none;${ex || ''}">${t}</span>`;
var card = (inner, ex) => `<div style="border-radius:16px;background:${T.s1};border:1px solid ${T.line};padding:12px;display:flex;flex-direction:column;gap:10px;${ex || ''}">${inner}</div>`;
var av = (ini, bg, fg, s, ring, ex) => `<span style="width:${s || 34}px;height:${s || 34}px;border-radius:50%;background:${bg || '#2D3A4A'};color:${fg || '#F4F7FA'};${ring ? `box-shadow:0 0 0 2px ${T.s1},0 0 0 4px ${ring};` : ''}flex:none;display:flex;align-items:center;justify-content:center;${BCf};font-size:${Math.round((s || 34) * .36)}px;letter-spacing:0;${ex || ''}">${ini}</span>`;
var crest = (k, s, ex) => { const c = CR[k] || CR.DP, z = s || 30; return `<span style="width:${z}px;height:${Math.round(z * 1.08)}px;border-radius:${Math.round(z * .18)}px ${Math.round(z * .18)}px ${Math.round(z * .45)}px ${Math.round(z * .45)}px;background:${c[0]};border-top:${Math.round(z * .22)}px solid ${c[1]};box-sizing:border-box;flex:none;display:inline-block;${ex || ''}"></span>`; };
var tabs = (arr, on, color) => `<div style="flex:none;display:flex;gap:20px;padding:0 18px;border-bottom:1px solid ${T.line};${BCf};font-size:14px;letter-spacing:.1em;white-space:nowrap;overflow:hidden;">${arr.map((t, i) => `<span style="padding:10px 0 9px;${i === on ? `color:${color || T.jug};border-bottom:3px solid ${color || T.jug};` : `color:${T.tx2};`}">${t}</span>`).join('')}</div>`;
var rowI = (icn, t, d, right, c) => `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-bottom:1px solid ${T.s2};">${ic(icn, 21, c || T.tx2)}<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;">${t}</div>${d ? `<div style="font-size:12px;color:${T.tx2};">${d}</div>` : ''}</div>${right || ic('chevron_right', 20, T.tx2)}</div>`;
var tog = (on) => `<span style="width:42px;height:26px;border-radius:13px;background:${on ? T.lime : T.line2};position:relative;flex:none;display:inline-block;"><span style="position:absolute;top:3px;${on ? 'right:3px' : 'left:3px'};width:20px;height:20px;border-radius:50%;background:${on ? '#07090C' : '#8E9AAB'};"></span></span>`;
var bar = (pct, c, h) => `<div style="height:${h || 6}px;border-radius:3px;background:${T.line};overflow:hidden;flex:1;"><div style="width:${pct}%;height:100%;background:${c || T.lime};border-radius:3px;"></div></div>`;
var note = (t, d) => `<div style="border-radius:16px;background:rgba(255,255,255,.1);padding:14px 16px;display:flex;flex-direction:column;gap:4px;"><b style="${BCf};font-size:13px;letter-spacing:.14em;color:#D0FF41;">${t}</b><span style="font-size:13px;line-height:1.4;">${d}</span></div>`;
var slot = (id, w, h, ph, ex) => `<image-slot id="${id}" shape="rect" placeholder="${ph}" style="width:${w}px;height:${h}px;color:#FFFFFF;${ex || ''}"></image-slot>`;
function browser(url, w, innerW, innerH, inner) {
  const z = (w / innerW).toFixed(4);
  return `<div style="width:${w}px;border-radius:14px;overflow:hidden;background:#15181D;box-shadow:0 30px 60px rgba(0,0,0,.35);flex:none;">
    <div style="height:34px;display:flex;align-items:center;gap:7px;padding:0 14px;position:relative;"><span style="width:11px;height:11px;border-radius:50%;background:#FF5F57;"></span><span style="width:11px;height:11px;border-radius:50%;background:#FEBC2E;"></span><span style="width:11px;height:11px;border-radius:50%;background:#28C840;"></span><div style="position:absolute;left:50%;top:6px;transform:translateX(-50%);width:380px;height:22px;border-radius:6px;background:#0B0D10;display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px;color:#8E9AAB;">${ic('lock', 12)}${url}</div></div>
    <div style="zoom:${z};width:${innerW}px;height:${innerH}px;display:flex;background:#07090C;color:#F4F7FA;font-family:'Barlow',sans-serif;overflow:hidden;">${inner}</div>
  </div>`;
}
function sidebar(role, active, team, who, whoSub, ini) {
  const C = { jugador: T.jug, delegado: T.del, arbitro: T.arb, aficionado: T.afi, liga: T.liga }[role] || T.jug;
  const RL = { jugador: 'JUGADOR', delegado: 'DELEGADO', arbitro: 'ÁRBITRO', aficionado: 'AFICIONADA', liga: 'LIGA' }[role];
  const it = (n, l, badge) => `<div style="height:42px;border-radius:10px;padding:0 12px;display:flex;align-items:center;gap:12px;font-size:15px;font-weight:600;${l === active ? `background:${({ jugador: '#0250B0', delegado: '#6B2FD6', arbitro: '#08716D', aficionado: '#B8228F', liga: T.liga })[role] || '#0250B0'};color:${role === 'liga' ? '#07090C' : '#FFFFFF'};` : ''}">${ic(n, 21, null, l === active)}<span style="flex:1;">${l}</span>${badge ? `<span style="min-width:20px;height:20px;border-radius:10px;background:${T.red};color:#060709;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">${badge}</span>` : ''}</div>`;
  return `<div style="width:232px;flex:none;border-right:1px solid ${T.line};padding:18px 14px;box-sizing:border-box;display:flex;flex-direction:column;gap:18px;">
    <img src="assets/chilena-logo-azul.png" alt="Chilena" style="width:60px;height:60px;display:block;margin-left:4px;">
    ${role ? `<div style="border-radius:12px;background:${T.s1};border:1px solid ${T.line};padding:10px;display:flex;align-items:center;gap:10px;">${crest('DP', 28)}<div style="flex:1;min-width:0;"><div style="${BCf};font-size:10px;letter-spacing:.16em;color:${C};">${RL}</div><div style="font-size:13px;font-weight:600;">${team}</div></div>${ic('unfold_more', 18, T.tx2)}</div>` : ''}
    <div style="display:flex;flex-direction:column;gap:4px;">${it('home', 'Inicio')}${it('sensors', 'En vivo', 3)}${it('stadium', 'Mi liga')}${it('person', 'Perfil')}</div>
    ${who ? `<div style="margin-top:auto;display:flex;align-items:center;gap:10px;padding:4px;">${av(ini, '#C6D0DD', '#023B83', 36, C)}<div><div style="font-size:14px;font-weight:600;">${who}</div><div style="font-size:12px;color:${T.tx2};">${whoSub}</div></div></div>` : ''}
  </div>`;
}
var reacts = (a) => `<div style="display:flex;gap:6px;align-items:center;flex-wrap:nowrap;">${a.map((r, i) => `<span style="height:30px;padding:0 10px;border-radius:99px;${i === 0 && r[1] ? `background:${T.lime};color:#07090C;` : `background:${T.s2};`}display:flex;align-items:center;font-size:13px;font-weight:600;white-space:nowrap;">${r[0]}</span>`).join('')}</div>`;
function cmt(ini, bg, who, meta, text, re, ex) {
  return `<div style="display:flex;gap:10px;align-items:flex-start;${ex || ''}">${av(ini, bg, bg === '#C6D0DD' ? '#023B83' : '#F4F7FA', 32)}<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;"><div style="border-radius:4px 14px 14px 14px;background:${T.s2};padding:8px 11px;font-size:13px;line-height:1.35;"><b>${who}</b> <span style="color:${T.tx2};font-size:12px;">${meta}</span><br>${text}</div>${re ? `<div style="display:flex;gap:12px;align-items:center;font-size:12px;color:${T.tx2};padding-left:4px;">${re}</div>` : ''}</div></div>`;
}
