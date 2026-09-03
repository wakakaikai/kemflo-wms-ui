export const ROUTING_NODE_NAME = 'routing-task'
export const ROUTING_EDGE_NAME = 'routing-edge'
export const ROUTING_PORT_OUT_NAME = 'routing-port-out'

const EDGE_COLOR = '#999999'
const BG_BLUE = '#DFE9F7'
const BG_WHITE = '#FFFFFF'
const NODE_BORDER = '#CCCCCC'
const TITLE = '#333333'
const STROKE_BLUE = '#288FFF'
const NODE_SHADOW = 'drop-shadow(3px 3px 4px rgba(0, 0, 0, 0.2)'
const EDGE_SHADOW = 'drop-shadow(3px 3px 2px rgba(0, 0, 0, 0.3)'

export const PORT = {
  groups: {
    [ROUTING_PORT_OUT_NAME]: {
      position: {
        name: 'absolute',
        args: {
          x: 60,
          y: 24,
        },
      },
      markup: [
        {
          tagName: 'g',
          selector: 'body',
          children: [
            {
              tagName: 'circle',
              selector: 'circle-outer',
            },
            {
              tagName: 'text',
              selector: 'plus-text',
            },
            {
              tagName: 'circle',
              selector: 'circle-inner',
            },
          ],
        },
      ],
      attrs: {
        'body': {
          magnet: true,
        },
        'plus-text': {
          fontSize: 12,
          fill: NODE_BORDER,
          text: '+',
          textAnchor: 'middle',
          x: 0,
          y: 3,
        },
        'circle-outer': {
          stroke: NODE_BORDER,
          strokeWidth: 1,
          r: 6,
          fill: BG_WHITE,
        },
        'circle-inner': {
          r: 4,
          fill: 'transparent',
        },
      },
    },
  },
}

export const PORT_HOVER = {
  groups: {
    [ROUTING_PORT_OUT_NAME]: {
      attrs: {
        'circle-outer': {
          stroke: STROKE_BLUE,
          fill: BG_BLUE,
          r: 8,
        },
        'circle-inner': {
          fill: STROKE_BLUE,
          r: 6,
        },
      },
    },
  },
}

export const PORT_SELECTED = {
  groups: {
    [ROUTING_PORT_OUT_NAME]: {
      attrs: {
        'plus-text': {
          fill: STROKE_BLUE,
        },
        'circle-outer': {
          stroke: STROKE_BLUE,
          fill: BG_WHITE,
        },
      },
    },
  },
}

export const NODE_STATUS_MARKUP = [
  {
    tagName: 'foreignObject',
    selector: 'fo',
    children: [
      {
        tagName: 'div',
        selector: 'fo-body',
        ns: 'http://www.w3.org/1999/xhtml',
      },
    ],
    style: {
      width: 20,
      height: 20,
    },
  },
]

export const NODE = {
  width: 80,
  height: 48,
  markup: [
    {
      tagName: 'rect',
      selector: 'body',
    },
    {
      tagName: 'image',
      selector: 'image',
    },
    {
      tagName: 'text',
      selector: 'title',
    },
  ],
  attrs: {
    body: {
      refWidth: '100%',
      refHeight: '100%',
      rx: 6,
      ry: 6,
      pointerEvents: 'visiblePainted',
      fill: BG_WHITE,
      stroke: NODE_BORDER,
      strokeWidht: 1,
      strokeDasharray: 'none',
      filter: 'none',
    },
    image: {
      width: 30,
      height: 30,
      refX: 12,
      refY: 9,
      href: 'https://gw.alipayobjects.com/mdn/rms_43231b/afts/img/A*kUy8SrEDp6YAAAAAAAAAAAAAARQnAQ',
    },
    title: {
      refX: 0.5,
      refY: '100%',
      refY2: 10,
      textAnchor: 'middle',
      textVerticalAnchor: 'top',
      fontFamily: 'Microsoft Yahei',
      fontSize: 12,
      fontWeight: 'bold',
      fill: TITLE,
      strokeWidth: 0,
    },
    fo: {
      refX: '46%',
      refY: -25,
    },
  },
  ports: {
    ...PORT,
    items: [
      {
        id: ROUTING_PORT_OUT_NAME,
        group: ROUTING_PORT_OUT_NAME,
      },
    ],
  },
  tools: [
    {
      name: 'nodemenu',
    },
  ],
}

export const NODE_HOVER = {
  attrs: {
    body: {
      fill: BG_WHITE,
      stroke: STROKE_BLUE,
      strokeDasharray: '5 2',
    },
    title: {
      fill: STROKE_BLUE,
    },
  },
}

export const NODE_SELECTED = {
  attrs: {
    body: {
      filter: NODE_SHADOW,
      fill: BG_WHITE,
      stroke: STROKE_BLUE,
      strokeDasharray: '5 2',
      strokeWidth: '1.5',
    },
    title: {
      fill: STROKE_BLUE,
    },
  },
}

export const EDGE = {
  attrs: {
    line: {
      stroke: EDGE_COLOR,
      strokeWidth: 1,
      targetMarker: {
        tagName: 'path',
        fill: EDGE_COLOR,
        strokeWidth: 0,
        d: 'M 6 -3 0 0 6 3 Z',
      },
      filter: 'none',
    },
  },
  connector: {
    name: 'rounded',
  },
  router: {
    name: 'manhattan',
    args: {
      endDirections: ['top', 'bottom', 'left'],
    },
  },
  defaultLabel: {
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        tagName: 'text',
        selector: 'label',
      },
    ],
    attrs: {
      text: {
        text: '',
      },
      label: {
        fill: EDGE_COLOR,
        fontSize: 14,
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        pointerEvents: 'none',
      },
      body: {
        ref: 'label',
        fill: BG_WHITE,
        stroke: EDGE_COLOR,
        strokeWidth: 1,
        rx: 4,
        ry: 4,
        refWidth: '140%',
        refHeight: '140%',
        refX: '-20%',
        refY: '-20%',
      },
    },
    position: {
      distance: 0.5,
      options: {
        absoluteDistance: true,
        reverseDistance: true,
      },
    },
  },
}

export const EDGE_HOVER = {
  attrs: {
    line: {
      stroke: STROKE_BLUE,
      targetMarker: {
        fill: STROKE_BLUE,
      },
    },
  },
  defaultLabel: {
    attrs: {
      label: {
        fill: STROKE_BLUE,
      },
      body: {
        fill: BG_WHITE,
        stroke: STROKE_BLUE,
      },
    },
  },
}

export const EDGE_SELECTED = {
  attrs: {
    line: {
      stroke: STROKE_BLUE,
      targetMarker: {
        fill: STROKE_BLUE,
      },
      strokeWidth: 2,
      filter: EDGE_SHADOW,
    },
  },
  defaultLabel: {
    attrs: {
      label: {
        fill: STROKE_BLUE,
      },
      body: {
        fill: BG_WHITE,
        stroke: STROKE_BLUE,
      },
    },
  },
}
