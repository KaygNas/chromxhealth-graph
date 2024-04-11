import * as echarts from 'echarts/core'
import { CustomChart } from 'echarts/charts'
import {
  TitleComponent,
  // 数据集组件
  DatasetComponent,
  // 内置数据转换器组件 (filter, sort)
  TransformComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import type {
  // 系列类型的定义后缀都为 SeriesOption
  CustomSeriesOption,
} from 'echarts/charts'
import type {
  // 组件类型的定义后缀都为 ComponentOption
  TitleComponentOption,
  DatasetComponentOption,
  TooltipComponentOption,
  LegendComponentOption,
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import { parseGraphModelFromRawData, RawData } from './helper'
import { Arc, BezierCurve, CirCosModel, InnerArc, OutterArc } from './circos-model'
import { CustomRootElementOption } from 'echarts/types/src/chart/custom/CustomSeries.js'

// 通过 ComposeOption 来组合出一个只有必须组件和图表的 Option 类型
type ECOption = ComposeOption<CustomSeriesOption | TitleComponentOption | TooltipComponentOption | LegendComponentOption | DatasetComponentOption>

// 注册必须的组件
echarts.use([
  CustomChart,
  TitleComponent,
  LegendComponent,
  TooltipComponent,
  DatasetComponent,
  TransformComponent,
  UniversalTransition,
  CanvasRenderer,
])

// copy from https://zhuanlan.zhihu.com/p/331713058
const rawData: RawData = [
  ['Gene', 'Con1', 'Con2', 'Treat1', 'Treat2'],
  ['Gene1', 87332, 87643, 84969, 87234],
  ['Gene2', 75643, 79184, 77444, 76810],
  // ['Gene3', 87332, 87643, 84969, 87234],
  // ['Gene4', 75643, 79184, 77444, 76810],
  // ['Gene5', 87332, 87643, 84969, 87234],
]

export function initChart(root: HTMLDivElement) {
  const chart = echarts.init(root)
  const graphModel = parseGraphModelFromRawData(rawData)
  const circosModel = new CirCosModel(graphModel)
  const option: ECOption = {
    title: {
      text: 'Circos和弦图',
    },
    dataset: [
      {
        source: circosModel.model,
        dimensions: ['name', 'value'],
      },
    ],
    tooltip: {
      show: true,
    },
    legend: {
      show: true,
      bottom: '5%',
    },
    series: [
      ...circosModel.outterArcs.map((arc) => (getArcSeriesOption(arc))),
      ...circosModel.innerArcs.map((arc) => (getArcSeriesOption(arc))),
      ...circosModel.innerBezierCurves.map((bezierCurve) => (getBezierCurveSeriesOption(bezierCurve))),
    ],
  }

  function getArcSeriesOption(arc: OutterArc | InnerArc) {
    const arcSeriesOption: CustomSeriesOption = {
      // 使用自定义系列
      type: 'custom',
      coordinateSystem: 'none',
      name: arc.node.id,
      renderItem: (params, api) => {
        const width = api.getWidth()
        const height = api.getHeight()
        const size = Math.min(width, height) / 2
        const arcEle: CustomRootElementOption = {
          type: 'sector',
          shape: {
            cx: arc.shape.cx * size,
            cy: arc.shape.cy * size,
            r0: (arc.shape.r - 0.05) * size,
            r: arc.shape.r * size,
            startAngle: arc.shape.start * Math.PI * 2,
            endAngle: arc.shape.end * Math.PI * 2,
          },
          style: {
            fill: api.visual('color'),
          },
        }

        const groupEle: CustomRootElementOption = {
          type: 'group',
          x: width / 2,
          y: height / 2,
          children: [arcEle],
        }
        return groupEle as any
      },
    }

    return arcSeriesOption
  }

  chart.setOption(option)
  return chart
}

function getBezierCurveSeriesOption(bezierCurve: BezierCurve) {
  const bezierCurveSeriesOption: CustomSeriesOption = {
    type: 'custom',
    coordinateSystem: 'none',
    name: bezierCurve.edge.source.id,
    renderItem: (params, api) => {
      const width = api.getWidth()
      const height = api.getHeight()
      const size = Math.min(width, height) / 2
      const bezierCurveEle: CustomRootElementOption = {
        type: 'bezierCurve',
        shape: {
          x1: bezierCurve.shape.x1 * size,
          y1: bezierCurve.shape.y1 * size,
          x2: bezierCurve.shape.x2 * size,
          y2: bezierCurve.shape.y2 * size,
          cpx1: bezierCurve.shape.cpx1 * size,
          cpy1: bezierCurve.shape.cpy1 * size,
          cpx2: bezierCurve.shape.cpx2 * size,
          cpy2: bezierCurve.shape.cpy2 * size,
        },
        style: {
          stroke: api.visual('color'),
        },
      }

      const groupEle: CustomRootElementOption = {
        type: 'group',
        x: width / 2,
        y: height / 2,
        children: [bezierCurveEle],
      }
      return groupEle as any
    },
  }

  return bezierCurveSeriesOption
}