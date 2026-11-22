import * as THREE from 'three'
import gsap from 'gsap'

import ProjectBoardMaterial from '../../Materials/ProjectBoard.js'
import Links from '../Links.js'
import { alphaLabel, card } from '../Labels.js'
import { colors } from '../../content/tekion.js'

/**
 * A row of boards (one per content item) along +x, reusing the original board structure and plane.
 * Used for Products, Achievements and Testimonials: only the data, the tag and the prop change.
 *
 * options: x, y, items [{ name, desc, href }], tag
 */
export default class BoardsSection
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.resources = _options.resources
        this.camera = _options.camera
        this.passes = _options.passes
        this.objects = _options.objects
        this.areas = _options.areas
        this.zones = _options.zones
        this.x = _options.x
        this.y = _options.y
        this.items = _options.items
        this.tag = _options.tag
        this.interDistance = _options.interDistance || 9
        this.accent = _options.accent || colors.accent

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        if(!this.items.length)
        {
            return
        }

        this.setMeshes()

        this.boards = []
        this.items.forEach((_item, _index) => this.add(_item, _index))

        this.setRoad()
        this.setZone()
    }

    setMeshes()
    {
        this.meshes = {}

        this.resources.items.areaOpenTexture.magFilter = THREE.NearestFilter
        this.resources.items.areaOpenTexture.minFilter = THREE.LinearFilter
        this.meshes.boardPlane = this.resources.items.projectsBoardPlane.scene.children[0]
        this.meshes.areaLabel = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: 0x5b6785, alphaMap: this.resources.items.areaOpenTexture }))
        this.meshes.areaLabel.matrixAutoUpdate = false

        this.geometries = {}
        this.geometries.floor = new THREE.PlaneGeometry(7, 1.8)
    }

    add(_item, _index)
    {
        // Centred on this.x; an odd count is shifted by half a step so a road at this.x never crosses a board
        const count = this.items.length
        const x = this.x + (_index - (count - 1) / 2 + (count % 2 ? 0.5 : 0)) * this.interDistance
        const y = this.y

        // Board structure with collision
        this.objects.add({
            base: this.resources.items.projectsBoardStructure.scene,
            collision: this.resources.items.projectsBoardCollision.scene,
            floorShadowTexture: this.resources.items.projectsBoardStructureFloorShadowTexture,
            offset: new THREE.Vector3(x, y + 5, 0),
            rotation: new THREE.Euler(0, 0, 0),
            duplicated: true,
            mass: 0
        })

        // Board plane with generated card
        const plane = this.meshes.boardPlane.clone()
        plane.position.x = x
        plane.position.y = y + 5
        plane.matrixAutoUpdate = false
        plane.updateMatrix()
        plane.material = new ProjectBoardMaterial()
        plane.material.uniforms.uColor.value = new THREE.Color(colors.primary)
        plane.material.uniforms.uTexture.value = card({
            tag: this.tag,
            title: _item.name,
            body: _item.desc,
            index: _index,
            total: this.items.length,
            colors
        })
        plane.material.uniforms.uTextureAlpha.value = 0
        this.container.add(plane)
        gsap.to(plane.material.uniforms.uTextureAlpha, { value: 1, duration: 1, delay: 1, ease: 'power4.inOut' })

        // Floor label (item name)
        const floorTexture = alphaLabel(_item.name, { width: 1024, height: 256 })
        const floor = new THREE.Mesh(this.geometries.floor, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: new THREE.Color(this.accent), alphaMap: floorTexture }))
        floor.position.set(x, y - 0.5, 0.1)
        floor.matrixAutoUpdate = false
        floor.updateMatrix()
        this.container.add(floor)

        // Link area
        const area = this.areas.add({
            position: new THREE.Vector2(x, y - 3),
            halfExtents: new THREE.Vector2(3, 1.2)
        })
        area.on('interact', () =>
        {
            window.open(_item.href, '_blank', 'noopener')
        })

        const areaLabel = this.meshes.areaLabel.clone()
        areaLabel.position.set(x, y - 3, 0.1)
        areaLabel.matrixAutoUpdate = false
        areaLabel.updateMatrix()
        this.container.add(areaLabel)

        this.boards.push({ x, y })
    }

    setRoad()
    {
        // One road along the row, like the links of the campus
        const links = new Links({ time: this.time, container: this.container })
        const first = this.boards[0]
        const last = this.boards[this.boards.length - 1]
        links.add({ x: first.x - 6, y: first.y - 5 }, { x: last.x + 6, y: last.y - 5 })
    }

    setZone()
    {
        const length = (this.boards.length - 1) * this.interDistance
        const zone = this.zones.add({
            position: { x: (this.boards[0].x + this.boards[this.boards.length - 1].x) * 0.5, y: this.y + 1.5 },
            halfExtents: { x: length * 0.5 + this.interDistance * 0.5, y: 11 },
            data: { cameraAngle: 'projects' }
        })

        zone.on('in', (_data) =>
        {
            this.camera.angle.set(_data.cameraAngle)
            gsap.to(this.passes.horizontalBlurPass.material.uniforms.uStrength.value, { x: 0, duration: 2 })
            gsap.to(this.passes.verticalBlurPass.material.uniforms.uStrength.value, { y: 0, duration: 2 })
        })

        zone.on('out', () =>
        {
            this.camera.angle.set('default')
            gsap.to(this.passes.horizontalBlurPass.material.uniforms.uStrength.value, { x: this.passes.horizontalBlurPass.strength, duration: 2 })
            gsap.to(this.passes.verticalBlurPass.material.uniforms.uStrength.value, { y: this.passes.verticalBlurPass.strength, duration: 2 })
        })
    }
}
