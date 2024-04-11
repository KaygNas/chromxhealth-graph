import './index.css'
import { initChart } from './chart'
import React from 'react'

function App() {
  const chartRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const chart = initChart(chartRef.current!)
    return () => chart.dispose()
  }, [])

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
