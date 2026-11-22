import * as THREE from 'three'

// Text is generated at runtime (no baked images), so all copy can come from content/tekion.js

const FONT = '"Comic Neue", "Helvetica Neue", Arial, sans-serif'

function wrap(_ctx, _text, _maxWidth)
{
    const lines = []
    let line = ''

    for(const word of _text.split(/\s+/))
    {
        const test = line ? `${line} ${word}` : word
        if(line && _ctx.measureText(test).width > _maxWidth)
        {
            lines.push(line)
            line = word
        }
        else
        {
            line = test
        }
    }
    if(line)
    {
        lines.push(line)
    }

    return lines
}

function canvas(_width, _height)
{
    const element = document.createElement('canvas')
    element.width = _width
    element.height = _height
    return element
}

/**
 * White text on black, meant to be used as an alphaMap (floor labels, area labels)
 */
export function alphaLabel(_text, { width = 1024, height = 256, weight = 700 } = {})
{
    const element = canvas(width, height)
    const ctx = element.getContext('2d')

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    let size = height * 0.7
    do
    {
        ctx.font = `${weight} ${size}px ${FONT}`
        size -= 4
    } while(ctx.measureText(_text).width > width * 0.92 && size > 12)

    ctx.fillText(_text, width * 0.5, height * 0.52)

    const texture = new THREE.CanvasTexture(element)
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearFilter
    return texture
}

/**
 * Board card (title, body, tag), drawn for the board plane (aspect about 1.72)
 */
export function card({ tag = '', title = '', body = '', index = 0, total = 0, colors })
{
    const width = 1100
    const height = 640
    const element = canvas(width, height)
    const ctx = element.getContext('2d')
    const pad = 64

    // Background
    ctx.fillStyle = colors.surface
    ctx.fillRect(0, 0, width, height)

    // Accent band
    ctx.fillStyle = colors.accent
    ctx.fillRect(0, 0, width, 22)

    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    // Tag
    ctx.fillStyle = colors.accent
    ctx.font = `700 40px ${FONT}`
    ctx.fillText(tag.toUpperCase(), pad, 56)

    // Title
    ctx.fillStyle = colors.text
    let size = 92
    let lines = []
    do
    {
        ctx.font = `700 ${size}px ${FONT}`
        lines = wrap(ctx, title, width - pad * 2)
        size -= 4
    } while(lines.length > 3 && size > 40)

    let y = 120
    for(const line of lines)
    {
        ctx.fillText(line, pad, y)
        y += size * 1.2 + 6
    }

    // Body
    ctx.globalAlpha = 0.78
    ctx.font = `700 46px ${FONT}`
    const bodyLines = wrap(ctx, body, width - pad * 2)
    y += 14
    const maxLines = Math.max(1, Math.floor((height - 80 - y) / 58))
    for(let i = 0; i < Math.min(bodyLines.length, maxLines); i++)
    {
        let text = bodyLines[i]
        if(i === maxLines - 1 && bodyLines.length > maxLines)
        {
            text = text.replace(/[\s.,;:]*$/, '') + '…'
        }
        ctx.fillText(text, pad, y)
        y += 58
    }
    ctx.globalAlpha = 1

    // Counter
    if(total)
    {
        ctx.textAlign = 'right'
        ctx.fillStyle = colors.accent
        ctx.font = `700 30px ${FONT}`
        ctx.fillText(`${index + 1} / ${total}`, width - pad, height - 58)
    }

    const texture = new THREE.CanvasTexture(element)
    texture.anisotropy = 4
    return texture
}
