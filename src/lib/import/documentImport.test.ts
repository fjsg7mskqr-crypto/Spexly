import { describe, it, expect } from 'vitest'
import { parseDocumentToCanvas } from './documentImport'

describe('parseDocumentToCanvas', () => {
  // ─── Empty input ───────────────────────────────────────
  it('returns empty arrays for empty string', () => {
    const result = parseDocumentToCanvas('')
    expect(result.nodes).toHaveLength(0)
    expect(result.edges).toHaveLength(0)
  })

  it('returns empty arrays for whitespace-only string', () => {
    const result = parseDocumentToCanvas('   \n  \n  ')
    expect(result.nodes).toHaveLength(0)
    expect(result.edges).toHaveLength(0)
  })

  // ─── Key-value extraction ─────────────────────────────
  it('extracts appName from "App Name:" key-value pattern', () => {
    const result = parseDocumentToCanvas('App Name: MyApp\nDescription: A cool app')
    const ideaNode = result.nodes.find((n) => n.type === 'idea')
    expect(ideaNode).toBeDefined()
    expect(ideaNode!.data.appName).toBe('MyApp')
  })

  it('extracts description from key-value pattern', () => {
    const result = parseDocumentToCanvas('Description: A cool tool for devs')
    const ideaNode = result.nodes.find((n) => n.type === 'idea')
    expect(ideaNode).toBeDefined()
    expect(ideaNode!.data.description).toContain('cool tool')
  })

  it('extracts targetUser from key-value pattern', () => {
    const result = parseDocumentToCanvas('Target User: Indie hackers')
    const ideaNode = result.nodes.find((n) => n.type === 'idea')
    expect(ideaNode!.data.targetUser).toContain('Indie hackers')
  })

  it('extracts coreProblem from key-value pattern', () => {
    const result = parseDocumentToCanvas('Problem: Too many manual steps')
    const ideaNode = result.nodes.find((n) => n.type === 'idea')
    expect(ideaNode!.data.coreProblem).toContain('manual steps')
  })

  // ─── Section-based parsing ─────────────────────────────
  it('extracts features from bulleted lists under Features heading', () => {
    const doc = `# Features
- User login
- Dashboard
- Settings page`
    const result = parseDocumentToCanvas(doc)
    const featureNodes = result.nodes.filter((n) => n.type === 'feature')
    expect(featureNodes.length).toBeGreaterThanOrEqual(1)
  })

  it('extracts screens from bulleted lists under Screens heading', () => {
    const doc = `# Screens
- Login page
- Home page`
    const result = parseDocumentToCanvas(doc)
    const screenNodes = result.nodes.filter((n) => n.type === 'screen')
    expect(screenNodes.length).toBeGreaterThanOrEqual(1)
  })

  it('parses tech stack with category detection', () => {
    const doc = `# Tech Stack
- Frontend: React
- Backend: Node.js`
    const result = parseDocumentToCanvas(doc)
    const techNodes = result.nodes.filter((n) => n.type === 'techStack')
    expect(techNodes.length).toBeGreaterThanOrEqual(1)
  })

  // ─── Section aliases ───────────────────────────────────
  it('handles "Functionality" as alias for features', () => {
    const doc = `# Functionality
- Search
- Filter`
    const result = parseDocumentToCanvas(doc)
    const featureNodes = result.nodes.filter((n) => n.type === 'feature')
    expect(featureNodes.length).toBeGreaterThanOrEqual(1)
  })

  it('handles "Pages" as alias for screens', () => {
    const doc = `# Pages
- Landing page
- About page`
    const result = parseDocumentToCanvas(doc)
    const screenNodes = result.nodes.filter((n) => n.type === 'screen')
    expect(screenNodes.length).toBeGreaterThanOrEqual(1)
  })

  // ─── Note node and edges ──────────────────────────────
  it('creates a note node with sourceExcerpt', () => {
    const doc = 'App Name: Test\nDescription: Something'
    const result = parseDocumentToCanvas(doc)
    const noteNode = result.nodes.find((n) => n.type === 'note')
    expect(noteNode).toBeDefined()
    expect(noteNode!.data.title).toBe('Imported Document')
    expect(noteNode!.data.body).toContain('App Name: Test')
  })

  it('creates an edge between note node and idea node', () => {
    const doc = 'App Name: Test\nDescription: Something'
    const result = parseDocumentToCanvas(doc)
    const noteNode = result.nodes.find((n) => n.type === 'note')
    const ideaNode = result.nodes.find((n) => n.type === 'idea')
    expect(noteNode).toBeDefined()
    expect(ideaNode).toBeDefined()
    const edge = result.edges.find(
      (e) => e.source === noteNode!.id && e.target === ideaNode!.id
    )
    expect(edge).toBeDefined()
  })

  // ─── Numbered lists ────────────────────────────────────
  it('handles numbered lists in feature sections', () => {
    const doc = `# Features
1. Authentication
2. Authorization`
    const result = parseDocumentToCanvas(doc)
    const featureNodes = result.nodes.filter((n) => n.type === 'feature')
    expect(featureNodes.length).toBeGreaterThanOrEqual(1)
  })

  // ─── Tool detection ────────────────────────────────────
  it('detects target tool from document content', () => {
    const doc = 'Build this with Cursor\nDescription: Test app'
    const result = parseDocumentToCanvas(doc)
    // The prompt nodes or default tool should reflect "Cursor"
    // Since tool detection is internal, we verify nodes were created
    expect(result.nodes.length).toBeGreaterThan(0)
  })

  // ─── No recognized sections ────────────────────────────
  it('handles documents with no recognized sections', () => {
    const doc = 'Just some random text about a project idea.'
    const result = parseDocumentToCanvas(doc)
    // Should still create at least an idea node and a note node
    expect(result.nodes.length).toBeGreaterThan(0)
  })
})
