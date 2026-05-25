import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Trophy, RefreshCcw, LogOut, LayoutDashboard, Calendar } from 'lucide-react'
import { DraftView } from './views/DraftView'
import { RulesView } from './views/RulesView'
import { LeaderboardView } from './views/LeaderboardView'
import { Navigation } from './components/Navigation'

interface Player {
  id: string
  name: string
  draft_order: number
  secret_token: string
}

function App() {
  const [player, setPlayer] = useState<Player | null>(null)
  const [activeTab, setActiveTab] = useState('draft')
  const [loading, setLoading] = useState(true)
  const [draftState, setDraftState] = useState<{is_started: boolean, is_finished: boolean}>({
    is_started: false,
    is_finished: false
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')

    const init = async () => {
      try {
        if (token) {
          const { data } = await supabase.from('players').select('*').eq('secret_token', token).single()
          if (data) setPlayer(data)
        }
        
        const { data: stateData } = await supabase.from('draft_state').select('is_started, is_finished').single()
        if (stateData) {
            setDraftState(stateData)
            if (stateData.is_finished) {
              setActiveTab('leaderboard')
            } else {
              setActiveTab('draft')
            }
        }
      } finally {
        setLoading(false)
      }
    }

    init()

    const channel = supabase.channel('app-shell-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_state' }, (payload: any) => {
        if (payload.new) {
            setDraftState({
                is_started: payload.new.is_started,
                is_finished: payload.new.is_finished
            })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true'

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-blue-500">
      <RefreshCcw className="w-12 h-12 animate-spin mb-4" />
      <p className="font-black tracking-widest animate-pulse uppercase text-xs">Entering Stadium...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-32 text-white">
      {/* GLOBAL HEADER */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Trophy className="text-blue-500 w-8 h-8 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <h1 className="text-xl font-black tracking-tighter uppercase text-white">Quiniela <span className="text-blue-500">2026</span></h1>
          </div>

          <div className="flex items-center gap-4">
            {player ? (
              <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 shadow-inner text-white">
                <span className="font-bold text-sm text-white">{player.name}</span>
                <button onClick={() => window.location.href = window.location.pathname} className="text-slate-500 hover:text-white transition-colors">
                  <LogOut className="w-4 h-4"/>
                </button>
              </div>
            ) : (
              <span className="text-amber-500 text-[10px] font-black tracking-widest uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">Read-Only</span>
            )}
          </div>
        </div>
      </nav>

      {/* VIEW CONTENT */}
      <div className="animate-in fade-in duration-500 text-white">
        {activeTab === 'leaderboard' && <LeaderboardView />}
        {activeTab === 'draft' && <DraftView player={player} isAdmin={isAdmin} />}
        {activeTab === 'rules' && <RulesView player={player} isAdmin={isAdmin} />}
        
        {activeTab === 'matches' && (
          <div className="max-w-4xl mx-auto p-12 text-center space-y-6 text-white">
            <Calendar className="w-16 h-16 text-slate-700 mx-auto" />
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Match Center</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">The World Cup 2026 schedule is arriving soon.</p>
          </div>
        )}
      </div>

      {/* NAVIGATION */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        showDraft={true} 
      />
    </div>
  )
}

export default App
