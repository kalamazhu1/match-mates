import { Select, SelectProps } from './Select'

// Tennis-specific select options
export const NTRP_LEVELS = [
  { value: '3.0', label: '3.0 - Beginner Plus' },
  { value: '3.5', label: '3.5 - Intermediate' },
  { value: '4.0', label: '4.0 - Advanced Intermediate' },
  { value: '4.5', label: '4.5 - Advanced' },
  { value: '5.0', label: '5.0 - Open' },
  { value: '5.5', label: '5.5 - Tournament' }
]

export const EVENT_TYPES = [
  { value: 'tournament', label: 'Tournament' },
  { value: 'league', label: 'League' },
  { value: 'social', label: 'Social Play' }
]

export const TOURNAMENT_FORMATS = [
  { value: 'single_elimination', label: 'Single Elimination' },
  { value: 'double_elimination', label: 'Double Elimination' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'league_play', label: 'League Play' },
  { value: 'social_play', label: 'Social Play' }
]

export const SF_LOCATIONS = [
  { value: 'golden_gate_park', label: 'Golden Gate Park Tennis Courts' },
  { value: 'presidio_tennis', label: 'Presidio Tennis Club' },
  { value: 'dolores_park', label: 'Dolores Park Tennis Courts' },
  { value: 'alice_marble', label: 'Alice Marble Tennis Courts' },
  { value: 'balboa_tennis', label: 'Balboa Tennis Complex' },
  { value: 'buena_vista', label: 'Buena Vista Tennis Courts' },
  { value: 'hamilton_rec', label: 'Hamilton Recreation Center' },
  { value: 'jackson_playground', label: 'Jackson Playground Courts' },
  { value: 'mission_dolores', label: 'Mission Dolores Tennis Courts' },
  { value: 'glen_canyon', label: 'Glen Canyon Tennis Courts' },
  { value: 'other', label: 'Other Location' }
]

interface MatchMatesSelectProps extends Omit<SelectProps, 'options'> {
  type: 'ntrp' | 'eventType' | 'format' | 'location'
}

export function MatchMatesSelect({ type, ...props }: MatchMatesSelectProps) {
  const optionsMap = {
    ntrp: NTRP_LEVELS,
    eventType: EVENT_TYPES,
    format: TOURNAMENT_FORMATS,
    location: SF_LOCATIONS
  }

  return <Select options={optionsMap[type]} {...props} />
}