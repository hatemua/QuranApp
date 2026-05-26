import type {MasteryState} from '@/types';

export const colors = {
  background: '#FAFAF9',
  surface: '#FFFFFF',
  primary: '#047857',
  primaryMuted: '#D1FAE5',
  accent: '#D97706',
  accentMuted: '#FEF3C7',
  text: '#1C1917',
  textMuted: '#78716C',
  textFaint: '#A8A29E',
  border: '#E7E5E4',
  borderStrong: '#D6D3D1',
  mastery: {
    mastered: '#047857',
    retained: '#10B981',
    understood: '#34D399',
    recognised: '#D97706',
    seen: '#44403C',
    unseen: '#A8A29E',
  },
} as const;

export function masteryColor(state: MasteryState): string {
  return colors.mastery[state];
}
