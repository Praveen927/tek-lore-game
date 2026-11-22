import * as THREE from 'three'
import gsap from 'gsap'

import Links from '../Links.js'
import { buildingTypes, serverFarm } from '../Buildings.js'
import { alphaLabel, card, codeWindow, glassTag, imageCard } from '../Labels.js'
import { products, hubCards, colors } from '../../content/tekion.js'

// The campus from the reference: a glass server farm in the middle, one building per product around it,
// each connected to the farm by a road with a travelling pulse.
export default class CampusSection
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.areas = _options.areas
        this.passes = _options.passes
        this.debug = _options.debug
        this.x = _options.x
        this.y = _options.y

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        this.links = new Links({ time: this.time, container: this.container })

        this.displays = []
        this.focused = false

        this.setHub()
        this.setBuildings()
        this.setReveal()
    }

    setHub()
    {
        const farm = serverFarm()
        this.objects.add({
            ...farm,
            offset: new THREE.Vector3(this.x, this.y, 0),
            mass: 0
        })

        // Translucent glass tray under the racks (visual only, the collision comes from the farm)
        const width = farm.width + 0.8
        const depth = farm.depth + 1.2
        const shape = new THREE.Shape()
        shape.absarc(width * 0.5 - 2, depth * 0.5 - 2, 2, 0, Math.PI * 0.5)
        shape.absarc(- width * 0.5 + 2, depth * 0.5 - 2, 2, Math.PI * 0.5, Math.PI)
        shape.absarc(- width * 0.5 + 2, - depth * 0.5 + 2, 2, Math.PI, Math.PI * 1.5)
        shape.absarc(width * 0.5 - 2, - depth * 0.5 + 2, 2, Math.PI * 1.5, Math.PI * 2)
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false })
        const tray = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xdce8f8, transparent: true, opacity: 0.55, depthWrite: false }))
        tray.position.set(this.x, this.y, 0)
        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: 0xffffff }))
        edge.position.copy(tray.position)
        this.container.add(tray, edge)

        // Floating cards behind the racks
        hubCards.forEach((_text, _index) =>
        {
            const tag = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.5), new THREE.MeshBasicMaterial({ map: glassTag(_text, { tint: _index === 0 ? '#dff5d2' : '#ffffff' }), transparent: true, depthWrite: false }))
            tag.rotation.x = Math.PI * 0.5
            tag.position.set(this.x - 6 + _index * 0.5, this.y + depth * 0.5 + 1.5, 3 + _index * 2.1)
            this.container.add(tag)
        })

        const code = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.6), new THREE.MeshBasicMaterial({ map: codeWindow(), transparent: true, depthWrite: false }))
        code.rotation.x = Math.PI * 0.5
        code.position.set(this.x + 6.5, this.y + depth * 0.5 + 1.5, 5)
        this.container.add(code)

        this.hub = new THREE.Vector2(this.x, this.y)
    }

    setBuildings()
    {
        const rx = 34
        const ry = 24
        const count = products.length

        products.forEach((_product, _index) =>
        {
            // Spread around the farm, offset so the road from the intro runs between two buildings
            const angle = Math.PI * 0.5 + (_index + 0.5) * Math.PI * 2 / count
            const x = this.x + Math.cos(angle) * rx
            const y = this.y + Math.sin(angle) * ry
            const yaw = (((_index * 37) % 7) - 3) * 0.07

            const building = buildingTypes[_index % buildingTypes.length]()
            this.objects.add({
                ...building,
                offset: new THREE.Vector3(x, y, 0),
                rotation: new THREE.Euler(0, 0, yaw),
                shadow: { sizeX: building.width * 1.25, sizeY: building.depth * 1.25, offsetZ: 0.02, alpha: 0.28 },
                mass: 0
            })

            // Road: from the farm to the building's door
            const door = new THREE.Vector2(x, y - building.depth * 0.5 - 2)
            this.links.add(this.hub, door)

            // Name on the floor + link area in front of the door
            const label = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: new THREE.Color(colors.accent), alphaMap: alphaLabel(_product.name) }))
            label.position.set(x, y - building.depth * 0.5 - 4.6, 0.1)
            this.container.add(label)

            const area = this.areas.add({
                position: new THREE.Vector2(x, y - building.depth * 0.5 - 7.6),
                halfExtents: new THREE.Vector2(3, 1.2)
            })
            area.on('interact', () =>
            {
                window.open(_product.href, '_blank', 'noopener')
            })

            const open = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: 0x5b6785, alphaMap: this.resources.items.areaOpenTexture }))
            open.position.set(x, y - building.depth * 0.5 - 7.6, 0.1)
            this.container.add(open)

            // Floating display above the roof: the product picture, or the banner card when there is none.
            // Hidden until the car comes close (see setReveal).
            const display = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
            display.rotation.x = Math.PI * 0.5 - 0.5 // leans back towards the camera
            display.position.set(x, y - building.depth * 0.25, 0) // over the front half of the roof, closer to the car
            display.visible = false
            this.container.add(display)

            const bannerWidth = 6
            display.material.map = card({ tag: 'Product', title: _product.name, body: _product.desc, index: _index, total: count, colors })
            display.userData.size = new THREE.Vector2(bannerWidth, bannerWidth * 640 / 1100)
            display.scale.set(display.userData.size.x, display.userData.size.y, 1)

            if(_product.image)
            {
                // Keep the banner until the picture has loaded (and as the fallback if it fails)
                imageCard(_product.image).then(({ texture, aspect }) =>
                {
                    display.material.map = texture
                    display.material.needsUpdate = true
                    display.userData.size.set(bannerWidth * 1.4, bannerWidth * 1.4 / aspect)
                }).catch(() => {})
            }

            // Distance is measured to the entrance (the OPEN pad), where the car actually goes
            this.displays.push({ mesh: display, x, y: y - building.depth * 0.5 - 7.6, roof: building.height + 0.4 })
        })
    }

    // Show only the display of the building whose entrance the car is closest to, and only when it is close
    setReveal()
    {
        const distance = 13
        this.time.on('tick', () =>
        {
            const car = this.areas.car
            if(!car || !this.displays.length)
            {
                return
            }

            let nearest = null
            let nearestDistance = distance
            for(const _display of this.displays)
            {
                const d = Math.hypot(car.position.x - _display.x, car.position.y - _display.y)
                if(d < nearestDistance)
                {
                    nearest = _display
                    nearestDistance = d
                }
            }

            // Sharp picture: no tilt-shift blur while a display is up
            if(!!nearest !== this.focused)
            {
                this.focused = !!nearest
                gsap.to(this.passes.horizontalBlurPass.material.uniforms.uStrength.value, { x: this.focused ? 0 : this.passes.horizontalBlurPass.strength, duration: 1.5 })
                gsap.to(this.passes.verticalBlurPass.material.uniforms.uStrength.value, { y: this.focused ? 0 : this.passes.verticalBlurPass.strength, duration: 1.5 })
            }

            for(const _display of this.displays)
            {
                const material = _display.mesh.material
                material.opacity += ((_display === nearest ? 1 : 0) - material.opacity) * 0.12
                if(_display === nearest && material.opacity > 0.98)
                {
                    material.opacity = 1
                }
                // Fully visible = fully opaque (a transparent, non-depth-writing plane looks see-through)
                material.transparent = material.opacity < 1
                material.depthWrite = material.opacity === 1
                if(_display !== nearest && material.opacity < 0.01)
                {
                    material.opacity = 0
                }
                _display.mesh.visible = material.opacity > 0
                const size = _display.mesh.userData.size
                const pop = 0.88 + material.opacity * 0.12
                _display.mesh.scale.set(size.x * pop, size.y * pop, 1)
                _display.mesh.position.z = _display.roof + size.y * pop * 0.5 // sits just above its own roof
            }
        })
    }
}
