import * as THREE from 'three'
import gsap from 'gsap'

import ProjectBoardMaterial from '../../Materials/ProjectBoard.js'
import Links from '../Links.js'
import { alphaLabel, alphaParagraph, boardImage, card } from '../Labels.js'
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
        this.passes = _options.passes
        this.objects = _options.objects
        this.areas = _options.areas
        this.zones = _options.zones
        this.x = _options.x
        this.y = _options.y
        this.items = _options.items
        this.tag = _options.tag
        this.interDistance = _options.interDistance || 11
        this.boardScale = _options.boardScale || 1.5 // boards are as tall as the buildings (about 5.5 units)
        this.accent = _options.accent || colors.primary

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

        this.destination = { x: this.boards[0].x, y: this.boards[0].y - 3.8 }
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
        this.geometries.floor = new THREE.PlaneGeometry(8, 1.8)
        this.geometries.text = new THREE.PlaneGeometry(8.4, 8.4 * 440 / 1400)
    }

    // The board model is scaled around its foot: children keep their own transforms, so scale position and size of each
    scaled(_scene)
    {
        return {
            children: _scene.children.map((_child) =>
            {
                const child = _child.clone()
                child.position.multiplyScalar(this.boardScale)
                child.scale.multiplyScalar(this.boardScale)
                return child
            })
        }
    }

    add(_item, _index)
    {
        // Centred on this.x; an odd count is shifted by half a step so a road at this.x never crosses a board
        const count = this.items.length
        const x = this.x + (_index - (count - 1) / 2 + (count % 2 ? 0.5 : 0)) * this.interDistance
        const y = this.y

        // Board structure with collision
        this.objects.add({
            base: this.scaled(this.resources.items.projectsBoardStructure.scene),
            collision: this.scaled(this.resources.items.projectsBoardCollision.scene),
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
        plane.scale.multiplyScalar(this.boardScale)
        plane.matrixAutoUpdate = false
        plane.updateMatrix()
        plane.material = new ProjectBoardMaterial()
        plane.material.uniforms.uColor.value = new THREE.Color(colors.primary)
        plane.material.uniforms.uTextureAlpha.value = 0
        this.container.add(plane)

        const showTexture = (_texture) =>
        {
            plane.material.uniforms.uTexture.value = _texture
            gsap.to(plane.material.uniforms.uTextureAlpha, { value: 1, duration: 1, delay: 1, ease: 'power4.inOut' })
        }
        const showCard = () => showTexture(card({ tag: this.tag, title: _item.name, body: _item.desc, index: _index, total: this.items.length, colors }))

        // With a picture the banner is just the picture (the text moves to the floor); without one it is the text card
        if(_item.image)
        {
            boardImage(_item.image).then(showTexture).catch(showCard)
        }
        else
        {
            showCard()
        }

        // Floor label (item name)
        const floorTexture = alphaLabel(_item.name, { width: 1024, height: 256 })
        const floor = new THREE.Mesh(this.geometries.floor, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: new THREE.Color(this.accent), alphaMap: floorTexture }))
        floor.position.set(x, y + 2.4, 0.1)
        floor.matrixAutoUpdate = false
        floor.updateMatrix()
        this.container.add(floor)

        // Description on the floor, below the name (only when the banner shows a picture instead of the text card)
        if(_item.image && _item.desc)
        {
            const text = new THREE.Mesh(this.geometries.text, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8, depthWrite: false, color: new THREE.Color(colors.text), alphaMap: alphaParagraph(_item.desc) }))
            text.position.set(x, y - 0.2, 0.1)
            text.matrixAutoUpdate = false
            text.updateMatrix()
            this.container.add(text)
        }

        // Link area
        const area = this.areas.add({
            position: new THREE.Vector2(x, y - 3.8),
            halfExtents: new THREE.Vector2(3, 1.2)
        })
        area.on('interact', () =>
        {
            window.open(_item.href, '_blank', 'noopener')
        })

        const areaLabel = this.meshes.areaLabel.clone()
        areaLabel.position.set(x, y - 3.8, 0.1)
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
        links.add({ x: first.x - 6, y: first.y - 5.8 }, { x: last.x + 6, y: last.y - 5.8 })
    }

    setZone()
    {
        const length = (this.boards.length - 1) * this.interDistance
        const zone = this.zones.add({
            position: { x: (this.boards[0].x + this.boards[this.boards.length - 1].x) * 0.5, y: this.y + 1.5 },
            halfExtents: { x: length * 0.5 + this.interDistance * 0.5, y: 11 }
        })

        // Sharp picture while on the row (the camera angle stays the same everywhere)
        zone.on('in', () =>
        {
            gsap.to(this.passes.horizontalBlurPass.material.uniforms.uStrength.value, { x: 0, duration: 2 })
            gsap.to(this.passes.verticalBlurPass.material.uniforms.uStrength.value, { y: 0, duration: 2 })
        })

        zone.on('out', () =>
        {
            gsap.to(this.passes.horizontalBlurPass.material.uniforms.uStrength.value, { x: this.passes.horizontalBlurPass.strength, duration: 2 })
            gsap.to(this.passes.verticalBlurPass.material.uniforms.uStrength.value, { y: this.passes.verticalBlurPass.strength, duration: 2 })
        })
    }
}
