// service.add.groupmembers.ts
// Service for adding members to a group or searching users

export const findUsers = async (searchQuery: string): Promise<boolean> => {
  console.log('Searching users with query:', searchQuery)
  // Здесь будет реализация вызова API для поиска пользователей по строке
  // Например: await api.post(`/users/search`, { query: searchQuery })
  return true // Возвращаем успешный результат для примера
}

export default findUsers