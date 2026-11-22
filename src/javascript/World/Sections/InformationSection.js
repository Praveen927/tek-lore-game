import * as THREE from 'three'
import { social } from '../../content/tekion.js'

export default class InformationSection
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

        this.setStatic()
        // this.setBaguettes() - removed in Phase 1
        this.setLinks()
        // this.setActivities() - removed in Phase 1
        this.setTiles()
    }

    setStatic()
    {
        this.objects.add({
            base: this.resources.items.informationStaticBase.scene,
            collision: this.resources.items.informationStaticCollision.scene,
            floorShadowTexture: this.resources.items.informationStaticFloorShadowTexture,
            offset: new THREE.Vector3(this.x, this.y, 0),
            mass: 0
        })
    }

    setLinks()
    {
        // Links populated from content/tekion.js in Phase 2
        // Zero social links means skip that block (section not rendered)
        this.links = {
            x: 1.95,
            y: -1.5,
            halfExtents: { x: 1, y: 1 },
            halfExtentsX: 1,
            halfExtentsY: 1,
            distanceBetween: 2.4,
            labelWidth: 3,
            labelGeometry: new THREE.PlaneGeometry(3, 0.75, 1, 1),
            labelOffset: -1.6,
            items: [],
            container: new THREE.Object3D(),
            options: []
        }

        this.links.container.matrixAutoUpdate = false
        this.container.add(this.links.container)

        // Populate links from config if social data exists
        if (social && social.length > 0)
        {
            // Map social links to the items format expected by the section
            this.links.items = social.map((_social) => ({
                id: _social.id || '',
                name: _social.name || '',
                desc: _social.desc || '',
                href: _social.href || '#',
                accent: _social.accent || '#ff8908'
            }))

            this.links.options = social.map(() => ({
                distanceBetween: 2.4
            }))
        }
    }

    setActivities()
    {
        // Activities removed in Phase 1 - content will be replaced in Phase 5 (Connect/About)
    }

    setTiles()
    {
        this.tiles.add({
            start: new THREE.Vector2(this.x - 1.2, this.y + 13),
            delta: new THREE.Vector2(0, -20)
        })
    }
}