type IconNode = [tag: 'path' | 'line' | 'polyline' | 'polygon' | 'rect' | 'circle', attrs: Record<string, string | number>]

interface IconDefinition {
  nodes: IconNode[]
  /** Значок залит цветом текста, а не обведён. */
  filled?: boolean
}

export const ICONS = {
  logo: { nodes: [['path', { d: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' }]] },
  table: {
    nodes: [
      ['rect', { x: 3, y: 4, width: 18, height: 16, rx: 2 }],
      ['line', { x1: 3, y1: 10, x2: 21, y2: 10 }],
      ['line', { x1: 9, y1: 10, x2: 9, y2: 20 }],
    ],
  },
  list: {
    nodes: [
      ['line', { x1: 8, y1: 6, x2: 21, y2: 6 }],
      ['line', { x1: 8, y1: 12, x2: 21, y2: 12 }],
      ['line', { x1: 8, y1: 18, x2: 21, y2: 18 }],
      ['line', { x1: 3, y1: 6, x2: 3.01, y2: 6 }],
      ['line', { x1: 3, y1: 12, x2: 3.01, y2: 12 }],
      ['line', { x1: 3, y1: 18, x2: 3.01, y2: 18 }],
    ],
  },
  flow: {
    nodes: [
      ['circle', { cx: 6, cy: 5, r: 2 }],
      ['circle', { cx: 6, cy: 19, r: 2 }],
      ['circle', { cx: 18, cy: 12, r: 2 }],
      ['line', { x1: 6, y1: 7, x2: 6, y2: 17 }],
      ['path', { d: 'M6 12h10' }],
    ],
  },
  performer: {
    nodes: [
      ['rect', { x: 4, y: 8, width: 16, height: 11, rx: 3.5 }],
      ['path', { d: 'M12 4.6V8' }],
      ['circle', { cx: 12, cy: 3.4, r: 1.2 }],
      ['path', { d: 'M9.2 13h.01' }],
      ['path', { d: 'M14.8 13h.01' }],
      ['path', { d: 'M2 12.5v2.5' }],
      ['path', { d: 'M22 12.5v2.5' }],
    ],
  },
  sessions: {
    nodes: [
      ['rect', { x: 3, y: 4, width: 18, height: 13, rx: 2 }],
      ['path', { d: 'M9 21h6M12 17v4M7.5 9l2.5 2-2.5 2' }],
    ],
  },
  usage: { nodes: [['path', { d: 'M4 19V9M10 19V5M16 19v-7M22 19H2' }]] },
  warning: {
    nodes: [
      ['path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }],
      ['line', { x1: 12, y1: 9, x2: 12, y2: 13 }],
      ['line', { x1: 12, y1: 17, x2: 12.01, y2: 17 }],
    ],
  },
  gear: {
    nodes: [
      ['circle', { cx: 12, cy: 12, r: 3 }],
      [
        'path',
        {
          d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
        },
      ],
    ],
  },
  sun: {
    nodes: [
      ['circle', { cx: 12, cy: 12, r: 4 }],
      [
        'path',
        { d: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41' },
      ],
    ],
  },
  moon: { nodes: [['path', { d: 'M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z' }]] },
  plus: {
    nodes: [
      ['line', { x1: 12, y1: 5, x2: 12, y2: 19 }],
      ['line', { x1: 5, y1: 12, x2: 19, y2: 12 }],
    ],
  },
  'chevron-down': { nodes: [['polyline', { points: '6 9 12 15 18 9' }]] },
  'chevron-left': { nodes: [['polyline', { points: '15 18 9 12 15 6' }]] },
  'chevron-right': { nodes: [['polyline', { points: '9 18 15 12 9 6' }]] },
  dots: {
    filled: true,
    nodes: [
      ['circle', { cx: 5, cy: 12, r: 1.8 }],
      ['circle', { cx: 12, cy: 12, r: 1.8 }],
      ['circle', { cx: 19, cy: 12, r: 1.8 }],
    ],
  },
  terminal: {
    nodes: [
      ['rect', { x: 2, y: 4, width: 20, height: 16, rx: 2 }],
      ['polyline', { points: '6 9 9 12 6 15' }],
      ['line', { x1: 12, y1: 15, x2: 17, y2: 15 }],
    ],
  },
  vscode: {
    filled: true,
    nodes: [
      [
        'path',
        {
          d: 'M23.15 2.587 18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448z',
        },
      ],
    ],
  },
  play: { nodes: [['polygon', { points: '5 3 19 12 5 21 5 3' }]] },
  trash: {
    nodes: [
      ['polyline', { points: '4 7 20 7' }],
      ['path', { d: 'M10 11v6M14 11v6' }],
      ['path', { d: 'M6 7l1 13h10l1-13' }],
      ['path', { d: 'M9 7V4h6v3' }],
    ],
  },
  close: {
    nodes: [
      ['line', { x1: 18, y1: 6, x2: 6, y2: 18 }],
      ['line', { x1: 6, y1: 6, x2: 18, y2: 18 }],
    ],
  },
  check: { nodes: [['polyline', { points: '20 6 9 17 4 12' }]] },
  info: {
    nodes: [
      ['circle', { cx: 12, cy: 12, r: 10 }],
      ['line', { x1: 12, y1: 16, x2: 12, y2: 12 }],
      ['line', { x1: 12, y1: 8, x2: 12.01, y2: 8 }],
    ],
  },
  send: {
    nodes: [
      ['line', { x1: 22, y1: 2, x2: 11, y2: 13 }],
      ['polygon', { points: '22 2 15 22 11 13 2 9 22 2' }],
    ],
  },
  ask: {
    nodes: [
      ['path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }],
      ['path', { d: 'M9.5 8.5a2.5 2.5 0 0 1 4.8 1c0 1.5-2.3 2-2.3 3' }],
      ['line', { x1: 12, y1: 15, x2: 12.01, y2: 15 }],
    ],
  },
  box: {
    nodes: [
      ['line', { x1: 16.5, y1: 9.4, x2: 7.5, y2: 4.21 }],
      [
        'path',
        { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
      ],
      ['polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }],
      ['line', { x1: 12, y1: 22.08, x2: 12, y2: 12 }],
    ],
  },
  folder: {
    nodes: [['path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }]],
  },
} satisfies Record<string, IconDefinition>

export type IconName = keyof typeof ICONS

export function iconDefinition(name: IconName): IconDefinition {
  return ICONS[name]
}
