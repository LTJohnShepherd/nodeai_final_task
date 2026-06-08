const MAX_HISTORY = 20;
const MAX_USERS = 20;
const userHistories = new Map();

exports.getHistory = (userId) => {
  if (!userId) return [];
  return userHistories.get(userId) || [];
};

exports.saveHistory = (entry, userId) => {
  if (!userId || !entry) return [];
  const history = exports.getHistory(userId);
  history.push(entry);
  while (history.length > MAX_HISTORY) {
    history.shift();
  }
  userHistories.set(userId, history);
  if (userHistories.size > MAX_USERS) {
    const firstKey = userHistories.keys().next().value;
    userHistories.delete(firstKey);
  }
  return history;
};
