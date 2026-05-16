/**
 * 浏览器端图纸渲染工具
 * 将 mappedPixelData 在 HTML5 Canvas 上渲染为效果图或色号图
 */

/**
 * 从 mappedPixelData (JSON字符串或数组) 解析出 gridData 和 colorPalette
 */
export function deriveFromMapped(mappedPixelData) {
  let data = mappedPixelData
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return { gridData: [], colorPalette: [] }
    }
  }
  if (!Array.isArray(data) || !data.length) {
    return { gridData: [], colorPalette: [] }
  }

  const stats = new Map()
  const order = []

  data.forEach((row) => {
    (row || []).forEach((cell) => {
      if (!cell || cell.isExternal) return
      const key = String(cell.id || '') + '|' + String(cell.hex || '')
      if (!stats.has(key)) {
        stats.set(key, {
          id: cell.id || '',
          name: cell.name || '',
          r: Number(cell.r),
          g: Number(cell.g),
          b: Number(cell.b),
          count: 0
        })
        order.push(key)
      }
      stats.get(key).count++
    })
  })

  const colorPalette = order.map((k, i) => ({ index: i, ...stats.get(k) }))
  const indexMap = new Map(order.map((k, i) => [k, i]))

  const gridData = data.map((row) =>
    (row || []).map((cell) => {
      if (!cell || cell.isExternal) return -1
      const key = String(cell.id || '') + '|' + String(cell.hex || '')
      return indexMap.has(key) ? indexMap.get(key) : -1
    })
  )

  return { gridData, colorPalette }
}

/**
 * 绘制效果图（纯色块，无网格线无坐标）
 */
export function renderResult(canvas, gridData, colorPalette) {
  const ctx = canvas.getContext('2d')
  const rows = gridData.length
  const cols = rows > 0 ? gridData[0].length : 0
  if (!rows || !cols) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return
  }

  const cell = Math.max(1, Math.floor(Math.min(canvas.width / cols, canvas.height / rows)))
  const drawWidth = cell * cols
  const drawHeight = cell * rows
  const startX = Math.floor((canvas.width - drawWidth) / 2)
  const startY = Math.floor((canvas.height - drawHeight) / 2)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = gridData[y] ? gridData[y][x] : -1
      const color = idx >= 0 ? colorPalette[idx] : null
      ctx.fillStyle = color
        ? `rgb(${color.r},${color.g},${color.b})`
        : '#ffffff'
      ctx.fillRect(startX + x * cell, startY + y * cell, cell + 0.5, cell + 0.5)
    }
  }
}

/**
 * 绘制色号图（带网格线、坐标轴标签、底部色号汇总）
 */
export function renderPattern(canvas, gridData, colorPalette, gridSize) {
  const ctx = canvas.getContext('2d')
  const rows = gridData.length
  const cols = rows > 0 ? gridData[0].length : 0
  const size = gridSize || rows

  if (!rows || !cols) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return
  }

  // 统计色号用量
  const countById = new Map()
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = gridData[y] ? gridData[y][x] : -1
      if (idx < 0) continue
      const color = colorPalette[idx]
      if (!color) continue
      const id = String(color.id || color.name || '').trim()
      if (!id) continue
      countById.set(id, (countById.get(id) || 0) + 1)
    }
  }

  let summaryItems = Array.from(countById.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)

  if (!summaryItems.length && colorPalette.length) {
    summaryItems = colorPalette
      .filter((c) => c && (c.id || c.name) && Number(c.count) > 0)
      .map((c) => ({ id: String(c.id || c.name).trim(), count: Number(c.count) }))
      .sort((a, b) => b.count - a.count)
  }

  const maxCanvasSize = 1200
  let workingBoardSize = Math.min(canvas.width, canvas.height) || 800
  const headerHeight = 48
  let summaryHeight = 0
  let totalWidth, totalHeight

  // 迭代缩小直到总尺寸不超 maxCanvasSize
  for (let i = 0; i < 20; i++) {
    if (summaryItems.length) {
      const totalGridSize = size + 2
      const approxCellSize = workingBoardSize / totalGridSize
      let blockSize = Math.floor(approxCellSize * 1.2)
      if (blockSize < 36) blockSize = 36
      const blockSpacing = Math.floor(blockSize * 0.1)
      const availableWidth = workingBoardSize
      const blocksPerRow = Math.max(1, Math.floor(availableWidth / (blockSize + blockSpacing)))
      const maxRows = 3
      let rowsNeeded = Math.ceil(summaryItems.length / blocksPerRow)
      if (rowsNeeded > maxRows) {
        const targetBlocksPerRow = Math.ceil(summaryItems.length / maxRows)
        const maxBlockSize = Math.floor(availableWidth / targetBlocksPerRow - blockSpacing)
        if (maxBlockSize >= 36) blockSize = maxBlockSize
        rowsNeeded = maxRows
      }
      summaryHeight = rowsNeeded * (blockSize + blockSpacing) + 16
    }

    totalWidth = workingBoardSize
    totalHeight = headerHeight + workingBoardSize + summaryHeight
    if (totalWidth <= maxCanvasSize && totalHeight <= maxCanvasSize) break
    workingBoardSize = Math.max(400, Math.floor(workingBoardSize * 0.92))
  }

  // 计算单元格位置
  const totalGridSize = size + 2
  let cellSize = Math.floor(workingBoardSize / totalGridSize)
  const outerSize = Math.max(16, Math.floor(cellSize * 0.6))
  const effectiveGridSize = size * cellSize
  const totalGridPixels = effectiveGridSize + outerSize * 2

  const gridOffsetX = Math.floor((workingBoardSize - totalGridPixels) / 2)
  const offsetX = gridOffsetX
  const offsetY = headerHeight + gridOffsetX
  const startX = offsetX + outerSize
  const startY = offsetY + outerSize

  totalWidth = workingBoardSize
  totalHeight = headerHeight + workingBoardSize + summaryHeight

  // 调整 canvas 大小
  canvas.width = totalWidth
  canvas.height = totalHeight

  // 白底
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, totalWidth, totalHeight)

  // 标题
  if (headerHeight > 0) {
    ctx.fillStyle = '#5D4037'
    const titleFontSize = Math.max(16, Math.floor(headerHeight * 0.45))
    ctx.font = `${titleFontSize}px sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('拼豆魔法屋', offsetX, headerHeight / 2)
  }

  // 坐标轴背景（浅蓝）
  ctx.fillStyle = '#E3F2FD'
  for (let x = 0; x < size; x++) {
    ctx.fillRect(startX + x * cellSize, offsetY, cellSize, outerSize)
    ctx.fillRect(startX + x * cellSize, offsetY + effectiveGridSize + outerSize, cellSize, outerSize)
  }
  for (let y = 0; y < size; y++) {
    ctx.fillRect(offsetX, startY + y * cellSize, outerSize, cellSize)
    ctx.fillRect(offsetX + effectiveGridSize + outerSize, startY + y * cellSize, outerSize, cellSize)
  }

  // 主网格填色 + 网格线
  ctx.strokeStyle = '#aaaaaa'
  ctx.lineWidth = 0.5
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = gridData[y] ? gridData[y][x] : -1
      const color = idx >= 0 ? colorPalette[idx] : null
      ctx.fillStyle = color
        ? `rgb(${color.r},${color.g},${color.b})`
        : '#ffffff'
      const cx = startX + x * cellSize
      const cy = startY + y * cellSize
      ctx.fillRect(cx, cy, cellSize, cellSize)
      ctx.strokeRect(cx, cy, cellSize, cellSize)
    }
  }

  // 网格内色号文字
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = gridData[y] ? gridData[y][x] : -1
      const color = idx >= 0 ? colorPalette[idx] : null
      if (!color) continue

      const lum = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b
      const textColor = lum > 140 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)'
      const text = String(color.id || color.name || '').trim()

      let fontSize = Math.max(6, Math.floor(cellSize * 0.42))
      ctx.font = `${fontSize}px sans-serif`
      let textWidth = ctx.measureText(text).width
      while (textWidth > cellSize * 0.85 && fontSize > 5) {
        fontSize--
        ctx.font = `${fontSize}px sans-serif`
        textWidth = ctx.measureText(text).width
      }

      ctx.fillStyle = textColor
      const cx = startX + x * cellSize + cellSize / 2
      const cy = startY + y * cellSize + cellSize / 2
      ctx.fillText(text, cx, cy)
    }
  }

  // 坐标轴数字
  const axisFont = Math.max(8, Math.floor(cellSize * 0.33))
  ctx.font = `${axisFont}px sans-serif`
  ctx.fillStyle = '#5D4037'
  for (let x = 0; x < size; x++) {
    const label = String(x + 1)
    const cx = startX + x * cellSize + cellSize / 2
    ctx.fillText(label, cx, offsetY + outerSize / 2)
    ctx.fillText(label, cx, offsetY + effectiveGridSize + outerSize + outerSize / 2)
  }
  for (let y = 0; y < size; y++) {
    const label = String(y + 1)
    const cy = startY + y * cellSize + cellSize / 2
    ctx.fillText(label, offsetX + outerSize / 2, cy)
    ctx.fillText(label, offsetX + effectiveGridSize + outerSize + outerSize / 2, cy)
  }

  // 底部色号汇总块
  if (summaryItems.length) {
    const axisBottomY = offsetY + effectiveGridSize + outerSize * 2
    const summaryTop = axisBottomY + Math.floor(outerSize * 0.5)

    let blockSize = Math.floor(cellSize * 1.1)
    if (blockSize < 36) blockSize = 36
    const blockSpacing = Math.floor(blockSize * 0.1)
    const availableWidth = totalGridPixels
    let blocksPerRow = Math.max(1, Math.floor(availableWidth / (blockSize + blockSpacing)))
    const maxRows = 3
    if (summaryItems.length > blocksPerRow * maxRows) {
      blocksPerRow = Math.ceil(summaryItems.length / maxRows)
      const maxBlockSize = Math.floor(availableWidth / blocksPerRow - blockSpacing)
      if (maxBlockSize >= 36) blockSize = maxBlockSize
    }
    const totalBlocksWidth = blocksPerRow * blockSize + (blocksPerRow - 1) * blockSpacing
    const blocksStartX = offsetX + Math.floor((availableWidth - totalBlocksWidth) / 2)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    summaryItems.forEach((item, idx) => {
      const row = Math.floor(idx / blocksPerRow)
      const col = idx % blocksPerRow
      const bx = blocksStartX + col * (blockSize + blockSpacing)
      const by = summaryTop + row * (blockSize + blockSpacing)
      const w = blockSize
      const h = blockSize

      const color = colorPalette.find(
        (c) => String(c.id) === String(item.id) || String(c.name) === String(item.id)
      )
      if (color) {
        ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`
        roundRect(ctx, bx, by, w, h, 6)
        ctx.fill()

        const lum = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b
        ctx.fillStyle = lum > 140 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)'
        const fontSize = Math.max(10, Math.floor(blockSize * 0.23))
        ctx.font = `${fontSize}px sans-serif`
        const lineHeight = blockSize / 3
        ctx.fillText(item.id, bx + w / 2, by + lineHeight)
        ctx.fillText(`x${item.count}`, bx + w / 2, by + lineHeight * 2)
      } else {
        ctx.fillStyle = '#E0E0E0'
        roundRect(ctx, bx, by, w, h, 6)
        ctx.fill()
        ctx.fillStyle = '#5D4037'
        ctx.font = `${Math.max(10, Math.floor(blockSize * 0.18))}px sans-serif`
        ctx.fillText(`${item.id}x${item.count}`, bx + w / 2, by + h / 2)
      }
    })
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}
