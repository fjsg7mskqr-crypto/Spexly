import { describe, it, expect } from 'vitest'
import { BUILTIN_TEMPLATES, getBuiltInTemplate, getBuiltInTemplatesByCategory } from './builtInTemplates'

describe('BUILTIN_TEMPLATES', () => {
  it('each template has valid id, name, description, category, nodes, and edges', () => {
    for (const template of BUILTIN_TEMPLATES) {
      expect(typeof template.id).toBe('string')
      expect(template.id.length).toBeGreaterThan(0)
      expect(typeof template.name).toBe('string')
      expect(template.name.length).toBeGreaterThan(0)
      expect(typeof template.description).toBe('string')
      expect(['MVP', 'Feature', 'Full App']).toContain(template.category)
      expect(Array.isArray(template.nodes)).toBe(true)
      expect(Array.isArray(template.edges)).toBe(true)
    }
  })

  it('all template nodes have required id, type, position, and data fields', () => {
    for (const template of BUILTIN_TEMPLATES) {
      for (const node of template.nodes) {
        expect(typeof node.id).toBe('string')
        expect(typeof node.type).toBe('string')
        expect(node.position).toBeDefined()
        expect(typeof node.position.x).toBe('number')
        expect(typeof node.position.y).toBe('number')
        expect(node.data).toBeDefined()
      }
    }
  })
})

describe('getBuiltInTemplate', () => {
  it('returns correct template by id', () => {
    const template = getBuiltInTemplate('auth-feature')
    expect(template).toBeDefined()
    expect(template!.name).toBe('Authentication Feature')
  })

  it('returns correct template for mvp-saas', () => {
    const template = getBuiltInTemplate('mvp-saas')
    expect(template).toBeDefined()
    expect(template!.category).toBe('MVP')
  })

  it('returns undefined for invalid id', () => {
    expect(getBuiltInTemplate('nonexistent')).toBeUndefined()
  })
})

describe('getBuiltInTemplatesByCategory', () => {
  it('filters by Feature category', () => {
    const templates = getBuiltInTemplatesByCategory('Feature')
    expect(templates.length).toBeGreaterThan(0)
    templates.forEach((t) => {
      expect(t.category).toBe('Feature')
    })
  })

  it('filters by MVP category', () => {
    const templates = getBuiltInTemplatesByCategory('MVP')
    expect(templates.length).toBeGreaterThan(0)
    templates.forEach((t) => {
      expect(t.category).toBe('MVP')
    })
  })

  it('returns empty array for category with no templates', () => {
    const templates = getBuiltInTemplatesByCategory('Full App')
    expect(Array.isArray(templates)).toBe(true)
  })
})
