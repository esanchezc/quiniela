import { supabase } from './supabase'

const API_BASE = '/api-fifa'

// Defines a mapping for team names that differ between our DB and the API
const TEAM_NAME_MAP: Record<string, string> = {
  'United States': 'USA', 'Korea Republic': 'South Korea', 'Republic of Korea': 'South Korea',
  'Turkey': 'Türkiye', 'Türkiye': 'Türkiye', 'Congo DR': 'DR Congo', 'DR Congo': 'DR Congo',
  'Bosnia-Herzegovina': 'Bosnia and Herzegovina',
  'Ivory Coast': "Côte d'Ivoire",
  'Cape Verde Islands': 'Cabo Verde',
  'Czech Republic': 'Czechia'
}

// Normalizes an API team name to match our database conventions
const normalizeName = (name: string | null): string => {
  if (!name) return ''
  const clean = name.trim()
  return TEAM_NAME_MAP[clean] || clean
}

// Fetches data from the API with a retry mechanism for transient network errors
async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  try {
    const response = await fetch(url)
    if (response.status === 429) throw new Error('API rate limit hit.')
    if (!response.ok) {
      if (retries > 0 && [500, 502, 503, 504].includes(response.status)) {
        await new Promise(res => setTimeout(res, 2500))
        return fetchWithRetry(url, retries - 1)
      }
      throw new Error(`API Error: ${response.statusText} (${response.status})`)
    }
    return response.json()
  } catch (err: any) {
    if (retries > 0) {
      await new Promise(res => setTimeout(res, 2500))
      return fetchWithRetry(url, retries - 1)
    }
    throw err
  }
}

/**
 * The master function to sync all tournament data from the FIFA API to our Supabase DB.
 * It is designed to be idempotent and safe to run multiple times.
 */
export const syncTournamentData = async () => {
  console.log("SYNC: Starting FIFA Data Sync...")
  try {
    // 1. Fetch our local team roster to map API teams to our internal IDs
    const { data: localTeams, error: dbError } = await supabase.from('teams').select('id, name')
    if (dbError || !localTeams) throw new Error("Fatal: Could not fetch local teams from Supabase.")

    const localTeamMap = new Map<string, number>()
    localTeams.forEach(t => {
      localTeamMap.set(normalizeName(t.name).toLowerCase(), t.id)
    })
    const findLocalTeamId = (apiName: string | null) => localTeamMap.get(normalizeName(apiName).toLowerCase())

    // 2. Fetch the latest standings and full match schedule from the API
    const [standingsData, matchesData] = await Promise.all([
      fetchWithRetry(`${API_BASE}/competitions/WC/standings`),
      fetchWithRetry(`${API_BASE}/competitions/WC/matches`)
    ])

    // 3. Determine which 3rd place teams actually advanced to the Round of 32
    const advancingTeamApiIds = new Set<number>()
    if (matchesData.matches) {
      matchesData.matches
        .filter((m: any) => m.stage === 'LAST_32' && m.homeTeam.id && m.awayTeam.id)
        .forEach((m: any) => {
          advancingTeamApiIds.add(m.homeTeam.id)
          advancingTeamApiIds.add(m.awayTeam.id)
        })
    }

    // 4. Process Group Stage results and assign accomplishments
    if (standingsData.standings) {
      for (const group of standingsData.standings) {
        if (group.type !== 'TOTAL' || !group.table) continue
        for (const entry of group.table) {
          const teamId = findLocalTeamId(entry.team.name)
          if (teamId && entry.playedGames > 0) {
            let accomplishment: string | null = null
            if (entry.position === 1) accomplishment = 'group_1st'
            else if (entry.position === 2) accomplishment = 'group_2nd'
            else if (entry.position === 3) {
              accomplishment = advancingTeamApiIds.has(entry.team.id) ? 'group_3rd_adv' : 'not_advancing_3rd'
            } else if (entry.position === 4) accomplishment = 'not_advancing_4th'

            if (accomplishment) {
              await supabase.rpc('add_accomplishment', { team_id: teamId, new_accomplishment: accomplishment })
            }
          }
        }
      }
    }

    // 5. Process Knockout Stage results and assign accomplishments
    if (matchesData.matches) {
      const knockoutStages = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL']
      for (const stage of knockoutStages) {
        const stageMatches = matchesData.matches.filter((m: any) => m.stage === stage && m.status === 'FINISHED')
        for (const m of stageMatches) {
          let winnerId: number | undefined
          let winnerName: string | undefined

          if (m.score.winner === 'HOME_TEAM') {
            winnerName = m.homeTeam.name
          } else if (m.score.winner === 'AWAY_TEAM') {
            winnerName = m.awayTeam.name
          }

          if (winnerName) {
            winnerId = findLocalTeamId(winnerName)
            if (winnerId) {
                const accomplishment = `${stage.toLowerCase()}_win`
                await supabase.rpc('add_accomplishment', { team_id: winnerId, new_accomplishment: accomplishment })
            }
          }
        }
      }
    }

    await supabase.from('draft_state').update({ last_api_sync: new Date().toISOString() }).eq('id', 1)
    console.log("SYNC: Finished successfully.")
    return { success: true }
  } catch (err: any) {
    console.error('SYNC: A fatal error occurred:', err.message)
    return { error: err.message }
  }
}
