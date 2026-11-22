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

/**
 * Frosted "glass" tag (floating cards in the reference). Transparent background, rounded corners.
 */
export function glassTag(_text, { width = 640, height = 190, tint = '#ffffff', text = '#2c3550' } = {})
{
    const element = canvas(width, height)
    const ctx = element.getContext('2d')
    const r = 34

    ctx.beginPath()
    ctx.roundRect(4, 4, width - 8, height - 8, r)
    ctx.fillStyle = tint
    ctx.globalAlpha = 0.88
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(190, 200, 225, 0.9)'
    ctx.stroke()

    ctx.fillStyle = text
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    let size = height * 0.36
    do
    {
        ctx.font = `700 ${size}px ${FONT}`
        size -= 3
    } while(ctx.measureText(_text).width > width - 150 && size > 14)
    ctx.fillText(_text, 110, height * 0.52)

    // Little round icon
    ctx.beginPath()
    ctx.arc(62, height * 0.5, 20, 0, Math.PI * 2)
    ctx.lineWidth = 5
    ctx.strokeStyle = text
    ctx.stroke()

    const texture = new THREE.CanvasTexture(element)
    texture.anisotropy = 4
    return texture
}

/**
 * Code window (the floating browser panel in the reference): title dots and coloured lines.
 */
export function codeWindow({ width = 640, height = 440 } = {})
{
    const element = canvas(width, height)
    const ctx = element.getContext('2d')

    ctx.beginPath()
    ctx.roundRect(4, 4, width - 8, height - 8, 36)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(190, 200, 225, 0.9)'
    ctx.stroke()

    ctx.fillStyle = '#c8cfe0'
    for(let i = 0; i < 3; i++)
    {
        ctx.beginPath()
        ctx.arc(52 + i * 36, 52, 11, 0, Math.PI * 2)
        ctx.fill()
    }

    ctx.beginPath()
    ctx.roundRect(60, 150, 130, 130, 28)
    ctx.fillStyle = '#4b7be5'
    ctx.fill()

    const lines = [[250, 140, 180, '#c3c9d8'], [250, 140, 90, '#7a5be0'], [250, 190, 220, '#6aa5ec'], [250, 190, 90, '#4b7be5'], [250, 240, 160, '#c3c9d8'], [250, 290, 130, '#7a5be0']]
    ctx.lineCap = 'round'
    ctx.lineWidth = 14
    lines.forEach(([x, y, length, color], i) =>
    {
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(x + (i % 2) * 20, y + 30)
        ctx.lineTo(x + (i % 2) * 20 + length, y + 30)
        ctx.stroke()
    })

    const texture = new THREE.CanvasTexture(element)
    texture.anisotropy = 4
    return texture
}

/**
 * Product picture as a rounded, framed card texture. Downscaled to keep GPU memory low.
 * Resolves with { texture, aspect } once the image has loaded.
 */
export function imageCard(_url, { width = 1280, radius = 44, border = 16, frame = '#2c3550' } = {})
{
    return new Promise((_resolve, _reject) =>
    {
        const image = new Image()
        image.onload = () =>
        {
            const aspect = image.naturalWidth / image.naturalHeight
            const height = Math.round(width / aspect)
            const element = canvas(width, height)
            const ctx = element.getContext('2d')

            ctx.beginPath()
            ctx.roundRect(0, 0, width, height, radius)
            ctx.fillStyle = frame
            ctx.fill()
            ctx.save()
            ctx.beginPath()
            ctx.roundRect(border, border, width - border * 2, height - border * 2, radius - border * 0.5)
            ctx.clip()
            ctx.drawImage(image, border, border, width - border * 2, height - border * 2)
            ctx.restore()

            const texture = new THREE.CanvasTexture(element)
            texture.colorSpace = THREE.SRGBColorSpace
            texture.anisotropy = 4
            _resolve({ texture, aspect })
        }
        image.onerror = _reject
        image.src = _url
    })
}
