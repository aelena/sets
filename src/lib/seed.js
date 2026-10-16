/** Out-of-the-box groups, in the same shape as an importable config file. */
export const seedConfig = {
  format: 'exercise-tracker/config',
  version: 1,
  groups: [
    {
      name: 'Kettlebell Supergroup',
      exercises: [
        { name: 'Chest Thrusts', sets: 2, reps: 50, kg: 16 },
        { name: 'Round the Worlds', sets: 2, reps: 50, kg: 16 },
        { name: 'Halos', sets: 5, reps: 10, kg: 16 },
        { name: 'Lateral Swing', sets: 2, reps: 50, kg: 20 },
        { name: 'Forward Swing', sets: 2, reps: 50, kg: 20 },
        { name: 'Chest to Sky', sets: 3, reps: 15, kg: 16 },
        { name: 'Over the Shoulder', sets: 5, reps: 10, kg: 16 },
        { name: '3-phase supercurl', sets: 3, reps: 10, kg: 16 },
        { name: 'Overhead March', sets: 2, reps: 25, kg: 16 },
        { name: 'Overhand Row', sets: 2, reps: 25, kg: 16 },
        { name: 'Upright Row', sets: 2, reps: 25, kg: 16 },
        { name: 'Torso Twists', sets: 4, reps: 25, kg: 16 },
      ],
    },
    {
      name: 'My Warm up Routine',
      exercises: [
        { name: 'Arm superseries', sets: 3, reps: 5, kg: 10, desc: 'La superserie de curls, antebrazos y hombro.' },
        { name: 'Disc routine', sets: 2, reps: 1, kg: 10, desc: 'Superserie con disco a frente, lateral y halos: 1, 1, 1, 2, 2, 3.' },
      ],
    },
  ],
}
