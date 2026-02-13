import jsPDF from 'jspdf';
import type { SpexlyNode } from '@/types/nodes';

const MARGIN = 15;
const PAGE_WIDTH = 210; // A4 width in mm
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const PAGE_HEIGHT = 297; // A4 height in mm
const FOOTER_HEIGHT = 15;
const MAX_Y = PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT;

interface PDFState {
  doc: jsPDF;
  y: number;
  pageNumber: number;
}

function addFooter(state: PDFState): void {
  const { doc, pageNumber } = state;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('Generated from Spexly', MARGIN, PAGE_HEIGHT - 10);
  doc.text(`Page ${pageNumber}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
  doc.setTextColor(30, 30, 30);
}

function checkPageBreak(state: PDFState, neededHeight: number): void {
  if (state.y + neededHeight > MAX_Y) {
    addFooter(state);
    state.doc.addPage();
    state.pageNumber++;
    state.y = MARGIN;
  }
}

function addHeading(state: PDFState, text: string, level: 1 | 2 | 3): void {
  const sizes = { 1: 18, 2: 14, 3: 12 };
  const spacing = { 1: 10, 2: 8, 3: 6 };
  const fontSize = sizes[level];

  checkPageBreak(state, fontSize + spacing[level]);

  state.y += spacing[level];
  state.doc.setFontSize(fontSize);
  state.doc.setFont('helvetica', 'bold');
  state.doc.text(text, MARGIN, state.y);
  state.y += fontSize * 0.4 + 2;
}

function addText(state: PDFState, text: string, fontSize: number = 10, isBold: boolean = false): void {
  if (!text || text.trim() === '') return;

  state.doc.setFontSize(fontSize);
  state.doc.setFont('helvetica', isBold ? 'bold' : 'normal');

  const lines = state.doc.splitTextToSize(text, CONTENT_WIDTH);
  const lineHeight = fontSize * 0.4;

  for (const line of lines) {
    checkPageBreak(state, lineHeight + 1);
    state.doc.text(line, MARGIN, state.y);
    state.y += lineHeight + 1;
  }

  state.y += 2;
}

function addBullet(state: PDFState, text: string, indent: number = 0): void {
  if (!text) return;

  const bulletX = MARGIN + indent;
  const textX = bulletX + 5;
  const availableWidth = CONTENT_WIDTH - indent - 5;

  state.doc.setFontSize(10);
  state.doc.setFont('helvetica', 'normal');

  const lines = state.doc.splitTextToSize(text, availableWidth);
  const lineHeight = 4.5;

  checkPageBreak(state, lineHeight + 1);

  // Bullet character
  state.doc.setFont('helvetica', 'bold');
  state.doc.text('\u2022', bulletX, state.y);
  state.doc.setFont('helvetica', 'normal');

  for (let i = 0; i < lines.length; i++) {
    if (i > 0) {
      checkPageBreak(state, lineHeight + 1);
    }
    state.doc.text(lines[i], textX, state.y);
    state.y += lineHeight + 1;
  }
}

function addSpacer(state: PDFState, height: number = 4): void {
  state.y += height;
}

function addDivider(state: PDFState): void {
  checkPageBreak(state, 6);
  state.y += 2;
  state.doc.setDrawColor(200, 200, 200);
  state.doc.setLineWidth(0.3);
  state.doc.line(MARGIN, state.y, PAGE_WIDTH - MARGIN, state.y);
  state.y += 4;
}

/**
 * Generates a formatted PDF document from canvas nodes.
 * Follows the same section structure as contextFileGenerator.ts.
 */
export function generateProjectPDF(nodes: SpexlyNode[], projectName?: string): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const ideaNode = nodes.find((n) => n.type === 'idea');
  const featureNodes = nodes.filter((n) => n.type === 'feature');
  const screenNodes = nodes.filter((n) => n.type === 'screen');
  const techStackNodes = nodes.filter((n) => n.type === 'techStack');

  const state: PDFState = { doc, y: MARGIN, pageNumber: 1 };

  // Title
  const title = projectName || (ideaNode?.type === 'idea' ? ideaNode.data.appName : '') || 'Project Context';
  addHeading(state, title, 1);
  addText(state, `Generated ${new Date().toLocaleDateString()}`, 9);
  addSpacer(state, 4);

  // Architecture Overview
  if (ideaNode?.type === 'idea') {
    const data = ideaNode.data;
    addHeading(state, 'Architecture Overview', 2);

    if (data.projectArchitecture) {
      addText(state, data.projectArchitecture);
    }
    if (data.description) {
      addText(state, `Description: ${data.description}`, 10, true);
    }
    if (data.targetUser) {
      addText(state, `Target User: ${data.targetUser}`);
    }
    if (data.coreProblem) {
      addText(state, `Core Problem: ${data.coreProblem}`);
    }

    // Core Patterns
    if (data.corePatterns?.length > 0) {
      addSpacer(state);
      addText(state, 'Key Architectural Patterns:', 10, true);
      for (const pattern of data.corePatterns) {
        addBullet(state, pattern);
      }
    }
  }

  // Tech Stack
  if (techStackNodes.length > 0) {
    addHeading(state, 'Tech Stack', 2);

    const categorized: Record<string, typeof techStackNodes> = {};
    for (const node of techStackNodes) {
      if (node.type === 'techStack') {
        const category = node.data.category;
        if (!categorized[category]) {
          categorized[category] = [];
        }
        categorized[category].push(node);
      }
    }

    for (const [category, catNodes] of Object.entries(categorized)) {
      addText(state, category, 11, true);
      for (const node of catNodes) {
        if (node.type === 'techStack') {
          const version = node.data.version ? ` (${node.data.version})` : '';
          addBullet(state, `${node.data.toolName}${version}`);
          if (node.data.rationale) {
            addBullet(state, `Rationale: ${node.data.rationale}`, 8);
          }
        }
      }
      addSpacer(state, 2);
    }
  }

  // Features
  if (featureNodes.length > 0) {
    addHeading(state, 'Features', 2);

    for (const node of featureNodes) {
      if (node.type !== 'feature') continue;
      const data = node.data;

      addHeading(state, data.featureName || 'Unnamed Feature', 3);

      if (data.userStory) {
        addText(state, `User Story: ${data.userStory}`, 10, true);
      }

      if (data.acceptanceCriteria?.length > 0) {
        addText(state, 'Acceptance Criteria:', 10, true);
        for (const criterion of data.acceptanceCriteria) {
          addBullet(state, criterion);
        }
      }

      if (data.implementationSteps?.length > 0) {
        addText(state, 'Implementation Steps:', 10, true);
        for (let i = 0; i < data.implementationSteps.length; i++) {
          addBullet(state, `${i + 1}. ${data.implementationSteps[i]}`);
        }
      }

      if (data.aiContext) {
        addText(state, `AI Context: ${data.aiContext}`);
      }

      if (data.codeReferences?.length > 0) {
        addText(state, 'Code References:', 10, true);
        for (const ref of data.codeReferences) {
          addBullet(state, ref);
        }
      }

      if (data.relatedFiles?.length > 0) {
        addText(state, 'Related Files:', 10, true);
        for (const file of data.relatedFiles) {
          addBullet(state, file);
        }
      }

      if (data.testingRequirements) {
        addText(state, `Testing: ${data.testingRequirements}`);
      }

      if (data.dependencies?.length > 0) {
        addText(state, 'Dependencies:', 10, true);
        for (const dep of data.dependencies) {
          addBullet(state, dep);
        }
      }

      addDivider(state);
    }
  }

  // Screens
  if (screenNodes.length > 0) {
    addHeading(state, 'Screens / UI Components', 2);

    for (const node of screenNodes) {
      if (node.type !== 'screen') continue;
      const data = node.data;

      addHeading(state, data.screenName || 'Unnamed Screen', 3);

      if (data.purpose) {
        addText(state, `Purpose: ${data.purpose}`);
      }

      if (data.componentHierarchy?.length > 0) {
        addText(state, 'Component Hierarchy:', 10, true);
        for (const component of data.componentHierarchy) {
          addBullet(state, component);
        }
      }

      if (data.keyElements?.length > 0) {
        addText(state, 'Key Elements:', 10, true);
        for (const element of data.keyElements) {
          addBullet(state, element);
        }
      }

      if (data.aiContext) {
        addText(state, `AI Context: ${data.aiContext}`);
      }

      if (data.codeReferences?.length > 0) {
        addText(state, 'Code References:', 10, true);
        for (const ref of data.codeReferences) {
          addBullet(state, ref);
        }
      }

      addDivider(state);
    }
  }

  // Constraints
  if (ideaNode?.type === 'idea' && ideaNode.data.constraints?.length > 0) {
    addHeading(state, 'Technical Constraints', 2);
    for (const constraint of ideaNode.data.constraints) {
      addBullet(state, constraint);
    }
  }

  // Feature-specific constraints
  const featureConstraints = featureNodes
    .filter((n) => n.type === 'feature' && n.data.technicalConstraints)
    .map((n) => (n.type === 'feature' ? n.data.technicalConstraints : ''))
    .filter(Boolean);

  if (featureConstraints.length > 0) {
    addHeading(state, 'Feature-Specific Constraints', 2);
    for (const constraint of featureConstraints) {
      addBullet(state, constraint);
    }
  }

  // Add footer to the last page
  addFooter(state);

  return doc;
}
