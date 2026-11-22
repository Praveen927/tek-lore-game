import config from '../../../config.json';

// Brand tokens extracted from Tekion branding
export const brand = {
  name: config.name || 'Tekion',
  tagline: config.tagline || 'Driving the future of commerce',
  description: config.description || 'Tekion is a SaaS company transforming the automotive industry',
  url: config.url || '/',
  colors: {
    primary: config.colors?.primary || '#1a1a1a',
    secondary: config.colors?.secondary || '#ffffff',
    accent: config.colors?.accent || '#ff8908'
  }
};

// Social links - D2: only confirmed links (populated from config)
export const social = config.social || [];

// Products - D4: product list for the Products section
// Populated from config.json products array
export const products = config.products || [];

// Achievements - D5: achievement entries
// Populated from config.json achievements array
export const achievements = config.achievements || [];

// Testimonials - D6: testimonial entries
// Populated from config.json testimonials array
export const testimonials = config.testimonials || [];

export default {
  brand,
  social,
  products,
  achievements,
  testimonials
};