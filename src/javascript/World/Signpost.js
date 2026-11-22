import * as THREE from 'three'
import { wordGeometry } from './Words.js'

/**
 * Generated signpost (replaces the signs that were baked into the original crossroads model).
 * Returns objects.add() options for a static object. `direction`: 'right' | 'left' | 'none'
 */
export function signpost(_text, { direction = 'right', x = 0, y = 0 } = {})
{
    const textGeometry = wordGeometry(_text, { capHeight: 0.42, depth: 0.05, gap: 0.05 })
    const textWidth = textGeometry.userData.size.x

    const width = textWidth + 1.1
    const height = 0.9
    const tip = direction === 'none' ? 0 : 0.45
    const sign = direction === 'left' ? -1 : 1

    // Board outline (arrow when it has a direction)
    const shape = new THREE.Shape()
    const half = width * 0.5
    const points = [
        [- half * sign, - height * 0.5],
        [(half - tip) * sign, - height * 0.5],
        [half * sign, 0],
        [(half - tip) * sign, height * 0.5],
        [- half * sign, height * 0.5]
    ]
    if(tip === 0)
    {
        points[2] = [half * sign, - height * 0.5]
        points[1] = [half * sign, - height * 0.5]
        points[3] = [half * sign, height * 0.5]
    }
    shape.moveTo(...points[0])
    for(let i = 1; i < points.length; i++)
    {
        shape.lineTo(...points[i])
    }
    shape.closePath()

    const board = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false })
    board.rotateX(Math.PI * 0.5)
    board.translate(0, 0.08, 1.25)

    const post = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8)
    post.rotateX(Math.PI * 0.5)
    post.translate(0, 0, 0)

    textGeometry.translate(- tip * sign * 0.4, -0.12, 1.25)

    const postMesh = new THREE.Mesh(post)
    postMesh.name = 'shadeBrown'
    const boardMesh = new THREE.Mesh(board)
    boardMesh.name = 'shadeWhite'
    const textMesh = new THREE.Mesh(textGeometry)
    textMesh.name = 'shadeBlack'

    const collision = new THREE.Mesh(new THREE.BufferGeometry())
    collision.name = 'cylinder'
    collision.scale.set(0.15, 0.15, 2.5)

    return {
        base: { children: [postMesh, boardMesh, textMesh] },
        collision: { children: [collision] },
        offset: new THREE.Vector3(x, y, 1.25),
        rotation: new THREE.Euler(0, 0, 0),
        mass: 0
    }
}
