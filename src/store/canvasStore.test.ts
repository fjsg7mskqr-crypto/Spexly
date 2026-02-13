import { describe, it, expect, beforeEach } from 'vitest'
import { useCanvasStore } from './canvasStore'
import type { SpexlyNodeType, SpexlyNode } from '@/types/nodes'

function resetStore() {
  useCanvasStore.setState({
    nodes: [],
    edges: [],
    past: [],
    future: [],
  })
}

describe('canvasStore', () => {
  beforeEach(() => {
    resetStore()
  })

  // ─── Node Management ────────────────────────────────────

  describe('addNode', () => {
    it('creates a node with correct type, position, and default data', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 100, y: 200 })

      const { nodes } = useCanvasStore.getState()
      expect(nodes).toHaveLength(1)
      expect(nodes[0].type).toBe('idea')
      expect(nodes[0].position).toEqual({ x: 100, y: 200 })
      expect(nodes[0].data).toMatchObject({
        appName: '',
        description: '',
        targetUser: '',
        coreProblem: '',
        expanded: false,
      })
    })

    it('generates an ID with the node type prefix', () => {
      const store = useCanvasStore.getState()
      store.addNode('feature', { x: 0, y: 0 })

      const { nodes } = useCanvasStore.getState()
      expect(nodes[0].id).toMatch(/^feature-/)
    })

    it('creates correct default data for each node type', () => {
      const store = useCanvasStore.getState()
      const types: SpexlyNodeType[] = ['idea', 'feature', 'screen', 'techStack', 'prompt', 'note']

      types.forEach((type) => {
        store.addNode(type, { x: 0, y: 0 })
      })

      const { nodes } = useCanvasStore.getState()
      expect(nodes).toHaveLength(6)

      // Each should have expanded: false
      nodes.forEach((node) => {
        expect(node.data.expanded).toBe(false)
      })

      // Spot-check specific types
      const featureNode = nodes.find((n) => n.type === 'feature')!
      expect(featureNode.data).toMatchObject({ priority: 'Must', status: 'Planned' })

      const techNode = nodes.find((n) => n.type === 'techStack')!
      expect(techNode.data).toMatchObject({ category: 'Frontend' })

      const promptNode = nodes.find((n) => n.type === 'prompt')!
      expect(promptNode.data).toMatchObject({ targetTool: 'Claude' })
    })

    it('pushes history before adding', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })

      const { past } = useCanvasStore.getState()
      expect(past).toHaveLength(1)
      // History should capture state BEFORE the add (empty)
      expect(past[0].nodes).toHaveLength(0)
    })
  })

  describe('updateNodeData', () => {
    it('merges partial data into the target node', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      const nodeId = useCanvasStore.getState().nodes[0].id

      store.updateNodeData(nodeId, { appName: 'My App' })

      const node = useCanvasStore.getState().nodes[0]
      expect(node.data.appName).toBe('My App')
      expect(node.data.expanded).toBe(false) // preserved
    })

    it('does not push history (lightweight operation)', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      const pastBefore = useCanvasStore.getState().past.length
      const nodeId = useCanvasStore.getState().nodes[0].id

      store.updateNodeData(nodeId, { appName: 'test' })

      expect(useCanvasStore.getState().past).toHaveLength(pastBefore)
    })

    it('does not affect other nodes', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      store.addNode('note', { x: 100, y: 100 })

      const [ideaNode, noteNode] = useCanvasStore.getState().nodes
      store.updateNodeData(ideaNode.id, { appName: 'Changed' })

      const updatedNote = useCanvasStore.getState().nodes.find((n) => n.id === noteNode.id)!
      expect(updatedNote.data).toEqual(noteNode.data)
    })
  })

  describe('deleteNode', () => {
    it('removes the node', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      const nodeId = useCanvasStore.getState().nodes[0].id

      store.deleteNode(nodeId)

      expect(useCanvasStore.getState().nodes).toHaveLength(0)
    })

    it('removes connected edges', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      store.addNode('feature', { x: 100, y: 100 })
      const [node1, node2] = useCanvasStore.getState().nodes

      store.onConnect({ source: node1.id, target: node2.id, sourceHandle: null, targetHandle: null })
      expect(useCanvasStore.getState().edges).toHaveLength(1)

      store.deleteNode(node1.id)

      expect(useCanvasStore.getState().nodes).toHaveLength(1)
      expect(useCanvasStore.getState().edges).toHaveLength(0)
    })

    it('pushes history before deletion', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      const pastBefore = useCanvasStore.getState().past.length

      const nodeId = useCanvasStore.getState().nodes[0].id
      store.deleteNode(nodeId)

      expect(useCanvasStore.getState().past.length).toBeGreaterThan(pastBefore)
    })
  })

  describe('deleteSelected', () => {
    it('deletes selected nodes and their connected edges', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      store.addNode('feature', { x: 100, y: 100 })
      store.addNode('note', { x: 200, y: 200 })

      const state = useCanvasStore.getState()
      const [node1, node2, node3] = state.nodes

      // Connect node1 -> node2 and node2 -> node3
      store.onConnect({ source: node1.id, target: node2.id, sourceHandle: null, targetHandle: null })
      store.onConnect({ source: node2.id, target: node3.id, sourceHandle: null, targetHandle: null })

      // Select node1
      useCanvasStore.setState({
        nodes: useCanvasStore.getState().nodes.map((n) =>
          n.id === node1.id ? { ...n, selected: true } : n
        ),
      })

      store.deleteSelected()

      const after = useCanvasStore.getState()
      expect(after.nodes).toHaveLength(2)
      expect(after.edges).toHaveLength(1) // only node2 -> node3 remains
    })

    it('does nothing when nothing is selected', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      const pastBefore = useCanvasStore.getState().past.length

      store.deleteSelected()

      expect(useCanvasStore.getState().nodes).toHaveLength(1)
      // Should NOT push history since nothing happened
      expect(useCanvasStore.getState().past).toHaveLength(pastBefore)
    })
  })

  describe('toggleNodeExpanded', () => {
    it('toggles the expanded state', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      const nodeId = useCanvasStore.getState().nodes[0].id

      expect(useCanvasStore.getState().nodes[0].data.expanded).toBe(false)

      store.toggleNodeExpanded(nodeId)
      expect(useCanvasStore.getState().nodes[0].data.expanded).toBe(true)

      store.toggleNodeExpanded(nodeId)
      expect(useCanvasStore.getState().nodes[0].data.expanded).toBe(false)
    })

    it('only affects the target node', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      store.addNode('note', { x: 100, y: 100 })

      const [node1] = useCanvasStore.getState().nodes
      store.toggleNodeExpanded(node1.id)

      const nodes = useCanvasStore.getState().nodes
      expect(nodes[0].data.expanded).toBe(true)
      expect(nodes[1].data.expanded).toBe(false)
    })
  })

  // ─── Edge Management ────────────────────────────────────

  describe('onConnect', () => {
    it('adds an edge between two nodes', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      store.addNode('feature', { x: 100, y: 100 })
      const [node1, node2] = useCanvasStore.getState().nodes

      store.onConnect({ source: node1.id, target: node2.id, sourceHandle: null, targetHandle: null })

      const { edges } = useCanvasStore.getState()
      expect(edges).toHaveLength(1)
      expect(edges[0].source).toBe(node1.id)
      expect(edges[0].target).toBe(node2.id)
    })

    it('pushes history before connecting', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      store.addNode('feature', { x: 100, y: 100 })
      const pastBefore = useCanvasStore.getState().past.length
      const [node1, node2] = useCanvasStore.getState().nodes

      store.onConnect({ source: node1.id, target: node2.id, sourceHandle: null, targetHandle: null })

      expect(useCanvasStore.getState().past.length).toBeGreaterThan(pastBefore)
    })
  })

  // ─── History Management ─────────────────────────────────

  describe('pushHistory', () => {
    it('creates a deep clone of current state', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })

      // Modify node data after history was pushed
      const nodeId = useCanvasStore.getState().nodes[0].id
      store.updateNodeData(nodeId, { appName: 'Modified' })

      // History should still have the original empty state
      const { past } = useCanvasStore.getState()
      expect(past[0].nodes).toHaveLength(0)
    })

    it('maintains a maximum of 20 entries', () => {
      const store = useCanvasStore.getState()

      for (let i = 0; i < 25; i++) {
        store.addNode('note', { x: i * 10, y: 0 })
      }

      expect(useCanvasStore.getState().past.length).toBeLessThanOrEqual(20)
    })

    it('clears future on new action', () => {
      const store = useCanvasStore.getState()

      store.addNode('idea', { x: 0, y: 0 })
      store.addNode('feature', { x: 100, y: 100 })

      // Undo to create a future entry
      store.undo()
      expect(useCanvasStore.getState().future).toHaveLength(1)

      // New action should clear future
      store.addNode('note', { x: 200, y: 200 })
      expect(useCanvasStore.getState().future).toHaveLength(0)
    })
  })

  describe('undo', () => {
    it('restores the previous state', () => {
      const store = useCanvasStore.getState()

      store.addNode('idea', { x: 0, y: 0 })
      expect(useCanvasStore.getState().nodes).toHaveLength(1)

      store.undo()
      expect(useCanvasStore.getState().nodes).toHaveLength(0)
    })

    it('moves current state to future', () => {
      const store = useCanvasStore.getState()

      store.addNode('idea', { x: 0, y: 0 })
      store.undo()

      const { future } = useCanvasStore.getState()
      expect(future).toHaveLength(1)
      expect(future[0].nodes).toHaveLength(1)
    })

    it('does nothing when past is empty', () => {
      const store = useCanvasStore.getState()
      const before = useCanvasStore.getState()

      store.undo()

      const after = useCanvasStore.getState()
      expect(after.nodes).toEqual(before.nodes)
      expect(after.edges).toEqual(before.edges)
      expect(after.past).toEqual(before.past)
      expect(after.future).toEqual(before.future)
    })

    it('supports multiple undos', () => {
      const store = useCanvasStore.getState()

      store.addNode('idea', { x: 0, y: 0 })
      store.addNode('feature', { x: 100, y: 100 })
      store.addNode('note', { x: 200, y: 200 })

      expect(useCanvasStore.getState().nodes).toHaveLength(3)

      store.undo() // back to 2 nodes
      expect(useCanvasStore.getState().nodes).toHaveLength(2)

      store.undo() // back to 1 node
      expect(useCanvasStore.getState().nodes).toHaveLength(1)

      store.undo() // back to 0 nodes
      expect(useCanvasStore.getState().nodes).toHaveLength(0)
    })
  })

  describe('redo', () => {
    it('restores a future state', () => {
      const store = useCanvasStore.getState()

      store.addNode('idea', { x: 0, y: 0 })
      store.undo()
      expect(useCanvasStore.getState().nodes).toHaveLength(0)

      store.redo()
      expect(useCanvasStore.getState().nodes).toHaveLength(1)
    })

    it('moves current state to past', () => {
      const store = useCanvasStore.getState()

      store.addNode('idea', { x: 0, y: 0 })
      store.undo()
      store.redo()

      const { past } = useCanvasStore.getState()
      // past should have: initial empty + the empty state from redo
      expect(past.length).toBeGreaterThanOrEqual(1)
    })

    it('does nothing when future is empty', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })

      const before = useCanvasStore.getState()
      store.redo()
      const after = useCanvasStore.getState()

      expect(after.nodes).toEqual(before.nodes)
      expect(after.future).toEqual(before.future)
    })

    it('supports undo then redo roundtrip', () => {
      const store = useCanvasStore.getState()

      store.addNode('idea', { x: 50, y: 50 })
      const nodeAfterAdd = useCanvasStore.getState().nodes[0]

      store.undo()
      expect(useCanvasStore.getState().nodes).toHaveLength(0)

      store.redo()
      const restoredNode = useCanvasStore.getState().nodes[0]
      expect(restoredNode.type).toBe(nodeAfterAdd.type)
      expect(restoredNode.position).toEqual(nodeAfterAdd.position)
    })
  })

  // ─── getFeatureStatusCounts ────────────────────────────

  describe('getFeatureStatusCounts', () => {
    it('returns zero counts when no feature nodes exist', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })

      const counts = useCanvasStore.getState().getFeatureStatusCounts()
      expect(counts).toEqual({
        Planned: 0,
        'In Progress': 0,
        Built: 0,
        Broken: 0,
        Blocked: 0,
      })
    })

    it('counts features by status correctly', () => {
      // Use setState directly to avoid Date.now() ID collisions
      useCanvasStore.setState({
        nodes: [
          {
            id: 'f1',
            type: 'feature',
            position: { x: 0, y: 0 },
            data: {
              featureName: 'A',
              summary: '',
              problem: '',
              userStory: '',
              acceptanceCriteria: [],
              priority: 'Must',
              status: 'Planned',
              effort: 'M',
              dependencies: [],
              risks: '',
              metrics: '',
              notes: '',
              expanded: false,
              completed: false,
              aiContext: '',
              implementationSteps: [],
              codeReferences: [],
              testingRequirements: '',
              relatedFiles: [],
              technicalConstraints: '',
              tags: [],
              estimatedHours: null,
              version: 0,
            },
          },
          {
            id: 'f2',
            type: 'feature',
            position: { x: 100, y: 0 },
            data: {
              featureName: 'B',
              summary: '',
              problem: '',
              userStory: '',
              acceptanceCriteria: [],
              priority: 'Must',
              status: 'Built',
              effort: 'M',
              dependencies: [],
              risks: '',
              metrics: '',
              notes: '',
              expanded: false,
              completed: false,
              aiContext: '',
              implementationSteps: [],
              codeReferences: [],
              testingRequirements: '',
              relatedFiles: [],
              technicalConstraints: '',
              tags: [],
              estimatedHours: null,
              version: 0,
            },
          },
          {
            id: 'f3',
            type: 'feature',
            position: { x: 200, y: 0 },
            data: {
              featureName: 'C',
              summary: '',
              problem: '',
              userStory: '',
              acceptanceCriteria: [],
              priority: 'Must',
              status: 'Built',
              effort: 'M',
              dependencies: [],
              risks: '',
              metrics: '',
              notes: '',
              expanded: false,
              completed: false,
              aiContext: '',
              implementationSteps: [],
              codeReferences: [],
              testingRequirements: '',
              relatedFiles: [],
              technicalConstraints: '',
              tags: [],
              estimatedHours: null,
              version: 0,
            },
          },
        ] as SpexlyNode[],
      })

      const counts = useCanvasStore.getState().getFeatureStatusCounts()
      expect(counts.Planned).toBe(1)
      expect(counts.Built).toBe(2)
      expect(counts['In Progress']).toBe(0)
    })

    it('ignores non-feature node types', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      store.addNode('note', { x: 100, y: 0 })
      store.addNode('feature', { x: 200, y: 0 })

      const counts = useCanvasStore.getState().getFeatureStatusCounts()
      expect(counts.Planned).toBe(1)
    })
  })

  // ─── setNodesAndEdges ─────────────────────────────────

  describe('setNodesAndEdges', () => {
    it('replaces all nodes and edges', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })

      const newNodes: SpexlyNode[] = [
        {
          id: 'new-1',
          type: 'feature',
          position: { x: 0, y: 0 },
          data: {
            featureName: 'Auth',
            summary: '',
            problem: '',
            userStory: '',
            acceptanceCriteria: [],
            priority: 'Must' as const,
            status: 'Planned' as const,
            effort: 'M' as const,
            dependencies: [],
            risks: '',
            metrics: '',
            notes: '',
            expanded: false,
            completed: false,
            aiContext: '',
            implementationSteps: [],
            codeReferences: [],
            testingRequirements: '',
            relatedFiles: [],
            technicalConstraints: '',
            tags: [],
            estimatedHours: null,
            version: 0,
          },
        } as SpexlyNode,
      ]
      store.setNodesAndEdges(newNodes, [])

      const state = useCanvasStore.getState()
      expect(state.nodes).toHaveLength(1)
      expect(state.nodes[0].id).toBe('new-1')
      expect(state.edges).toHaveLength(0)
    })

    it('pushes history before replacement', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      const pastBefore = useCanvasStore.getState().past.length

      store.setNodesAndEdges([], [])

      expect(useCanvasStore.getState().past.length).toBeGreaterThan(pastBefore)
      // Can undo back to the idea node
      store.undo()
      expect(useCanvasStore.getState().nodes).toHaveLength(1)
    })

    it('works with empty arrays', () => {
      const store = useCanvasStore.getState()
      store.setNodesAndEdges([], [])

      const state = useCanvasStore.getState()
      expect(state.nodes).toHaveLength(0)
      expect(state.edges).toHaveLength(0)
    })
  })

  // ─── toggleNodeCompleted ────────────────────────────────

  describe('toggleNodeCompleted', () => {
    it('toggles the completed state', () => {
      const store = useCanvasStore.getState()
      store.addNode('feature', { x: 0, y: 0 })
      const nodeId = useCanvasStore.getState().nodes[0].id

      expect(useCanvasStore.getState().nodes[0].data.completed).toBeFalsy()

      store.toggleNodeCompleted(nodeId)
      expect(useCanvasStore.getState().nodes[0].data.completed).toBe(true)

      store.toggleNodeCompleted(nodeId)
      expect(useCanvasStore.getState().nodes[0].data.completed).toBe(false)
    })

    it('pushes history before toggling', () => {
      const store = useCanvasStore.getState()
      store.addNode('feature', { x: 0, y: 0 })
      const pastBefore = useCanvasStore.getState().past.length
      const nodeId = useCanvasStore.getState().nodes[0].id

      store.toggleNodeCompleted(nodeId)
      expect(useCanvasStore.getState().past.length).toBeGreaterThan(pastBefore)
    })

    it('only affects the target node', () => {
      const store = useCanvasStore.getState()
      store.addNode('feature', { x: 0, y: 0 })
      store.addNode('note', { x: 100, y: 100 })

      const [node1] = useCanvasStore.getState().nodes
      store.toggleNodeCompleted(node1.id)

      const nodes = useCanvasStore.getState().nodes
      expect(nodes[0].data.completed).toBe(true)
      expect(nodes[1].data.completed).toBeFalsy()
    })
  })

  // ─── appendNodesAndEdges ───────────────────────────────

  describe('appendNodesAndEdges', () => {
    it('appends nodes and edges to existing state', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })

      const newNodes: SpexlyNode[] = [
        {
          id: 'appended-1',
          type: 'feature',
          position: { x: 0, y: 0 },
          data: {
            featureName: 'New',
            summary: '',
            problem: '',
            userStory: '',
            acceptanceCriteria: [],
            priority: 'Must' as const,
            status: 'Planned' as const,
            effort: 'M' as const,
            dependencies: [],
            risks: '',
            metrics: '',
            notes: '',
            expanded: false,
            completed: false,
            aiContext: '',
            implementationSteps: [],
            codeReferences: [],
            testingRequirements: '',
            relatedFiles: [],
            technicalConstraints: '',
            tags: [],
            estimatedHours: null,
            version: 0,
          },
        } as SpexlyNode,
      ]

      store.appendNodesAndEdges(newNodes, [])

      const state = useCanvasStore.getState()
      expect(state.nodes.length).toBe(2)
    })

    it('offsets appended node positions when canvas is not empty', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 100, y: 50 })

      const newNodes: SpexlyNode[] = [
        {
          id: 'appended-1',
          type: 'note',
          position: { x: 0, y: 0 },
          data: {
            title: 'Test',
            body: '',
            colorTag: 'Slate',
            expanded: false,
          },
        } as SpexlyNode,
      ]

      store.appendNodesAndEdges(newNodes, [])

      const state = useCanvasStore.getState()
      const appendedNode = state.nodes.find((n) => n.id === 'appended-1')!
      // Position should be offset from the existing nodes
      expect(appendedNode.position.x).toBeGreaterThan(0)
    })

    it('pushes history before appending', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      const pastBefore = useCanvasStore.getState().past.length

      store.appendNodesAndEdges([], [])
      expect(useCanvasStore.getState().past.length).toBeGreaterThan(pastBefore)
    })

    it('appends edges as well', () => {
      const store = useCanvasStore.getState()
      const newNodes: SpexlyNode[] = [
        { id: 'a', type: 'idea', position: { x: 0, y: 0 }, data: { appName: '', description: '', targetUser: '', coreProblem: '', expanded: false } } as SpexlyNode,
        { id: 'b', type: 'feature', position: { x: 100, y: 0 }, data: { featureName: '', expanded: false } } as SpexlyNode,
      ]
      const newEdges = [{ id: 'e-ab', source: 'a', target: 'b' }]

      store.appendNodesAndEdges(newNodes, newEdges)

      const state = useCanvasStore.getState()
      expect(state.edges).toHaveLength(1)
      expect(state.edges[0].id).toBe('e-ab')
    })
  })

  // ─── loadProject ───────────────────────────────────────

  describe('loadProject', () => {
    it('sets project fields and nodes/edges', () => {
      const store = useCanvasStore.getState()
      const nodes: SpexlyNode[] = [
        { id: 'n1', type: 'idea', position: { x: 0, y: 0 }, data: { appName: 'Loaded', expanded: false } } as SpexlyNode,
      ]
      const edges = [{ id: 'e1', source: 'n1', target: 'n1' }]

      store.loadProject('proj-123', 'My Project', nodes, edges)

      const state = useCanvasStore.getState()
      expect(state.projectId).toBe('proj-123')
      expect(state.projectName).toBe('My Project')
      expect(state.nodes).toHaveLength(1)
      expect(state.edges).toHaveLength(1)
    })

    it('clears history on load', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      store.addNode('feature', { x: 100, y: 100 })
      // Should have history entries
      expect(useCanvasStore.getState().past.length).toBeGreaterThan(0)

      store.loadProject('proj-1', 'Test', [], [])

      const state = useCanvasStore.getState()
      expect(state.past).toHaveLength(0)
      expect(state.future).toHaveLength(0)
    })
  })

  // ─── clearCanvas ───────────────────────────────────────

  describe('clearCanvas', () => {
    it('resets all state to defaults', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      store.addNode('feature', { x: 100, y: 100 })
      useCanvasStore.setState({ projectId: 'proj-1', projectName: 'Test' })

      store.clearCanvas()

      const state = useCanvasStore.getState()
      expect(state.projectId).toBeNull()
      expect(state.projectName).toBe('')
      expect(state.nodes).toHaveLength(0)
      expect(state.edges).toHaveLength(0)
      expect(state.past).toHaveLength(0)
      expect(state.future).toHaveLength(0)
    })

    it('clears sidebarNodeId', () => {
      useCanvasStore.setState({ sidebarNodeId: 'some-node' })

      useCanvasStore.getState().clearCanvas()

      expect(useCanvasStore.getState().sidebarNodeId).toBeNull()
    })
  })

  // ─── getProjectSummary ──────────────────────────────────

  describe('getProjectSummary', () => {
    it('counts total nodes and edges', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      store.addNode('feature', { x: 100, y: 100 })
      const [n1, n2] = useCanvasStore.getState().nodes
      store.onConnect({ source: n1.id, target: n2.id, sourceHandle: null, targetHandle: null })

      const summary = useCanvasStore.getState().getProjectSummary()
      expect(summary.totalNodes).toBe(2)
      expect(summary.totalEdges).toBe(1)
    })

    it('groups nodes by type', () => {
      const store = useCanvasStore.getState()
      store.addNode('idea', { x: 0, y: 0 })
      store.addNode('idea', { x: 100, y: 0 })
      store.addNode('feature', { x: 200, y: 0 })

      const summary = useCanvasStore.getState().getProjectSummary()
      expect(summary.byType.idea).toBe(2)
      expect(summary.byType.feature).toBe(1)
    })

    it('handles empty state', () => {
      const summary = useCanvasStore.getState().getProjectSummary()
      expect(summary.totalNodes).toBe(0)
      expect(summary.totalEdges).toBe(0)
      expect(summary.byType).toEqual({})
    })
  })
})
