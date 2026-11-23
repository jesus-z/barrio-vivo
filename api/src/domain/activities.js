export const CATEGORIES = ['Reciclaje', 'Huerto', 'Movilidad', 'Limpieza', 'Educación'];

export function normalizeActivity(input) {
  return { title: input.title.trim(), description: input.description.trim(), category: input.category, points: input.points ?? pointsForCategory(input.category), author: input.author.trim() };
}

export function pointsForCategory(category) {
  return ({ Reciclaje: 15, Huerto: 20, Movilidad: 10, Limpieza: 25, Educación: 15 })[category] ?? 10;
}

export function summarizeActivities(activities) {
  return activities.reduce((summary, activity) => {
    summary.points += activity.points;
    summary.count += 1;
    summary.categories[activity.category] = (summary.categories[activity.category] ?? 0) + 1;
    return summary;
  }, { points: 0, count: 0, categories: {} });
}
