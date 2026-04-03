const sessionState = {
  user: null,
  currentCat: 'all',
};

export function getUser() {
  return sessionState.user;
}

export function setUserState(user) {
  sessionState.user = user;
}

export function clearUserState() {
  sessionState.user = null;
}

export function getCurrentCat() {
  return sessionState.currentCat;
}

export function setCurrentCat(cat) {
  sessionState.currentCat = cat;
}
