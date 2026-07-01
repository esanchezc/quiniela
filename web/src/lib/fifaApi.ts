import { supabase } from './supabase'

const API_BASE = '/api-fifa'

const TEAM_NAME_MAP: Record<string, string> = {
  'United States': 'USA', 'Korea Republic': 'South Korea', 'Republic of Korea': 'South Korea',
  'Turkey': 'Türkiye', 'Türkiye': 'Türkiye', 'Congo DR': 'DR Congo', 'DR Congo': 'DR Congo',
  'Bosnia-Herzegovina': 'Bosnia and Herzegovina', 'Bosnia and Herzegovina': 'Bosnia and Herzegovina',
  'Ivory Coast': "Côte d'Ivoire", "Côte d'Ivoire": "Côte d'Ivoire", 'Cape Verde Islands': 'Cabo Verde',
  'Cabo Verde': 'Cabo Verde', 'Czech Republic': 'Czechia', 'Czechia': 'Czechia'
}

const normalizeName = (name: string | null) => {
  if (!name) return ''
  const clean = name.trim()
  return TEAM_NAME_MAP[clean] || clean
}

async function fetchWithRetry(url: string, retries = 2): Promise<any> {
  try {
    const response = await fetch(url)
    if (response.status === 429) throw new Error('API limit hit.')
    if (!response.ok) {
        if (retries > 0 && [500, 502, 503, 504].includes(response.status)) {
            await new Promise(res => setTimeout(res, 2000)); return fetchWithRetry(url, retries - 1)
        }
        throw new Error(`API Error: ${response.status}`)
    }
    return response.json()
  } catch (err: any) {
    if (retries > 0) {
        await new Promise(res => setTimeout(res, 2000)); return fetchWithRetry(url, retries - 1)
    }
    throw err
  }
}

export const syncTournamentData = async () => {
  try {
    const { data: localTeams } = await supabase.from('teams').select('id, name')
    if (!localTeams) throw new Error("Could not fetch local teams")

    const findLocalTeamId = (apiName: string | null) => localTeams.find(t => t.name.toLowerCase() === normalizeName(apiName).toLowerCase())?.id

    const [standingsData, matchesData] = await Promise.all([
      fetchWithRetry(`${API_BASE}/competitions/WC/standings`),
      fetchWithRetry(`${API_BASE}/competitions/WC/matches`)
    ])

    const today = new Date().toDateString()

    // 1. Get List of all teams advancing to Round of 32 from API data
    const advancingTeamApiIds = new Set<number>()
    if (matchesData.matches) {
        const r32matches = matchesData.matches.filter((m: any) => m.stage === 'ROUND_OF_32');
        for (const m of r32matches) {
            if (m.homeTeam.id) advancingTeamApiIds.add(m.homeTeam.id)
            if (m.awayTeam.id) advancingTeamApiIds.add(m.awayTeam.id)
        }
    }
    
    // 2. Update Team Status from Standings
    if (standingsData.standings) {
        for (const group of standingsData.standings) {
            if (group.type !== 'TOTAL') continue
            for (const entry of group.table) {
                const teamId = findLocalTeamId(entry.team.name)
                // Only update if they've played
                if (teamId && entry.playedGames > 0) {
                    let status = 'active'
                    if (entry.position === 1) status = 'group_1st'
                    else if (entry.position === 2) status = 'group_2nd'
                    else if (entry.position === 3) {
                        // The critical fix: check against the actual R32 teams
                        status = advancingTeamApiIds.has(entry.team.id) ? 'group_3rd_adv' : 'not_advancing_3rd'
                    }
                    else if (entry.position === 4) status = 'not_advancing_4th'
                    await supabase.from('teams').update({ status }).eq('id', teamId)
                }
            }
        }
    }

    // 3. Update Match Table for Today/Live
    if (matchesData.matches) {
      const activeMatches = matchesData.matches.filter((m: any) => new Date(m.utcDate).toDateString() === today || ['IN_PLAY', 'PAUSED'].includes(m.status))
      for (const m of activeMatches) {
        const teamAId = findLocalTeamId(m.homeTeam.name)
        const teamBId = findLocalTeamId(m.awayTeam.name)
        if (teamAId && teamBId) {
          await supabase.from('matches')
            .update({
              score_a: m.score.fullTime.home ?? 0,
              score_b: m.score.fullTime.away ?? 0,
              status: m.status.toLowerCase() === 'finished' ? 'finished' : (m.status === 'IN_PLAY' || m.status === 'PAUSED') ? 'live' : 'scheduled'
            })
            .eq('team_a_id', teamAId).eq('team_b_id', teamBId)
        }
      }
    }

    await supabase.from('draft_state').update({ last_api_sync: new Date().toISOString() }).eq('id', 1)
    return { success: true }
  } catch (err: any) {
    console.error('FIFA Sync Error:', err.message)
    return { error: err.message }
  }
}
