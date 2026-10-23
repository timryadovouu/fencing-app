import { useEffect, useState } from 'react'
import { Home } from './screens/Home'
import { TournamentScreen, type Tab } from './screens/TournamentScreen'

function useHash(): string {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const onChange = () => setHash(location.hash)
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const [, route, id, tab] = useHash().split('/')
  if (route === 't' && id) return <TournamentScreen key={id} id={id} tab={tab as Tab | undefined} />
  return <Home />
}
