import * as THREE from "three";

import { alphaLabel } from "../Labels.js";
import { wordLetters } from "../Words.js";
import { iconFor } from "../Icons.js";
import { social, colors } from "../../content/tekion.js";

const SPACING = 4.6; // distance between two social pads

// Replaces the original InformationSection: same static scenery, link pads generated from content/tekion.js
export default class ConnectSection {
  constructor(_options) {
    // Options
    this.time = _options.time;
    this.resources = _options.resources;
    this.objects = _options.objects;
    this.areas = _options.areas;
    this.debug = _options.debug;
    this.x = _options.x;
    this.y = _options.y;

    // Set up
    this.container = new THREE.Object3D();
    this.container.matrixAutoUpdate = false;

    this.setStatic();
    this.setLinks();
  }

  setStatic() {
    // Heading made of physical letters (the original baked scenery was person-specific)
    for (const _letter of wordLetters("CONNECT", {
      capHeight: 1.2,
      depth: 0.4,
      gap: 0.25,
      material: "shadeBlack",
      x: this.x + 1.95 + ((social.length - 1) * SPACING) / 2,
      y: this.y + 9.5,
    })) {
      this.objects.add({
        ..._letter,
        shadow: {
          sizeX: _letter.width * 1.4,
          sizeY: 1.4,
          offsetZ: -0.5,
          alpha: 0.4,
        },
        mass: 1.5,
        soundName: "brick",
      });
    }
  }

  setLinks() {
    // Only confirmed links are rendered: no links, no pads
    if (!social.length) {
      return;
    }

    // Set up
    this.links = {};
    this.links.x = 1.95;
    this.links.y = -1.5;
    this.links.halfExtents = { x: 1.35, y: 1.35 };
    this.links.distanceBetween = SPACING;
    this.links.labelWidth = this.links.halfExtents.x * 2 + 0.4;
    this.links.labelGeometry = new THREE.PlaneGeometry(
      this.links.labelWidth,
      this.links.labelWidth * 0.25,
      1,
      1,
    );
    this.links.labelOffset = -2;
    this.links.items = [];

    this.links.container = new THREE.Object3D();
    this.links.container.matrixAutoUpdate = false;
    this.container.add(this.links.container);

    social.forEach((_link, _index) => {
      const item = {};
      item.x = this.x + this.links.x + this.links.distanceBetween * _index;
      item.y = this.y + this.links.y;

      // Create area
      item.area = this.areas.add({
        position: new THREE.Vector2(item.x, item.y),
        halfExtents: new THREE.Vector2(
          this.links.halfExtents.x,
          this.links.halfExtents.y,
        ),
      });
      item.area.on("interact", () => {
        window.open(_link.href, "_blank", "noopener");
      });

      // Create label
      item.texture = alphaLabel(_link.name, { width: 512, height: 128 });
      item.labelMesh = new THREE.Mesh(
        this.links.labelGeometry,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(colors.primary),
          alphaMap: item.texture,
          depthTest: true,
          depthWrite: false,
          transparent: true,
        }),
      );
      item.labelMesh.position.x =
        item.x + this.links.labelWidth * 0.5 - this.links.halfExtents.x;
      item.labelMesh.position.y = item.y + this.links.labelOffset;
      item.labelMesh.matrixAutoUpdate = false;
      item.labelMesh.updateMatrix();
      this.links.container.add(item.labelMesh);

      // Pedestal with the link's initial standing on it
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 0.5));
      pedestal.name = "shadeWhite";
      const pedestalCollision = new THREE.Mesh(new THREE.BufferGeometry());
      pedestalCollision.name = "cube";
      pedestalCollision.scale.set(2.6, 2.6, 0.5);
      this.objects.add({
        base: { children: [pedestal] },
        collision: { children: [pedestalCollision] },
        offset: new THREE.Vector3(item.x, item.y + 4, 0.25),
        shadow: { sizeX: 3.4, sizeY: 3.4, offsetZ: -0.2, alpha: 0.35 },
        mass: 0,
      });

      // The link's icon standing on the pedestal (first letter when there is no icon for that name)
      const icon = iconFor(_link.name, {
        size: 2.4,
        material: "shadeSocial",
        x: item.x,
        y: item.y + 4,
      });
      const pieces = icon
        ? [icon]
        : wordLetters(_link.name.charAt(0).toUpperCase(), {
            capHeight: 1.6,
            depth: 0.5,
            material: "shadeSocial",
            x: item.x,
            y: item.y + 4,
          });
      for (const _piece of pieces) {
        this.objects.add({
          ..._piece,
          offset: _piece.offset.clone().setZ(0.5 + _piece.offset.z),
          shadow: { sizeX: 2, sizeY: 2, offsetZ: -0.5, alpha: 0.4 },
          mass: 1.5,
          soundName: "brick",
        });
      }

      this.links.items.push(item);
      this.destination = this.destination || { x: item.x, y: item.y };
    });
  }
}
