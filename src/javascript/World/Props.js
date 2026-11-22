import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Procedural physical props (trophy, quote mark, product cube): visual meshes named `shadeXxx`
// (matcap material lookup) and collision meshes named `cube`/`cylinder` (see Objects/Physics).
// Everything is centred on the body origin, z is up.

function mesh(_geometry, _name)
{
    const result = new THREE.Mesh(_geometry)
    result.name = _name
    return result
}

function collisionBox(_x, _y, _z, _px = 0, _py = 0, _pz = 0)
{
    const box = new THREE.Mesh(new THREE.BufferGeometry())
    box.name = 'cube'
    box.scale.set(_x, _y, _z)
    box.position.set(_px, _py, _pz)
    return box
}

function wrapProp(_visual, _collision, _height, _shadow)
{
    return {
        base: { children: _visual },
        collision: { children: _collision },
        height: _height,
        shadow: _shadow
    }
}

/** Gold cup: lathe body, stem, base and two handles */
export function trophy()
{
    const profile = [
        [0.0, 0.0], [0.34, 0.0], [0.34, 0.1], [0.14, 0.18], [0.1, 0.5],
        [0.2, 0.62], [0.52, 0.78], [0.62, 1.2], [0.5, 1.22], [0.0, 1.0]
    ].map(([x, y]) => new THREE.Vector2(x, y))

    const body = new THREE.LatheGeometry(profile, 20)
    body.rotateX(Math.PI * 0.5)
    body.translate(0, 0, -0.6)

    const handleLeft = new THREE.TorusGeometry(0.28, 0.06, 8, 14, Math.PI)
    handleLeft.rotateY(Math.PI * 0.5)
    handleLeft.rotateZ(Math.PI * 0.5)
    handleLeft.translate(-0.62, 0, 0.3)
    const handleRight = handleLeft.clone()
    handleRight.scale(-1, 1, 1)

    const parts = [
        mesh(body, 'shadeOrange'),
        mesh(handleLeft, 'shadeOrange'),
        mesh(handleRight, 'shadeOrange')
    ]

    const collision = [
        collisionBox(1.2, 1.2, 1.2)
    ]

    return wrapProp(parts, collision, 0.6, { sizeX: 1.6, sizeY: 1.6, offsetZ: -0.5, alpha: 0.4 })
}

/** Quote mark: two dots with tails (closing quote shape), extruded */
export function quote()
{
    const dot = new THREE.Shape()
    dot.absarc(0, 0.3, 0.5, 0, Math.PI * 2, false)
    const tail = new THREE.Shape()
    tail.moveTo(0.5, 0.3)
    tail.lineTo(-0.3, -0.85)
    tail.lineTo(-0.5, 0.2)
    tail.closePath()

    const options = { depth: 0.45, bevelEnabled: false, curveSegments: 14 }
    const parts = []
    for(const x of [-0.75, 0.75])
    {
        for(const shape of [dot, tail])
        {
            const geometry = new THREE.ExtrudeGeometry(shape, options)
            geometry.rotateX(Math.PI * 0.5)
            geometry.translate(x, 0.22, 0)
            parts.push(geometry)
        }
    }

    const merged = mergeGeometries(parts)
    merged.computeBoundingBox()
    const size = merged.boundingBox.getSize(new THREE.Vector3())
    const center = merged.boundingBox.getCenter(new THREE.Vector3())
    merged.translate(-center.x, -center.y, -center.z)

    return wrapProp([mesh(merged, 'shadeWhite')], [collisionBox(size.x, size.y, size.z)], size.z * 0.5, { sizeX: 2.2, sizeY: 1, offsetZ: - 0.7, alpha: 0.35 })
}

/** Product cube: a box with a smaller lid, reads as a software "module" */
export function productCube()
{
    const body = new THREE.BoxGeometry(1.2, 1.2, 1.0)
    const lid = new THREE.BoxGeometry(0.8, 0.8, 0.35)
    lid.translate(0, 0, 0.675)

    const parts = [mesh(body, 'shadeWhite'), mesh(lid, 'shadeOrange')]
    const collision = [collisionBox(1.2, 1.2, 1.4, 0, 0, 0.1)]

    return wrapProp(parts, collision, 0.7, { sizeX: 1.6, sizeY: 1.6, offsetZ: -0.6, alpha: 0.4 })
}

export default { trophy, quote, productCube }
