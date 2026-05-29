import type { Interest, Mood } from '@walking-app/shared';

export const defaultStart = {
  id: 'default-mile-end',
  label: 'Mile End',
  coordinate: { lat: 45.5234, lng: -73.5996 },
};

export const goalPresets = [
  {
    id: 'thirty',
    label: '30 min',
    title: 'After-work 30',
    stepGoal: 3200,
    timeGoalMinutes: 30,
    mood: 'calm' as Mood,
    interests: ['parks', 'cafes'] as Interest[],
  },
  {
    id: 'hour',
    label: '1 hour',
    title: 'One-hour discovery',
    stepGoal: 6500,
    timeGoalMinutes: 60,
    mood: 'scenic' as Mood,
    interests: ['architecture', 'viewpoints', 'cafes'] as Interest[],
  },
  {
    id: 'steps',
    label: '10k steps',
    title: 'Big loop',
    stepGoal: 10000,
    timeGoalMinutes: 92,
    mood: 'energetic' as Mood,
    interests: ['waterfront', 'parks', 'transit'] as Interest[],
  },
  {
    id: 'easy',
    label: 'Easy loop',
    title: 'Low-effort nearby',
    stepGoal: 3000,
    timeGoalMinutes: 28,
    mood: 'green' as Mood,
    interests: ['parks', 'public-toilets', 'transit'] as Interest[],
  },
];

export type GoalPreset = typeof goalPresets[number];
