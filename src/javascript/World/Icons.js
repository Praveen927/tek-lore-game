import * as THREE from 'three'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import youtube from '../../images/social/youtube.svg?raw'
import linkedin from '../../images/social/linkedin.svg?raw'
import instagram from '../../images/social/instagram.svg?raw'
import mail from '../../images/social/envelope-fill.svg?raw'

// Social icons, extruded from SVG so they match the world (same matcap materials, physical, knock-over-able).
// Keys are matched against the lower-cased link name from config.json.
const ICONS = { youtube, linkedin, instagram, email: mail, mail }

const loader = new SVGLoader()

/**
 * Returns objects.add() options for a standing 3D icon, or null when there is no icon for that name
 * (the caller falls back to the first letter).
 */
export function iconFor(_name, { size = 1.7, depth = 0.45, material = 'shadeTitle', x = 0, y = 0 } = {})
{
    const svg = ICONS[_name.trim().toLowerCase()]
    if(!svg)
    {
        return null
    }

    const data = loader.parse(svg)
    const geometries = []
    for(const path of data.paths)
    {
        for(const shape of SVGLoader.createShapes(path))
        {
            geometries.push(new THREE.ExtrudeGeometry(shape, { depth: 16 * depth / size, bevelEnabled: false, curveSegments: 10 }))
        }
    }

    // SVG space (x right, y down, extrusion +z) -> world (x right, z up, extrusion away from the camera at -y)
    const geometry = mergeGeometries(geometries)
    geometry.applyMatrix4(new THREE.Matrix4().set(
        1, 0, 0, 0,
        0, 0, 1, 0,
        0, -1, 0, 0,
        0, 0, 0, 1
    ))
    geometry.scale(size / 16, size / 16, size / 16)

    geometry.computeBoundingBox()
    const box = geometry.boundingBox
    const center = box.getCenter(new THREE.Vector3())
    geometry.translate(-center.x, -center.y, -center.z)
    const dimensions = box.getSize(new THREE.Vector3())

    const visual = new THREE.Mesh(geometry)
    visual.name = material

    const collision = new THREE.Mesh(new THREE.BufferGeometry())
    collision.name = 'cube'
    collision.scale.copy(dimensions)

    return {
        base: { children: [visual] },
        collision: { children: [collision] },
        offset: new THREE.Vector3(x, y, dimensions.z * 0.5),
        width: dimensions.x
    }
}
