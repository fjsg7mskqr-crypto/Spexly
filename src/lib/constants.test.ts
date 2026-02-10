import { describe, it, expect } from 'vitest'
import {
  NODE_TYPE_CONFIGS,
  FEATURE_STATUS_CONFIG,
  GRID_SNAP,
  MAX_HISTORY,
  CANVAS_BG_COLOR,
  CANVAS_DOT_COLOR,
  NODE_BG_COLOR,
  EDGE_COLOR,
} from './constants'
import type { SpexlyNodeType, FeatureStatus } from '@/types/nodes'

describe('constants', () => {
  describe('NODE_TYPE_CONFIGS', () => {
    const expectedTypes: SpexlyNodeType[] = ['idea', 'feature', 'screen', 'techStack', 'prompt', 'note']

    it('contains all 6 node types', () => {
      expect(Object.keys(NODE_TYPE_CONFIGS)).toHaveLength(6)
      expectedTypes.forEach((type) => {
        expect(NODE_TYPE_CONFIGS[type]).toBeDefined()
      })
    })

    it.each(expectedTypes)('%s has required properties', (type) => {
      const config = NODE_TYPE_CONFIGS[type]
      expect(config.type).toBe(type)
      expect(typeof config.label).toBe('string')
      expect(config.label.length).toBeGreaterThan(0)
      expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(config.icon).toBeDefined() // LucideIcon is a React component
      expect(config.defaultData).toBeDefined()
      expect(config.defaultData.expanded).toBe(true)
    })

    it('idea config has correct default data shape', () => {
      const data = NODE_TYPE_CONFIGS.idea.defaultData
      expect(data).toHaveProperty('appName', '')
      expect(data).toHaveProperty('description', '')
      expect(data).toHaveProperty('targetUser', '')
      expect(data).toHaveProperty('coreProblem', '')
    })

    it('feature config has correct default data shape', () => {
      const data = NODE_TYPE_CONFIGS.feature.defaultData
      expect(data).toHaveProperty('featureName', '')
      expect(data).toHaveProperty('priority', 'Must')
      expect(data).toHaveProperty('status', 'Planned')
    })

    it('techStack config has correct default category', () => {
      const data = NODE_TYPE_CONFIGS.techStack.defaultData
      expect(data).toHaveProperty('category', 'Frontend')
    })

    it('prompt config has correct default target tool', () => {
      const data = NODE_TYPE_CONFIGS.prompt.defaultData
      expect(data).toHaveProperty('targetTool', 'Claude')
    })
  })

  describe('FEATURE_STATUS_CONFIG', () => {
    const expectedStatuses: FeatureStatus[] = ['Planned', 'In Progress', 'Built', 'Broken', 'Blocked']

    it('contains all 5 feature statuses', () => {
      expect(Object.keys(FEATURE_STATUS_CONFIG)).toHaveLength(5)
      expectedStatuses.forEach((status) => {
        expect(FEATURE_STATUS_CONFIG[status]).toBeDefined()
      })
    })

    it.each(expectedStatuses)('%s has required color properties', (status) => {
      const config = FEATURE_STATUS_CONFIG[status]
      expect(config.color).toMatch(/^(#[0-9A-Fa-f]{6}|rgba?\(.+\))$/)
      expect(config.bgColor).toMatch(/^(#[0-9A-Fa-f]{6}|rgba?\(.+\))$/)
      expect(typeof config.icon).toBe('string')
    })

    it('In Progress has pulse: true', () => {
      expect(FEATURE_STATUS_CONFIG['In Progress'].pulse).toBe(true)
    })

    it('other statuses do not pulse', () => {
      const nonPulsing: FeatureStatus[] = ['Planned', 'Built', 'Broken', 'Blocked']
      nonPulsing.forEach((status) => {
        expect(FEATURE_STATUS_CONFIG[status].pulse).toBeFalsy()
      })
    })
  })

  describe('canvas constants', () => {
    it('GRID_SNAP is [15, 15]', () => {
      expect(GRID_SNAP).toEqual([15, 15])
    })

    it('MAX_HISTORY is 20', () => {
      expect(MAX_HISTORY).toBe(20)
    })

    it('color constants are valid hex', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/
      expect(CANVAS_BG_COLOR).toMatch(hexRegex)
      expect(CANVAS_DOT_COLOR).toMatch(hexRegex)
      expect(NODE_BG_COLOR).toMatch(hexRegex)
      expect(EDGE_COLOR).toMatch(hexRegex)
    })
  })
})
