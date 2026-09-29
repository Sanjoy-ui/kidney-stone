"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export interface UserProfile {
  userId: string;
  email: string;
  username: string;
  photo_url?: string | null;
  agreedToTerms?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    user: UserProfile,
    accessToken?: string | null,
    refreshToken?: string | null
  ) => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5876";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from localStorage and verify with backend on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("nephro_user");
        const storedAccessToken = localStorage.getItem("nephro_access_token");
        const storedRefreshToken = localStorage.getItem("nephro_refresh_token");

        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (_) {}
        }
        if (storedAccessToken) {
          setAccessToken(storedAccessToken);
        }
        if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken);
        }

        // Validate session with server (with cookies and stored bearer token)
        const headers: Record<string, string> = {};
        if (storedAccessToken) {
          headers["Authorization"] = `Bearer ${storedAccessToken}`;
        }

        const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
          method: "GET",
          headers,
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("nephro_user", JSON.stringify(data.user));
          }
        } else if (storedRefreshToken || res.status === 401) {
          // Attempt refreshing the access token if expired
          const refreshRes = await fetch(`${BACKEND_URL}/api/v1/auth/refresh-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(storedRefreshToken
                ? { "x-refresh-token": storedRefreshToken }
                : {}),
            },
            credentials: "include",
            body: JSON.stringify({
              refreshToken: storedRefreshToken || undefined,
            }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccess = refreshData.data?.accessToken;
            const newRefresh = refreshData.data?.refreshToken;
            const userData = refreshData.data?.user;

            if (newAccess) {
              setAccessToken(newAccess);
              localStorage.setItem("nephro_access_token", newAccess);
            }
            if (newRefresh) {
              setRefreshToken(newRefresh);
              localStorage.setItem("nephro_refresh_token", newRefresh);
            }
            if (userData) {
              setUser(userData);
              localStorage.setItem("nephro_user", JSON.stringify(userData));
            }
          } else {
            // Both access and refresh tokens are invalid
            localStorage.removeItem("nephro_user");
            localStorage.removeItem("nephro_access_token");
            localStorage.removeItem("nephro_refresh_token");
            setUser(null);
            setAccessToken(null);
            setRefreshToken(null);
          }
        }
      } catch (err) {
        console.warn("Auth initialization notice:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(
    (
      userData: UserProfile,
      newAccessToken?: string | null,
      newRefreshToken?: string | null
    ) => {
      setUser(userData);
      localStorage.setItem("nephro_user", JSON.stringify(userData));

      if (newAccessToken) {
        setAccessToken(newAccessToken);
        localStorage.setItem("nephro_access_token", newAccessToken);
      }
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
        localStorage.setItem("nephro_refresh_token", newRefreshToken);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    } catch (_) {}

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("nephro_user");
    localStorage.removeItem("nephro_access_token");
    localStorage.removeItem("nephro_refresh_token");
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const currentRefresh =
        refreshToken || localStorage.getItem("nephro_refresh_token");

      const res = await fetch(`${BACKEND_URL}/api/v1/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentRefresh ? { "x-refresh-token": currentRefresh } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          refreshToken: currentRefresh || undefined,
        }),
      });

      if (!res.ok) {
        await logout();
        return null;
      }

      const data = await res.json();
      const newAccess = data.data?.accessToken;
      const newRefresh = data.data?.refreshToken;
      const userData = data.data?.user;

      if (newAccess) {
        setAccessToken(newAccess);
        localStorage.setItem("nephro_access_token", newAccess);
      }
      if (newRefresh) {
        setRefreshToken(newRefresh);
        localStorage.setItem("nephro_refresh_token", newRefresh);
      }
      if (userData) {
        setUser(userData);
        localStorage.setItem("nephro_user", JSON.stringify(userData));
      }

      return newAccess || null;
    } catch (err) {
      console.error("Token refresh error:", err);
      await logout();
      return null;
    }
  }, [refreshToken, logout]);

  /**
   * Authenticated fetch helper with automatic access token injection
   * and automatic token refresh + replay on token expiry (401)
   */
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const activeToken =
        accessToken || localStorage.getItem("nephro_access_token");

      const headers = new Headers(options.headers || {});
      if (activeToken) {
        headers.set("Authorization", `Bearer ${activeToken}`);
      }

      // Initial request with credentials (HTTP-only cookies) + Bearer header
      let response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      // Check if access token expired
      if (response.status === 401) {
        let isExpired = false;
        try {
          const clone = response.clone();
          const body = await clone.json();
          if (
            body?.code === "TOKEN_EXPIRED" ||
            body?.message?.includes("expired") ||
            body?.message?.includes("Authentication required")
          ) {
            isExpired = true;
          }
        } catch (_) {
          isExpired = true;
        }

        if (isExpired) {
          // Attempt to renew access token with refresh token
          const newToken = await refreshAccessToken();
          if (newToken) {
            headers.set("Authorization", `Bearer ${newToken}`);
            // Replay original request with updated access token
            response = await fetch(url, {
              ...options,
              headers,
              credentials: "include",
            });
          }
        }
      }

      return response;
    },
    [accessToken, refreshAccessToken]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshAccessToken,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
