import { STATES } from "./builder-character-config.js";

const IDLE_DELAY = 4500;
const BRICK_WIDTH = 24;
const COURSE_HEIGHT = 11;
const COLUMNS = 5;
const COURSES = 4;
const PLACEMENT_TIME = 920;

// Alternate full and half bricks so the vertical mortar joints are staggered.
function makeCourses() {
  const slots = [];
  for (let row = 0; row < COURSES; row++) {
    const widths = Array(COLUMNS).fill(BRICK_WIDTH);
    if (row % 2) {
      widths[0] /= 2;
      widths.push(BRICK_WIDTH / 2);
    }
    let left = 0;
    const course = widths.map(width => {
      const slot = { left, bottom: row * COURSE_HEIGHT, width };
      left += width;
      return slot;
    });
    slots.push(...(row % 2 ? course.reverse() : course));
  }
  return slots;
}

const slots = makeCourses();

export class BrickWall {
  constructor() {
    this.root = document.createElement("div");
    this.root.className = "builder-wall";
    this.root.setAttribute("aria-hidden", "true");
    this.root.hidden = true;
    document.body.append(this.root);
    this.count = 0;
    this.pending = null;
    this.nextIdle = performance.now() + IDLE_DELAY;
    this.lastFrame = 0;
  }

  interrupt(builder) {
    this.nextIdle = performance.now() + IDLE_DELAY;
    if (this.root.hidden) return;
    this.root.hidden = true;
    this.pending?.remove();
    this.pending = null;
    if (this.count === slots.length) {
      this.root.replaceChildren();
      this.count = 0;
    }
    builder.setState(STATES.RUNNING);
  }

  update(builder, now) {
    if (now < this.nextIdle) return false;
    const elapsed = Math.min(50, now - this.lastFrame);
    this.lastFrame = now;
    if (this.root.hidden) {
      this.root.hidden = false;
      clearTimeout(builder.stateTimeout);
      builder.setState(STATES.RUNNING);
    }
    if (this.count === slots.length) return true;

    const slot = slots[this.count];
    const size = builder.getCharacterSize();
    const base = this.root.getBoundingClientRect();
    const x = base.left + slot.left + slot.width / 2 - size * .34;
    const y = base.bottom - slot.bottom - size * .73;
    const dx = x - builder.currentX;
    const dy = y - builder.currentY;
    const distance = Math.hypot(dx, dy);
    if (distance > 1) {
      builder.setState(STATES.RUNNING);
      builder.facingLeft = dx > 0;
      const step = Math.min(1, elapsed * .85 / distance);
      builder.currentX += dx * step;
      builder.currentY += dy * step;
      builder.updateSpriteAnimation(Date.now());
      builder.updatePosition();
      return true;
    }

    builder.facingLeft = false;
    builder.updatePosition();
    builder.setState(STATES.BUILDING);
    if (!this.pending) {
      const brick = document.createElement("span");
      brick.className = "builder-wall__brick";
      brick.style.left = slot.left + "px";
      brick.style.bottom = slot.bottom + "px";
      brick.style.width = slot.width + "px";
      this.root.append(brick);
      this.pending = brick;
      this.started = now;
    } else if (now - this.started >= PLACEMENT_TIME) {
      this.count++;
      this.pending = null;
      if (this.count === slots.length) builder.setState(STATES.RESTING);
    }
    return true;
  }

  destroy() { this.root.remove(); }
}
