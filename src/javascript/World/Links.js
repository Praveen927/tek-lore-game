import * as THREE from 'three'

// Roads as in the reference: thin white lines on the floor with a light-blue pulse travelling along them.
// Pulse idea ported from TekionSection.js in tekion-campus.patch.
const PERIOD = 6000 // ms between pulses on a given link
const TRAVEL = 1800 // ms a pulse takes to cross a link

let pulseTexture = null
function getPulseTexture()
{
    if(!pulseTexture)
    {
        const element = document.createElement('canvas')
        element.width = 128
        element.height = 4
        const ctx = element.getContext('2d')
        const gradient = ctx.createLinearGradient(0, 0, 128, 0)
        gradient.addColorStop(0, 'rgba(0,203,247,0)')
        gradient.addColorStop(0.8, 'rgba(0,203,247,0.9)')
        gradient.addColorStop(1, 'rgba(255,255,255,1)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 128, 4)
        pulseTexture = new THREE.CanvasTexture(element)
    }
    return pulseTexture
}

export default class Links
{
    constructor(_options)
    {
        this.time = _options.time
        this.container = _options.container
        this.items = []

        this.lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 })
        this.pulseGeometry = new THREE.PlaneGeometry(1, 0.55)

        this.time.on('tick', () =>
        {
            for(const _item of this.items)
            {
                const t = ((this.time.elapsed + _item.offset) % PERIOD) / TRAVEL
                _item.pulse.visible = t < 1
                if(t < 1)
                {
                    // Head of the pulse travels from `from` to `to`
                    _item.pulse.position.lerpVectors(_item.from, _item.to, t)
                    _item.pulse.position.x -= Math.cos(_item.angle) * 2
                    _item.pulse.position.y -= Math.sin(_item.angle) * 2
                    _item.pulse.position.z = 0.05
                    _item.pulse.material.opacity = Math.sin(t * Math.PI)
                }
            }
        })
    }

    add(_from, _to, { pulse = true } = {})
    {
        const from = new THREE.Vector3(_from.x, _from.y, 0.02)
        const to = new THREE.Vector3(_to.x, _to.y, 0.02)
        const length = from.distanceTo(to)
        const angle = Math.atan2(to.y - from.y, to.x - from.x)
        const middle = from.clone().lerp(to, 0.5)

        const line = new THREE.Mesh(new THREE.PlaneGeometry(length, 0.3), this.lineMaterial)
        line.position.set(middle.x, middle.y, 0.01)
        line.rotation.z = angle
        this.container.add(line)

        if(!pulse)
        {
            return
        }

        const material = new THREE.MeshBasicMaterial({ map: getPulseTexture(), transparent: true, depthWrite: false, opacity: 0 })
        const mesh = new THREE.Mesh(this.pulseGeometry, material)
        mesh.rotation.z = angle
        mesh.scale.x = 4
        mesh.visible = false
        this.container.add(mesh)

        this.items.push({ from, to, angle, pulse: mesh, offset: (this.items.length * 1370) % PERIOD })
    }
}
