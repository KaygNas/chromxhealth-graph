import { EdgeModel, GraphModel, NodeModel } from "./graph"

// copy from https://zhuanlan.zhihu.com/p/331713058
export type RawData = [string[], ...rest: [string, ...rest: number[]][]]

export function structureRawData(rawData: RawData) {
  const [headerRow, ...rows] = rawData
  const headerCol = rawData.map(row => row[0])
  const valueMatrix = rows.map((row) => {
    const [_, ...values] = row
    return values
  })
  const totalValue = valueMatrix.flat().reduce((acc, value) => acc + value, 0)
  return {
    headerRow,
    headerCol,
    valueMatrix,
    totalValue
  }
}

export function parseGraphModelFromRawData(rawData: RawData): GraphModel {
  const { headerCol, headerRow, valueMatrix, totalValue } = structureRawData(rawData)

  const nodes = [...headerCol.slice(1), ...headerRow.slice(1)].map<NodeModel>(id => {
    return { id }
  })
  let edgeId = 0
  const edges = valueMatrix.flatMap((row, sourceIndex) => {
    return row.map<EdgeModel>((value, targetIndex) => {
      const source = headerCol[sourceIndex + 1]
      const target = headerRow[targetIndex + 1]
      return {
        source,
        target,
        value: value / totalValue,
        id: `${edgeId++}`
      }
    })
  })

  return { nodes, edges }
}