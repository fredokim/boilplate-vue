const accessTokenKey = "boilerplate.accessToken";
const refreshTokenKey = "boilerplate.refreshToken";

function getStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
}

export const tokenStorage = {
  getAccessToken() {
    return getStorage()?.getItem(accessTokenKey) ?? null;
  },

  getRefreshToken() {
    return getStorage()?.getItem(refreshTokenKey) ?? null;
  },

  setTokens(tokens: StoredTokens) {
    const storage = getStorage();

    if (!storage) {
      return;
    }

    storage.setItem(accessTokenKey, tokens.accessToken);

    if (tokens.refreshToken) {
      storage.setItem(refreshTokenKey, tokens.refreshToken);
    } else {
      storage.removeItem(refreshTokenKey);
    }
  },

  clear() {
    const storage = getStorage();

    storage?.removeItem(accessTokenKey);
    storage?.removeItem(refreshTokenKey);
  },
};
