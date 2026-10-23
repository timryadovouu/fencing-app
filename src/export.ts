import type { CanvasElement, Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import { db, normalize, type Tournament } from './db'
import { bracketOf, fencerOf, finalStandings, findBout, namesOf, overallRanking, pisteOf, poolBouts, poolRanking, poolRetired, statusLabel } from './derive'
import { cellLabel } from './domain/bout'
import { poolName } from './domain/pools'
import { BYE, isFencer, type DeMatch } from './domain/tableau'
import { formatSigned } from './format'
import { dateFormat, formatRatio, type Dict } from './i18n'

// На телефоне — системное меню «Поделиться» (сохранить в Файлы, отправить в мессенджер),
// на компьютере — обычное скачивание.
export async function saveFile(name: string, type: string, content: BlobPart) {
  const blob = new Blob([content], { type })
  const file = new File([blob], name, { type })
  const touch = matchMedia('(pointer: coarse)').matches
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function fileSafe(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, ' ').replace(/[.\s]+$/, '').trim() || 'tournament'
}

// Строки итоговой таблицы: по итоговым местам, если турнир завершён, иначе по рейтингу пулек.
function summaryRows(t: Tournament) {
  const places = new Map(finalStandings(t)?.map((s) => [s.fencer, s.place]))
  const ranking = overallRanking(t)
  const key = (id: string) => places.get(id) ?? Infinity // без места — в конец
  const rows = places.size ? [...ranking].sort((x, y) => key(x.fencer) - key(y.fencer)) : ranking
  return rows.map((r) => ({ ...r, finalPlace: places.get(r.fencer) }))
}

export function resultsCsv(t: Tournament, L: Dict): string {
  const names = namesOf(t)
  const c = L.csv
  const rows = [[c.num, c.fencer, c.v, c.bouts, c.vm, c.ts, c.tr, c.ind, c.finalPlace, c.poolPlace]]
  summaryRows(t).forEach((r, i) => {
    rows.push([
      String(i + 1),
      names.get(r.fencer) ?? '',
      String(r.victories),
      String(r.matches),
      formatRatio(L, r.ratio),
      String(r.scored),
      String(r.received),
      String(r.index),
      r.finalPlace === null ? (statusLabel(L, fencerOf(t, r.fencer)) ?? '') : String(r.finalPlace ?? ''),
      String(r.place),
    ])
  })
  // Снятые в пульке: показателей нет, вместо мест — пометка.
  for (const id of poolRetired(t)) {
    const label = statusLabel(L, fencerOf(t, id)) ?? ''
    rows.push([String(rows.length), names.get(id) ?? '', '', '', '', '', '', '', label, label])
  }
  // «;» и BOM — чтобы Excel с русской локалью открыл файл без мастера импорта.
  const csv = rows.map((row) => row.map((v) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(';'))
  return '﻿' + csv.join('\r\n')
}

export function exportCsv(t: Tournament, L: Dict) {
  return saveFile(`${fileSafe(t.name)}.csv`, 'text/csv', resultsCsv(t, L))
}

// ——— PDF ———
// Две части, как на бумаге: протоколы пулек, затем сетка олимпийки.

const PAGE = { width: 841.89, height: 595.28 } // A4 альбомная
const MARGIN = 32

const head = (text: string) => ({ text, style: 'th', alignment: 'center' as const })

function poolTable(t: Tournament, L: Dict, pool: string[]): Content {
  const names = namesOf(t)
  const bouts = poolBouts(t, pool)
  const stats = new Map(poolRanking(t, pool).map((r) => [r.fencer, r]))
  const retired = poolRetired(t)
  const center = (text: string, bold = false) => ({ text, bold, alignment: 'center' as const })
  const body: TableCell[][] = pool.map((x, i) => {
    const st = stats.get(x)
    const cells: TableCell[] = pool.map((y, j) => {
      if (i === j) return { text: '', fillColor: '#444444' }
      if (retired.has(x) || retired.has(y)) return { text: '', fillColor: '#f0f0f0' } // аннулирован
      const bout = findBout(bouts, x, y)
      if (!bout) return ''
      const win = bout.winner === x
      return { ...center(cellLabel(bout, x, t.settings.touches), win), fillColor: win ? '#e3efe7' : undefined }
    })
    if (!st) {
      const label = statusLabel(L, fencerOf(t, x)) ?? ''
      return [
        center(String(i + 1)),
        { text: names.get(x) ?? '', color: '#888888', decoration: 'lineThrough' },
        ...cells,
        { text: label, colSpan: 6, alignment: 'center', color: '#888888' },
        '',
        '',
        '',
        '',
        '',
      ]
    }
    return [
      center(String(i + 1)),
      names.get(x) ?? '',
      ...cells,
      center(String(st.victories), true),
      center(formatRatio(L, st.ratio)),
      center(String(st.scored)),
      center(String(st.received)),
      center(formatSigned(st.index)),
      center(st.matches ? String(st.place) : '—', true),
    ]
  })
  return {
    table: {
      headerRows: 1,
      widths: [16, '*', ...pool.map(() => 24), 22, 30, 24, 24, 28, 22],
      body: [
        [
          head(''),
          { ...head(L.col.fencer), alignment: 'left' as const },
          ...pool.map((_, j) => head(String(j + 1))),
          ...[L.col.v, L.col.vm, L.col.ts, L.col.tr, L.col.ind, L.col.place].map(head),
        ],
        ...body,
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: (i: number) => (i === pool.length + 2 ? 1.5 : 0.5),
      hLineColor: () => '#999999',
      vLineColor: () => '#999999',
      fillColor: (row: number) => (row === 0 ? '#eeeeee' : null),
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
    margin: [0, 0, 0, 18],
  }
}

// Сетка рисуется абсолютными координатами страницы: прямоугольники боёв, линии между кругами.
function bracketDrawing(t: Tournament, L: Dict, pageHeight: number): Content[] {
  const bracket = bracketOf(t)!
  const seeds = t.tableau!.seeds
  const names = namesOf(t)
  const rounds = bracket.rounds
  const top = MARGIN + 48
  const colW = Math.min(180, (PAGE.width - 2 * MARGIN) / rounds.length)
  const gap = 16
  const cardW = colW - gap
  const rowH = 14
  const cellH = (pageHeight - top - MARGIN) / rounds[0].length
  const fontSize = cardW < 130 ? 7 : 8
  const maxChars = Math.floor((cardW - 30) / (fontSize * 0.52))
  const fit = (s: string) => (s.length > maxChars ? s.slice(0, maxChars - 1) + '…' : s)

  const canvas: CanvasElement[] = []
  const texts: Content[] = []
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    canvas.push({ type: 'line', x1, y1, x2, y2, lineWidth: 0.8, lineColor: '#777777' })

  const drawCard = (m: DeMatch, x: number, cy: number) => {
    const y = cy - rowH
    canvas.push({ type: 'rect', x, y, w: cardW, h: rowH * 2, r: 2, lineWidth: 0.6, lineColor: '#888888' })
    ;[m.a, m.b].forEach((slot, k) => {
      const ry = y + k * rowH
      const winner = isFencer(slot) && m.winner === slot
      if (winner) canvas.push({ type: 'rect', x: x + 0.5, y: ry + 0.5, w: cardW - 1, h: rowH - 1, color: '#e3efe7' })
      if (k === 1) line(x, ry, x + cardW, ry)
      const ty = ry + (rowH - fontSize) / 2 - 0.5
      if (slot === BYE || !slot) {
        texts.push({
          text: slot === BYE ? L.bye : '',
          italics: true,
          color: '#888888',
          fontSize,
          absolutePosition: { x: x + 4, y: ty },
        })
        return
      }
      const score = m.result ? (m.result.a === slot ? m.result.scoreA : m.result.scoreB) : null
      texts.push({
        text: [
          { text: `${seeds.indexOf(slot) + 1}  `, color: '#777777' },
          fit(names.get(slot) ?? ''),
          ...(statusLabel(L, fencerOf(t, slot)) ? [{ text: `  ${statusLabel(L, fencerOf(t, slot))}`, color: '#b5414f' }] : []),
        ],
        bold: winner,
        fontSize,
        absolutePosition: { x: x + 4, y: ty },
      })
      if (score !== null) texts.push({ text: String(score), bold: winner, fontSize, absolutePosition: { x: x + cardW - 14, y: ty } })
    })
  }

  rounds.forEach((round, r) => {
    const x = MARGIN + r * colW
    const h = cellH * 2 ** r
    texts.push({
      text: L.roundName(round.length).toUpperCase(),
      bold: true,
      fontSize: 7,
      color: '#666666',
      absolutePosition: { x, y: top - 16 },
    })
    round.forEach((m, i) => {
      const cy = top + (i + 0.5) * h
      drawCard(m, x, cy)
      if (r < rounds.length - 1) {
        const mx = x + cardW + gap / 2
        line(x + cardW, cy, mx, cy)
        if (i % 2 === 0) {
          const siblingY = cy + h
          line(mx, cy, mx, siblingY)
          line(mx, cy + h / 2, x + colW, cy + h / 2)
        }
      }
    })
  })

  if (bracket.bronze) {
    const x = MARGIN + (rounds.length - 1) * colW
    const cy = top + cellH * 2 ** (rounds.length - 1) * 0.5 + rowH * 2 + 34
    texts.push({ text: L.bronze, bold: true, fontSize: 7, color: '#666666', absolutePosition: { x, y: cy - rowH - 12 } })
    drawCard(bracket.bronze, x, cy)
  }

  return [{ canvas, absolutePosition: { x: 0, y: 0 } }, ...texts]
}

function pdfDocument(t: Tournament, L: Dict): TDocumentDefinitions {
  const content: Content[] = [
    { text: t.name, style: 'title' },
    { text: `${L.weapons[t.settings.weapon]} · ${dateFormat(L).format(t.createdAt)}`, style: 'subtitle' },
  ]

  t.pools.forEach((pool, p) => {
    content.push({
      stack: [
        { text: `${L.poolProtocol(t.pools.length > 1 ? poolName(p) : null)} · ${L.piste(pisteOf(t, p))}`, style: 'h2' },
        poolTable(t, L, pool),
      ],
      unbreakable: true,
    })
  })

  // Высота страницы растёт для больших сеток, чтобы бои не слипались.
  let pageHeight = PAGE.height
  if (t.tableau) {
    const firstRound = bracketOf(t)!.rounds[0].length
    pageHeight = Math.max(PAGE.height, MARGIN * 2 + 48 + firstRound * 36)
    content.push({ text: L.tableau, style: 'h2', pageBreak: 'before' })
    content.push(...bracketDrawing(t, L, pageHeight))
  }

  return {
    pageSize: { width: PAGE.width, height: pageHeight },
    pageMargins: [MARGIN, MARGIN, MARGIN, MARGIN],
    info: { title: t.name },
    content,
    defaultStyle: { font: 'Roboto', fontSize: 9 },
    styles: {
      title: { fontSize: 16, bold: true },
      subtitle: { fontSize: 10, color: '#555555', margin: [0, 2, 0, 14] },
      h2: { fontSize: 12, bold: true, margin: [0, 4, 0, 8] },
      th: { bold: true, fontSize: 8, color: '#333333' },
    },
  }
}

type PdfMake = typeof import('pdfmake/build/pdfmake')
type Vfs = typeof import('pdfmake/build/vfs_fonts')

// pdfmake (~1 МБ со шрифтом с кириллицей) грузим только при первом экспорте.
let pdfMakeReady: Promise<PdfMake> | null = null
function loadPdfMake(): Promise<PdfMake> {
  pdfMakeReady ??= Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')]).then(
    ([pdfMod, vfsMod]) => {
      const pdfMake = ((pdfMod as unknown as { default?: PdfMake }).default ?? pdfMod) as PdfMake
      const vfs = ((vfsMod as unknown as { default?: Vfs }).default ?? vfsMod) as Vfs
      pdfMake.addVirtualFileSystem(vfs)
      return pdfMake
    },
  )
  return pdfMakeReady
}

export async function exportPdf(t: Tournament, L: Dict) {
  const pdfMake = await loadPdfMake()
  const blob = await pdfMake.createPdf(pdfDocument(t, L)).getBlob()
  await saveFile(`${fileSafe(t.name)}.pdf`, 'application/pdf', blob)
}

// ——— резервная копия ———

// Один формат и для резервной копии, и для обмена одним турниром: всё — настройки, оружие,
// участники, все бои пулек и олимпийки, снятия и карточки.
function fileContent(tournaments: Tournament[]): string {
  const clean = tournaments.map((t) => {
    const copy = { ...t }
    delete copy.pristine
    return copy
  })
  return JSON.stringify({ app: 'fencing-app', version: 1, exportedAt: new Date().toISOString(), tournaments: clean }, null, 2)
}

export async function exportBackup() {
  const tournaments = await db.tournaments.filter((t) => !t.pristine).toArray()
  const stamp = new Date().toISOString().slice(0, 10)
  await saveFile(`fencing-backup-${stamp}.json`, 'application/json', fileContent(tournaments))
}

export function exportJson(t: Tournament) {
  return saveFile(`${fileSafe(t.name)}.json`, 'application/json', fileContent([t]))
}

// Возвращает id загруженных турниров. Турнир с тем же id перезаписывается (повторный импорт — обновление).
export async function importBackup(file: File, L: Dict): Promise<string[]> {
  const data = JSON.parse(await file.text())
  const list: unknown[] = Array.isArray(data?.tournaments) ? data.tournaments : []
  const valid = list.filter(
    (t): t is Tournament =>
      typeof t === 'object' &&
      t !== null &&
      typeof (t as Tournament).id === 'string' &&
      typeof (t as Tournament).name === 'string',
  )
  if (valid.length === 0) throw new Error(L.backupEmpty)
  await db.tournaments.bulkPut(valid.map((t) => ({ ...normalize(t), pristine: false })))
  return valid.map((t) => t.id)
}
