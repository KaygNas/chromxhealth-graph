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
import { Sector, InnerCurve, CirCosModel, InnerSector, OutterSector } from './circos-model'
import { CustomElementOption, CustomRootElementOption } from 'echarts/types/src/chart/custom/CustomSeries.js'

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
  ['Gene3', 87332, 87643, 84969, 87234],
  ['Gene4', 75643, 79184, 77444, 76810],
  ['Gene5', 87332, 87643, 84969, 87234],
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
      ...circosModel.outterSectors.map((sector) => (getSectorSeriesOption(sector))),
      ...circosModel.innerSectors.map((sector) => (getSectorSeriesOption(sector))),
      ...circosModel.innerCurves.map((bezierCurve) => (getInnerCurveSeriesOption(bezierCurve))),
    ],
  }

  function getSectorSeriesOption(sector: OutterSector | InnerSector) {
    const arcSeriesOption: CustomSeriesOption = {
      // 使用自定义系列
      type: 'custom',
      coordinateSystem: 'none',
      name: sector.node.id,
      renderItem: (params, api) => {
        const arcEle: CustomRootElementOption = {
          type: 'sector',
          shape: {
            cx: sector.shape.cx,
            cy: sector.shape.cy,
            r0: sector.shape.r0,
            r: sector.shape.r,
            startAngle: sector.shape.start * Math.PI * 2,
            endAngle: sector.shape.end * Math.PI * 2,
          },
          style: {
            fill: api.visual('color'),
          },
        }

        const width = api.getWidth()
        const height = api.getHeight()
        const size = Math.min(width, height) / 2
        const groupEle: CustomRootElementOption = {
          type: 'group',
          scaleX: size,
          scaleY: size,
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

function getInnerCurveSeriesOption(innerCurve: InnerCurve) {
  const innerCurveSeriesOption: CustomSeriesOption = {
    type: 'custom',
    coordinateSystem: 'none',
    name: innerCurve.start.parent.node.id,
    renderItem: (params, api) => {
      const curveEle: CustomElementOption = {
        type: 'path',
        shape: {
          pathData: innerCurve.shape.pathData.join(' '),
        },
        style: {
          fill: api.visual('color'),
          opacity: 0.1,
        },
        emphasis: {
          style: {
            opacity: 1,
          }
        },
        blur: {
          style: {
            opacity: 0.00,
          }
        }
      }

      const width = api.getWidth()
      const height = api.getHeight()
      const size = Math.min(width, height) / 2
      const groupEle: CustomRootElementOption = {
        type: 'group',
        x: width / 2,
        y: height / 2,
        scaleX: size,
        scaleY: size,
        children: [curveEle],
        focus: 'self'
      }
      return groupEle as any
    },
  }

  return innerCurveSeriesOption
}