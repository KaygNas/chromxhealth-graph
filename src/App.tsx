import './index.css'
import * as echarts from 'echarts/core'
import { CustomChart } from 'echarts/charts'
import {
  TitleComponent,
  // 数据集组件
  DatasetComponent,
  // 内置数据转换器组件 (filter, sort)
  TransformComponent,
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
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import React from 'react'
import { parseGraphModelFromRawData, RawData } from './helper'
import { CirCosModel } from './circos-model'

// 通过 ComposeOption 来组合出一个只有必须组件和图表的 Option 类型
type ECOption = ComposeOption<CustomSeriesOption | TitleComponentOption | DatasetComponentOption>

// 注册必须的组件
echarts.use([
  CustomChart,
  TitleComponent,
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

function App() {
  const chartRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const chart = initChart(chartRef.current!)
    return () => chart.dispose()
  }, [])

  function initChart(root: HTMLDivElement) {
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
        },
      ],
      series: [
        {
          // 使用自定义系列
          type: 'custom',
          coordinateSystem: 'none',
          renderItem: (params, api) => {
            const width = api.getWidth()
            const height = api.getHeight()
            const size = Math.min(width, height)
            const outterArc = circosModel.outterArcs[params.dataIndex]
            console.log('outterArc', outterArc)
            return {
              type: 'sector',
              shape: {
                cx: width / 2,
                cy: height / 2,
                r0: (outterArc.shape.r - 0.05) * size / 2,
                r: outterArc.shape.r * size / 2,
                startAngle: outterArc.shape.start * Math.PI * 2,
                endAngle: outterArc.shape.end * Math.PI * 2,
              },
              style: {
                fill: api.visual('color'),
              },
            }
          },
        },
      ],
    }
    chart.setOption(option)
    return chart
  }

  return (
    <div
      ref={chartRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <h1>Loading</h1>
    </div>
  )
}

export default App
