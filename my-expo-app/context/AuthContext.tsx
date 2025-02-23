import React, { createContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: { email: string; isSeller: boolean } | null;
  login: (email: string, password: string, isSeller: boolean) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<{ email: string; isSeller: boolean } | null>(null);

  const login = async (email: string, password: string, isSeller: boolean) => {
    setUser({ email, isSeller });
  };

  const logout = () => {
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};
