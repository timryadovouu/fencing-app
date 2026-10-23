import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'

interface Props {
  minutes: number
  periods: number // 1 — бой в пульке, 3 — олимпийка (шпага, рапира), 2 — олимпийка сабли
  breakAt?: number // сабля: первый период заканчивается, когда у одного из бойцов столько уколов
  maxScore?: number // больший из двух текущих счётов
  breakSeconds?: number
}

type Phase = 'fight' | 'break'

function beep(ctx: AudioContext | null) {
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.value = 0.3
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.8)
  } catch {
    // звук недоступен — не критично
  }
}

function format(ms: number): string {
  const total = Math.ceil(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export function Timer({ minutes, periods, breakAt, maxScore = 0, breakSeconds = 60 }: Props) {
  const { L } = useI18n()
  const fightMs = minutes * 60_000
  const [phase, setPhase] = useState<Phase>('fight')
  const [period, setPeriod] = useState(1)
  const [remaining, setRemaining] = useState(fightMs)
  const [running, setRunning] = useState(false)
  const endAt = useRef(0)
  const audio = useRef<AudioContext | null>(null)

  // Сабля: набрали нужное число уколов в первом периоде — время стоит, пора на перерыв.
  // (только если время уже запускали — при исправлении сыгранного боя перерыв не нужен)
  const started = running || remaining < fightMs
  const scoreBreak = breakAt !== undefined && started && phase === 'fight' && period === 1 && maxScore >= breakAt
  const ticking = running && !scoreBreak

  useEffect(() => {
    if (!ticking) return
    const id = setInterval(() => {
      const left = Math.max(0, endAt.current - Date.now())
      setRemaining(left)
      if (left === 0) {
        setRunning(false)
        beep(audio.current)
      }
    }, 100)
    return () => clearInterval(id)
  }, [ticking])

  // Не даём экрану погаснуть, пока идёт время.
  useEffect(() => {
    if (!ticking) return
    let lock: WakeLockSentinel | undefined
    navigator.wakeLock
      ?.request('screen')
      .then((l) => (lock = l))
      .catch(() => {})
    return () => {
      lock?.release().catch(() => {})
    }
  }, [ticking])

  const run = (ms: number) => {
    try {
      audio.current ??= new AudioContext()
    } catch {
      // без звука
    }
    endAt.current = Date.now() + ms
    setRemaining(ms)
    setRunning(true)
  }

  const pause = () => {
    setRunning(false)
    setRemaining(Math.max(0, endAt.current - Date.now()))
  }

  const reset = () => {
    setRunning(false)
    setPhase('fight')
    setPeriod(1)
    setRemaining(fightMs)
  }

  const nextPeriod = () => {
    setRunning(false)
    setPhase('fight')
    setPeriod((p) => p + 1)
    setRemaining(fightMs)
  }

  const expired = remaining === 0
  const label = phase === 'break' ? L.breakLabel : periods > 1 ? L.period(period, periods) : L.timeOfBout

  let actions
  if ((expired || scoreBreak) && phase === 'fight' && period < periods) {
    actions = (
      <>
        <button
          className="secondary"
          onClick={() => {
            setPhase('break')
            run(breakSeconds * 1000)
          }}
        >
          {L.breakButton(format(breakSeconds * 1000))}
        </button>
        <button className="secondary" onClick={nextPeriod}>
          {L.periodButton(period + 1)}
        </button>
      </>
    )
  } else if (expired && phase === 'break') {
    actions = (
      <button className="secondary" onClick={nextPeriod}>
        {L.periodButton(period + 1)}
      </button>
    )
  } else {
    actions = (
      <>
        <button className="secondary" disabled={expired} onClick={() => (running ? pause() : run(remaining))}>
          {running ? L.pause : remaining === (phase === 'fight' ? fightMs : breakSeconds * 1000) ? L.start : L.resume}
        </button>
        <button className="secondary" onClick={reset}>
          {L.reset}
        </button>
      </>
    )
  }

  return (
    <div className={`timer ${expired ? 'expired' : ''} ${phase === 'break' ? 'break' : ''}`}>
      <div className="timer-label">{scoreBreak ? L.breakAt(breakAt!) : expired && phase === 'fight' ? L.timeUp : label}</div>
      <div className="timer-value">{format(remaining)}</div>
      <div className="timer-actions">{actions}</div>
    </div>
  )
}
