export const TOKEN_KEY = 'lumiere_token';

function read(storage, key) {
  try {
    return storage?.getItem(key) || null;
  } catch {
    return null;
  }
}

function write(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Ignore unavailable storage, for example private mode quota errors.
  }
}

function remove(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Ignore unavailable storage.
  }
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return read(window.localStorage, TOKEN_KEY) || read(window.sessionStorage, TOKEN_KEY);
}

export function saveToken(token, rememberMe = false) {
  if (typeof window === 'undefined' || !token) return;
  if (rememberMe) {
    write(window.localStorage, TOKEN_KEY, token);
    remove(window.sessionStorage, TOKEN_KEY);
    return;
  }
  write(window.sessionStorage, TOKEN_KEY, token);
  remove(window.localStorage, TOKEN_KEY);
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return;
  remove(window.localStorage, TOKEN_KEY);
  remove(window.sessionStorage, TOKEN_KEY);
}
