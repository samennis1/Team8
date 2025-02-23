import React, { createContext, useState, ReactNode } from 'react';

type User = { email: string };

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  handleLogin: (email: string, password: string) => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  handleLogin: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (email: string, password: string) => {
    if (!email || !password) {
      console.log('Missing credentials');
      return;
    }
    login(email, password);
  };

  // Actual login function
  const login = (email: string, password: string) => {
    console.log('Logged in with', email);
    setUser({ email });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, handleLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
