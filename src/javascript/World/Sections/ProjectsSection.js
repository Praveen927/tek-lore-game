import * as THREE from 'three'
import Project from './Project'
import { products } from '../../content/tekion.js'
import gsap from 'gsap'

export default class ProjectsSection
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
        this.tiles = _options.tiles
        this.debug = _options.debug
        this.x = _options.x
        this.y = _options.y

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('projects')
            this.debugFolder.open()
        }

        // Set up
        this.items = []

        this.interDistance = 24
        this.positionRandomess = 5
        this.projectHalfWidth = 9

        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        this.setGeometries()
        this.setMeshes()
        this.setList()
        this.setZone()

        // Add all project from the list
        for(const _options of this.list)
        {
            this.add(_options)
        }
    }

    setGeometries()
    {
        this.geometries = {}
        this.geometries.floor = new THREE.PlaneGeometry(16, 8)
    }

    setMeshes()
    {
        this.meshes = {}

        // this.meshes.boardStructure = this.objects.getConvertedMesh(this.resources.items.projectsBoardStructure.scene.children, { floorShadowTexture: this.resources.items.projectsBoardStructureFloorShadowTexture })\n        this.resources.items.areaOpenTexture.magFilter = THREE.NearestFilter\n        this.resources.items.areaOpenTexture.minFilter = THREE.LinearFilter\n        this.meshes.boardPlane = this.resources.items.projectsBoardPlane.scene.children[0]\n        this.meshes.areaLabel = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: 0xffffff, alphaMap: this.resources.items.areaOpenTexture }))\n        this.meshes.areaLabel.matrixAutoUpdate = false
    }

    setList()
    {
        // Product entries - kept empty for Phase 2
        // Products data is available via content/tekion.js config for Phase 3
        // Keeping empty list ensures section renders without breaking existing functionality
        this.list = []
    }

    add(_options)
    {
        const project = new Project({
            time: this.time,
            resources: this.resources,
            objects: this.objects,
            areas: this.areas,
            debug: this.debug,
            name: _options.name,
            x: _options.x,
            y: _options.y,
            imageSources: _options.imageSources,
            floorTexture: _options.floorTexture,
            link: _options.link,
            distinctions: _options.distinctions
        })
        this.container.add(project.container)
        this.items.push(project)
    }
}