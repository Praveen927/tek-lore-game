import { colors } from "../content/tekion.js";

// Fast travel: a small "Where to?" button and a list of destinations. Picking one moves the car there.
export default class Menu {
  constructor(_options) {
    this.destinations = _options.destinations;
    this.car = _options.car;
    this.physics = _options.physics;
    this.time = _options.time;

    this.setElements();
    this.setEvents();
  }

  setElements() {
    this.$root = document.createElement("div");
    this.$root.className = "menu";
    this.$root.style.setProperty("--menu-accent", colors.accent);
    this.$root.style.setProperty("--menu-text", colors.text);

    this.$toggle = document.createElement("button");
    this.$toggle.type = "button";
    this.$toggle.className = "menu-toggle";
    this.$toggle.textContent = "Where to?";
    this.$toggle.setAttribute("aria-expanded", "false");
    this.$toggle.setAttribute("aria-controls", "menu-panel");

    this.$panel = document.createElement("nav");
    this.$panel.className = "menu-panel";
    this.$panel.id = "menu-panel";
    this.$panel.setAttribute("aria-label", "Fast travel");
    this.$panel.hidden = true;

    // One heading per group, in order of first appearance
    const groups = [
      ...new Set(this.destinations.map((_destination) => _destination.group)),
    ];
    for (const _group of groups) {
      const $heading = document.createElement("p");
      $heading.className = "menu-heading";
      $heading.textContent = _group;
      this.$panel.appendChild($heading);

      for (const _destination of this.destinations.filter(
        (_item) => _item.group === _group,
      )) {
        const $item = document.createElement("button");
        $item.type = "button";
        $item.className = "menu-item";
        $item.textContent = _destination.label;
        $item.addEventListener("click", () => this.go(_destination));
        this.$panel.appendChild($item);
      }
    }

    this.$root.append(this.$panel, this.$toggle);
    document.body.appendChild(this.$root);
  }

  setEvents() {
    this.$toggle.addEventListener("click", () => {
      this.toggle(this.$panel.hidden);
      this.$toggle.blur(); // keep Space/Enter for the car
    });

    document.addEventListener("keydown", (_event) => {
      if (_event.key === "Escape") {
        this.toggle(false);
      }
    });

    document.addEventListener("pointerdown", (_event) => {
      if (!this.$root.contains(_event.target)) {
        this.toggle(false);
      }
    });
  }

  toggle(_open) {
    this.$panel.hidden = !_open;
    this.$toggle.setAttribute("aria-expanded", String(_open));
  }

  go(_destination) {
    const body = this.physics.car.chassis.body;

    // Arrive facing the way the journey runs (+y), upright and at rest
    body.sleep();
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    body.quaternion.setFromEuler(0, 0, Math.PI * 0.5, "XYZ");
    body.position.set(_destination.x, _destination.y, 2);
    body.wakeUp();

    // The jump would otherwise count as a crash-speed movement and play the screech
    this.car.movement.lastScreech = this.time.elapsed;

    this.toggle(false);
    document.activeElement?.blur();
  }
}
