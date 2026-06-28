import test from 'node:test';
import assert from 'node:assert/strict';

import { validateSemanticGraph } from '../scripts/validate-pipeline.js';

function validGraph(overrides = {}) {
  return {
    nodes: [
      { id: 'resume:basics', label: 'Resume', type: 'resume', metadata: {} },
      { id: 'note:a', label: 'A', type: 'note', metadata: { file: 'content/notes/a.md' } },
      { id: 'project:b', label: 'B', type: 'project', metadata: { file: 'content/projects/b.md' } }
    ],
    edges: [
      { source: 'resume:basics', target: 'project:b', weight: 1, type: 'owner' },
      { source: 'note:a', target: 'project:b', weight: 0.25, type: 'tag_overlap', metadata: { shared_tags: ['Astro'] } }
    ],
    metadata: {
      generated_at: '2026-06-28T00:00:00.000Z',
      total_nodes: 3,
      total_edges: 2,
      source_summary: {
        content_sources: { resume: 1, notes: 1, projects: 1, decks: 0 },
        node_types: { resume: 1, note: 1, project: 1, deck: 0 },
        edge_types: { link: 0, owner: 1, tag_overlap: 1 }
      }
    },
    ...overrides
  };
}

test('accepts a semantic graph with generated_at and source summary metadata', () => {
  assert.doesNotThrow(() => validateSemanticGraph(validGraph()));
});

test('rejects duplicate semantic graph node ids', () => {
  const graph = validGraph({
    nodes: [
      { id: 'note:a', label: 'A', type: 'note', metadata: {} },
      { id: 'note:a', label: 'Duplicate A', type: 'note', metadata: {} }
    ],
    edges: [],
    metadata: {
      generated_at: '2026-06-28T00:00:00.000Z',
      total_nodes: 2,
      total_edges: 0,
      source_summary: {
        node_types: { resume: 0, note: 2, project: 0, deck: 0 },
        edge_types: { link: 0, owner: 0, tag_overlap: 0 }
      }
    }
  });

  assert.throws(() => validateSemanticGraph(graph), /duplicate node id: note:a/);
});

test('rejects semantic graph edges pointing at missing nodes', () => {
  const graph = validGraph({
    edges: [{ source: 'note:a', target: 'project:missing', weight: 1, type: 'link' }],
    metadata: {
      ...validGraph().metadata,
      total_edges: 1,
      source_summary: {
        ...validGraph().metadata.source_summary,
        edge_types: { link: 1, owner: 0, tag_overlap: 0 }
      }
    }
  });

  assert.throws(() => validateSemanticGraph(graph), /edge target missing: project:missing/);
});

test('rejects invalid semantic graph metadata contracts', () => {
  const missingGeneratedAt = validGraph({
    metadata: {
      total_nodes: 3,
      total_edges: 2,
      source_summary: validGraph().metadata.source_summary
    }
  });

  assert.throws(() => validateSemanticGraph(missingGeneratedAt), /missing generated_at/);

  const mismatchedSummary = validGraph({
    metadata: {
      ...validGraph().metadata,
      source_summary: {
        ...validGraph().metadata.source_summary,
        node_types: { resume: 0, note: 1, project: 1, deck: 0 }
      }
    }
  });

  assert.throws(() => validateSemanticGraph(mismatchedSummary), /node_types mismatch for resume/);
});
