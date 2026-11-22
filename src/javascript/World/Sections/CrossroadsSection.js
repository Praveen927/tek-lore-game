import * as THREE from 'three'

import { signpost } from '../Signpost.js'
import { productCube, trophy } from '../Props.js'

// Hub of the world: generated plinth and signposts (the original baked model had person-specific statues and signs)
export default class CrossroadsSection
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.areas = _options.areas
        this.tiles = _options.tiles
        this.debug = _options.debug
        this.x = _options.x
        this.y = _options.y

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        this.setPlinth()
        this.setSigns()
        this.setTiles()
    }

    setPlinth()
    {
        // Static plinth
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 0.5))
        plinth.name = 'shadeWhite'
        const step = new THREE.Mesh(new THREE.BoxGeometry(5.4, 5.4, 0.3))
        step.name = 'shadeWhite'
        step.position.z = 0.4

        const collision = new THREE.Mesh(new THREE.BufferGeometry())
        collision.name = 'cube'
        collision.scale.set(7, 7, 0.5)

        this.objects.add({
            base: { children: [plinth, step] },
            collision: { children: [collision] },
            offset: new THREE.Vector3(this.x, this.y, 0.25),
            shadow: { sizeX: 8.5, sizeY: 8.5, offsetZ: - 0.2, alpha: 0.35 },
            mass: 0
        })

        // Movable props on top
        const top = 0.55
        const cube = productCube()
        for(const [dx, dy] of [[-1.2, 0.6], [0.2, 0.9], [-0.4, -0.9]])
        {
            this.objects.add({
                base: cube.base,
                collision: cube.collision,
                offset: new THREE.Vector3(this.x + dx, this.y + dy, top + cube.height),
                duplicated: true,
                shadow: cube.shadow,
                mass: 1.5,
                soundName: 'brick'
            })
        }

        const cup = trophy()
        this.objects.add({
            base: cup.base,
            collision: cup.collision,
            offset: new THREE.Vector3(this.x + 1.4, this.y - 0.6, top + cup.height),
            duplicated: true,
            shadow: cup.shadow,
            mass: 1.5,
            soundName: 'brick'
        })
    }

    setSigns()
    {
        const signs = [
            { text: 'PRODUCTS', direction: 'right', x: 9, y: 3 },
            { text: 'PLAYGROUND', direction: 'left', x: - 9, y: 3 },
            { text: 'CONNECT', direction: 'none', x: - 4.5, y: - 7 },
            { text: 'ACHIEVEMENTS', direction: 'none', x: 9.5, y: - 7 },
            { text: 'TESTIMONIALS', direction: 'none', x: 9.5, y: - 13 }
        ]

        for(const _sign of signs)
        {
            this.objects.add(signpost(_sign.text, { direction: _sign.direction, x: this.x + _sign.x, y: this.y + _sign.y }))
        }
    }

    setTiles()
    {
        // To intro
        this.tiles.add({
            start: new THREE.Vector2(this.x, - 10),
            delta: new THREE.Vector2(0, this.y + 14)
        })

        // To products
        this.tiles.add({
            start: new THREE.Vector2(this.x + 12.5, this.y),
            delta: new THREE.Vector2(7.5, 0)
        })

        // To playground
        this.tiles.add({
            start: new THREE.Vector2(this.x - 13, this.y),
            delta: new THREE.Vector2(- 6, 0)
        })

        // To achievements, then testimonials
        this.tiles.add({
            start: new THREE.Vector2(this.x + 8, this.y - 8),
            delta: new THREE.Vector2(12, - 32)
        })
    }
}
