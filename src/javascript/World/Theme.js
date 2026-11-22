import * as THREE from 'three'

// Matcap = a pre-lit sphere image. Generating it from one colour lets the whole world follow the palette in content/tekion.js.
export function matcapTexture(_hex, _size = 256, _dirt = 0, _shade = 0.55)
{
    const base = new THREE.Color(_hex)
    const light = base.clone().lerp(new THREE.Color('#ffffff'), 0.45)
    const dark = base.clone().multiplyScalar(_shade)

    const element = document.createElement('canvas')
    element.width = element.height = _size
    const ctx = element.getContext('2d')

    const gradient = ctx.createRadialGradient(_size * 0.38, _size * 0.32, _size * 0.02, _size * 0.5, _size * 0.5, _size * 0.5)
    gradient.addColorStop(0, `#${light.getHexString()}`)
    gradient.addColorStop(0.55, `#${base.getHexString()}`)
    gradient.addColorStop(1, `#${dark.getHexString()}`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, _size, _size)

    // Dirt: the bottom of a matcap is what faces down/sideways, i.e. the lower body panels
    if(_dirt)
    {
        const mud = ctx.createLinearGradient(0, _size * 0.5, 0, _size)
        mud.addColorStop(0, 'rgba(84, 72, 58, 0)')
        mud.addColorStop(1, `rgba(84, 72, 58, ${_dirt})`)
        ctx.fillStyle = mud
        ctx.fillRect(0, 0, _size, _size)
    }

    return new THREE.CanvasTexture(element)
}
