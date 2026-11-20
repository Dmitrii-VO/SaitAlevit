import { poseTrowel } from "./mason.js";
import { STATES } from "./builder-character-config.js";
import { COURSE_HEIGHT, brickAt, nextCourse, rowGeometry } from "./brick-courses.js";

const IDLE_DELAY = 4500;
const PLACEMENT_TIME = 440;

export class BrickWall {
  constructor(progress) {
    this.progress = progress;
    this.root = document.createElement("div");
    this.root.className = "builder-wall";
    this.root.setAttribute("aria-hidden", "true");
    this.root.hidden = true;
    document.body.append(this.root);
    this.nextIdle = performance.now() + IDLE_DELAY;
    this.row = -1;
    this.started = null;
  }

  interrupt(builder) {
    this.nextIdle = performance.now() + IDLE_DELAY;
    if (this.root.hidden) return;
    this.root.hidden = true;
    this.started = null;
    this.row = -1;
    builder.element.style.visibility = "";
    builder.setState(STATES.RUNNING);
  }

  renderRows(width, scroll, height) {
    const fragment = document.createDocumentFragment();
    const from = Math.floor(scroll / COURSE_HEIGHT);
    const last = Math.floor((scroll + height - 1) / COURSE_HEIGHT);
    for (let row = from; row <= last; row++) {
      const fraction = this.progress.get(row);
      if (!fraction) continue;
      const { brick, reverse } = rowGeometry(width, row);
      const course = document.createElement("div");
      course.className = "builder-wall__course";
      course.style.top = (row * COURSE_HEIGHT - scroll) + "px";
      course.style.backgroundSize = brick + "px 100%";
      course.style.backgroundPositionX = (reverse ? brick / 2 : 0) + "px";
      const hidden = (1 - fraction) * 100 + "%";
      course.style.clipPath = reverse ? `inset(0 0 0 ${hidden})` : `inset(0 ${hidden} 0 0)`;
      fragment.append(course);
    }
    this.root.replaceChildren(fragment);
  }

  update(builder, now, elapsed) {
    if (now < this.nextIdle) return false;
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    const scroll = Math.max(0, window.scrollY);
    const rows = Math.ceil(document.documentElement.scrollHeight / COURSE_HEIGHT);
    if (this.root.hidden) {
      this.root.hidden = false;
      clearTimeout(builder.stateTimeout);
      builder.setState(STATES.RUNNING);
      this.renderRows(width, scroll, height);
    }
    if (this.row < 0) {
      this.row = nextCourse(this.progress, rows, Math.ceil((scroll + height) / COURSE_HEIGHT) - 1);
      if (this.row < 0) {
        builder.setState(STATES.RESTING);
        return true;
      }
    }

    const row = this.row;
    const top = row * COURSE_HEIGHT - scroll;
    const visible = top < height && top + COURSE_HEIGHT > 0;
    builder.element.style.visibility = visible ? "" : "hidden";
    const { brick, count, reverse } = rowGeometry(width, row);
    const fraction = this.progress.get(row) || 0;
    // The stored fraction measures laid width, including half bricks on offset rows.
    const index = Math.min(count - 1, Math.floor(fraction * width / brick + (reverse ? .5 : 0) + 1e-7));
    const slot = brickAt(width, row, index);
    if (visible) {
      const size = builder.getCharacterSize();
      const center = slot.left + slot.width / 2;
      // Stand on the inside at either edge, with the tool angled toward the brick.
      const faceRight = center > width - size * .72 || (!reverse && center > size * .72);
      const x = center - size * (faceRight ? .765 : .235);
      const surfaceY = Math.max(23, Math.min(94 - COURSE_HEIGHT / size * 100, top / size * 100 + 12));
      const y = top - size * surfaceY / 100;
      if (this.started === null && !builder.approach(x, y, elapsed)) {
        builder.setState(STATES.RUNNING);
        return true;
      }
      builder.facingLeft = faceRight;
      builder.updatePosition();
      builder.setState(STATES.BUILDING);
      builder.element.style.setProperty("--mason-crouch", Math.max(0, surfaceY - 54) * .22 + "px");
      if (this.started === null) {
        const tile = document.createElement("span");
        tile.className = "builder-wall__brick";
        tile.style.cssText = `left:${slot.left}px;top:${top}px;width:${slot.width}px;--carry:${faceRight ? -10 : 10}px`;
        this.root.append(tile);
      }
      poseTrowel(builder.toolParts, surfaceY, Math.min(1, (now - (this.started ?? now)) / PLACEMENT_TIME));
    }
    if (this.started === null) this.started = now;
    if (now - this.started >= PLACEMENT_TIME) {
      const covered = reverse ? width - slot.left : slot.left + slot.width;
      this.progress.set(row, index + 1 === count ? 1 : covered / width);
      if (visible) this.renderRows(width, scroll, height);
      if (index + 1 === count) this.row = -1;
      this.started = null;
    }
    return true;
  }

  destroy() { this.root.remove(); }
}
