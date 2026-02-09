const AI_NAMES = [
  'Aiko', 'Ravi', 'Lina', 'Mateo', 'Zara', 'Hana', 'Omar', 'Sofia', 'Diego', 'Mira',
  'Anya', 'Kaito', 'Noor', 'Ishan', 'Nadia', 'Luca', 'Sana', 'Kiran', 'Elena', 'Jiro',
  'Amir', 'Priya', 'Niko', 'Aya', 'Yara', 'Tariq', 'Mei', 'Levi', 'Ines', 'Rhea',
  'Laila', 'Hugo', 'Zuri', 'Kenji', 'Asha', 'Eli', 'Fatima', 'Jonas', 'Lucia', 'Soren',
  'Amina', 'Kai', 'Nina', 'Arjun', 'Selene', 'Dara', 'Ryo', 'Adel', 'Suri', 'Milo',
  'Samira', 'Ilya', 'Talia', 'Ronan', 'Yuki', 'Amara', 'Zane', 'Eira', 'Rafi', 'Nora',
  'Maia', 'Pavel', 'Lea', 'Tenzin', 'Anouk', 'Imani', 'Sven', 'Rumi', 'Hadi', 'Nikoleta',
  'Bao', 'Farah', 'Tomas', 'Zehra', 'Ewan', 'Kei', 'Rina', 'Oriana', 'Yusuf', 'Alina',
  'Koa', 'Esme', 'Taliah', 'Bela', 'Kavya', 'Dmitri', 'Ari', 'Sacha', 'Siti', 'Emir',
  'Liora', 'Niklas', 'Isla', 'Olek', 'Jade', 'Rania', 'Vera', 'Bastien', 'Hye', 'Teo'
];

export function getRandomAiNames(count: number): string[] {
  const pool = [...AI_NAMES];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
