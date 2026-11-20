/* Articulated, left-facing mason. All poses use the same 100 × 100 drawing. */
function leg(side) {
  return `<g transform="translate(${side === "back" ? 59 : 48} 62)">
    <g class="mason-leg mason-leg--${side}">
      <path d="M-5-3 Q1-6 6-2 L5 14 Q1 18-5 14Z" fill="url(#mason-denim)"/>
      <g transform="translate(0 13)"><g class="mason-shin">
        <path d="M-5-2 Q0-5 5-1 L4 13 L-4 13Z" fill="url(#mason-denim)"/>
        <path d="M-4 0 Q0-2 4 0 L3 4-3 5Z" fill="#42606a" stroke="none"/>
        <g transform="translate(0 12)"><g class="mason-boot">
          <path d="M-4-2 L4-2 5 4 4 6-10 6 Q-13 5-10 2 L-5 0Z" fill="#ad7144"/>
          <path d="M-11 5 L5 4.5 4 7-11 7Z" fill="#312f2b"/>
          <path d="M-5 0 L-2 1 M-6 2 L-3 3" stroke="#ebc18a" stroke-width="1"/>
        </g></g>
      </g></g>
    </g>
  </g>`;
}

function arm(side) {
  return `<g transform="translate(${side === "back" ? 48 : 59} 46)">
    <g class="mason-arm mason-arm--${side}">
      <path d="M-4-2 Q0-5 4-2 L4 11-4 12Z" fill="url(#mason-shirt)"/>
      <g transform="translate(0 11)"><g class="mason-forearm">
        <path d="M-3-1 L3-1 3 9-2 10Z" fill="#ebad78"/>
        <path d="M-3 7 L3 7 4 12 Q3 16-2 15 L-5 11Z" fill="#e5bb72"/>
      </g></g>
    </g>
  </g>`;
}

export function createMason() {
  const holder = document.createElement("div");
  holder.innerHTML = `<svg viewBox="0 0 100 100" class="mason" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mason-helmet" x2=".85" y2="1" gradientUnits="objectBoundingBox">
        <stop stop-color="#fff09c"/><stop offset=".42" stop-color="#ffc449"/><stop offset="1" stop-color="#df8e26"/>
      </linearGradient>
      <linearGradient id="mason-denim" x2="1" y2=".55"><stop stop-color="#496978"/><stop offset=".5" stop-color="#324e5e"/><stop offset="1" stop-color="#203845"/></linearGradient>
      <linearGradient id="mason-shirt" x2=".8" y2="1"><stop stop-color="#9eae83"/><stop offset="1" stop-color="#668669"/></linearGradient>
      <linearGradient id="mason-face" x2=".9" y2=".65"><stop stop-color="#ffcf91"/><stop offset="1" stop-color="#d99065"/></linearGradient>
    </defs>
    <g class="mason-pose" stroke="#332e29" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">
      <g class="mason-body">
        <g class="mason-far">${leg("back")}</g>
        ${leg("front")}
        <g class="mason-torso">
          <g class="mason-far">${arm("back")}</g>
          <path d="M47 39 Q40 41 40 49 L40 60 Q50 66 64 60 L64 48 Q63 41 56 40Z" fill="url(#mason-shirt)"/>
          <path d="M44 41 L47 42 46 48 54 49 57 41 60 42 57 52 62 58 62 64 Q50 67 40 61 L41 52Z" fill="url(#mason-denim)"/>
          <path d="M44 52 L52 53 51 57 Q46 60 43 56Z" fill="#577580" stroke="#b0b6a1" stroke-width=".9"/>
          <path d="M40 59 Q51 63 64 58 L65 62 Q52 67 40 63Z" fill="#855331"/>
          <path d="M44 60 L49 61 49 64 44 63Z" fill="#e0b16c"/>
          <path d="M60 59 L67 58 67 65 Q65 69 59 67Z" fill="#b9804f"/>
          <path d="M63 57 L65 49" stroke="#cbd3d2" stroke-width="2.5"/>

          <g class="mason-head">
            <path d="M45 34 L56 33 56 41 Q51 45 45 41Z" fill="#d59369"/>
            <path d="M35 21 Q40 10 56 15 Q66 19 64 28 L60 35 Q54 42 43 39 Q36 38 35 32 L31 30 Q30 28 34 26Z" fill="url(#mason-face)"/>
            <path d="M57 18 Q65 20 63 29 L59 34 55 31 54 25Z" fill="#563e31"/>
            <path d="M34 32 Q38 33 41 31 Q43 30 45 32 L48 34 Q52 35 55 30 L58 30 Q57 39 49 41 Q39 42 36 37Z" fill="#604637"/>
            <path d="M39 35 Q42 37 46 35" fill="none" stroke="#ffe1b4" stroke-width="1.4"/>
            <path d="M55 26 Q60 23 60 28 Q59 32 55 31" fill="#e9ac7b"/>
            <path d="M36 23 Q39 21 42 23" fill="none" stroke-width="1.8"/>
            <ellipse cx="38.5" cy="26" rx="1.4" ry="1.9" fill="#292a28" stroke="none"/>
            <circle cx="38" cy="25.4" r=".45" fill="white" stroke="none"/>
            <path d="M33 21 Q33 10 41 6 Q47 2 55 6 Q63 9 64 19 L64 22Z" fill="url(#mason-helmet)"/>
            <path d="M42 17 Q42 8 47 5 Q50 3 52 5 L49 17" fill="#ffd875" stroke="#b87c2b" stroke-width="1"/>
            <path d="M55 8 Q59 11 60 16" fill="none" stroke="#ffde85" stroke-width="2"/>
            <path d="M32 18 Q49 15 64 18 L66 21 Q52 21 38 23 L28 23 Q25 22 28 20Z" fill="#edaa35"/>
            <path d="M30 20 Q44 17 59 18" fill="none" stroke="#fff1a3" stroke-width="1.4"/>
          </g>
          ${arm("front")}
        </g>
      </g>
      <g class="mason-work-arm">
        <path class="mason-work-sleeve" fill="none" stroke="#405749" stroke-width="9"/>
        <path class="mason-work-cuff" fill="none" stroke="#9cac83" stroke-width="6"/>
        <path class="mason-work-wrist" fill="none" stroke="#d99a69" stroke-width="6"/>
        <g class="mason-hand">
          <path d="M-2 1 L-7 5-9 5" fill="none" stroke="#734526" stroke-width="3"/>
          <path d="M-8 5 L-19 6-15 2-10 2Z" fill="#c9dedc" stroke="#566467"/>
          <path d="M1-3 Q5-3 5 1 L2 4-2 4-4 1-3-2Z" fill="#e8bb70"/>
        </g>
      </g>
    </g>
  </svg>`;
  return holder.firstElementChild;
}

// Bend the elbow between shoulder and trowel as the mortar course moves higher.
export function poseTrowel(parts, surfaceY, phase) {
  const reach = Math.sin(Math.min(phase / .8, 1) * Math.PI);
  const sweep = Math.min(phase / .78, 1);
  const x = 47 - 9 * sweep;
  const y = surfaceY - 14 + 10 * reach;
  const sx = 51, sy = 48 + Math.max(0, surfaceY - 54) * .22;
  const dx = x - sx, dy = y - sy;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const bend = Math.sqrt(Math.max(0, 18 ** 2 - distance ** 2 / 4));
  const ex = (sx + x) / 2 + dy / distance * bend;
  const ey = (sy + y) / 2 - dx / distance * bend;
  const upper = `M${sx} ${sy} L${ex} ${ey}`;
  parts.sleeve.setAttribute("d", upper);
  parts.cuff.setAttribute("d", upper);
  parts.wrist.setAttribute("d", `M${ex} ${ey} L${x} ${y}`);
  parts.hand.setAttribute("transform", `translate(${x} ${y}) rotate(${12 - 16 * reach})`);
}
