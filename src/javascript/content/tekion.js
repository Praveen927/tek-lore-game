// Single source of truth for all Tekion copy and links.
// Data comes from the (git-ignored) root config.json; a fresh clone falls back to config.example.json.
const files = import.meta.glob('../../../config{,.example}.json', { eager: true, import: 'default' })
const config = files['../../../config.json'] || files['../../../config.example.json'] || {}

// Palette: neutral defaults until real brand colours are confirmed. Override via config.json "colors".
export const colors = {
    primary: '#1b1f2a',
    accent: '#2f6bff',
    surface: '#f4f6fb',
    text: '#1b1f2a',
    tree: '#5fc4a8',
    shadow: '#2a3a8f',
    beige: '#e6eaf5',
    brown: '#5a6785',
    glow: '#dfe8ff',
    floor: { topLeft: '#7186bd', topRight: '#8196cc', bottomRight: '#e3e9f8', bottomLeft: '#a8b8e0' },
    ...config.colors
}

export const brand = {
    name: config.name || 'Tekion',
    tagline: config.tagline || ''
}

export const social = config.social || []
export const products = config.products || []
export const achievements = config.achievements || []
export const testimonials = config.testimonials || []

export default { brand, colors, social, products, achievements, testimonials }
