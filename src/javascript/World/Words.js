import * as THREE from 'three'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import fontData from 'three/examples/fonts/helvetiker_bold.typeface.json'

const font = new FontLoader().parse(fontData)

/**
 * Builds a word as one physical object per letter (like the original intro title).
 * Letters stand upright: text x -> world x, text y -> world z (up), extrusion -> world -y (towards the camera).
 *
 * Returns a list of options ready for `objects.add()` (the caller adds mass, sounds, etc.)
 */
export function wordLetters(_text, { capHeight = 1.4, depth = 0.43, gap = 0.3, material = 'shadeWhite', x = 0, y = 0 } = {})
{
    const size = capHeight / 0.72 // helvetiker cap height is about 0.72 of the font size
    const letters = []

    for(const char of _text)
    {
        if(char === ' ')
        {
            letters.push(null)
            continue
        }

        const geometry = new TextGeometry(char, {
            font,
            size,
            depth,
            curveSegments: 6,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.025,
            bevelSegments: 2
        })

        // Stand the letter up, then centre it on its own bounding box
        geometry.rotateX(Math.PI * 0.5)
        geometry.computeBoundingBox()
        const box = geometry.boundingBox
        const center = box.getCenter(new THREE.Vector3())
        geometry.translate(-center.x, -center.y, -center.z)

        const dimensions = box.getSize(new THREE.Vector3())
        letters.push({ geometry, dimensions })
    }

    // Layout: letters side by side, centred on x
    const spaceWidth = capHeight * 0.6
    const total = letters.reduce((_sum, _letter) => _sum + (_letter ? _letter.dimensions.x : spaceWidth) + gap, -gap)
    let cursor = x - total * 0.5

    const result = []
    for(const letter of letters)
    {
        if(!letter)
        {
            cursor += spaceWidth + gap
            continue
        }

        const { geometry, dimensions } = letter

        const visual = new THREE.Mesh(geometry)
        visual.name = material

        const collision = new THREE.Mesh(new THREE.BufferGeometry())
        collision.name = 'cube'
        collision.scale.copy(dimensions)

        result.push({
            base: { children: [visual] },
            collision: { children: [collision] },
            offset: new THREE.Vector3(cursor + dimensions.x * 0.5, y, dimensions.z * 0.5),
            width: dimensions.x
        })

        cursor += dimensions.x + gap
    }

    return result
}

/**
 * One merged geometry for a whole word (signs, plaques), centred on its bounding box.
 * Same orientation as wordLetters: reads along x, up is z, extrusion goes towards -y.
 */
export function wordGeometry(_text, { capHeight = 0.5, depth = 0.08, gap = 0.06 } = {})
{
    const letters = wordLetters(_text, { capHeight, depth, gap })
    const geometries = letters.map((_letter) =>
    {
        const geometry = _letter.base.children[0].geometry.clone()
        geometry.translate(_letter.offset.x, 0, 0)
        return geometry
    })

    const merged = mergeGeometries(geometries)
    merged.computeBoundingBox()
    const size = merged.boundingBox.getSize(new THREE.Vector3())
    merged.translate(0, 0, 0)
    merged.userData.size = size
    return merged
}
