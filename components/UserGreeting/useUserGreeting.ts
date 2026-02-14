'use client';

import { useState, useEffect } from 'react';

// Mock user data - in real app, this would come from API
interface User {
  name: string;
  email: string;
}

export const useUserGreeting = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchUser = async () => {
      try {
        setLoading(true);
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Mock user data
        setUser({ name: 'John Doe', email: 'john@example.com' });
      } catch {
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const updateUser = (newUser: User) => {
    setUser(newUser);
  };

  return {
    user,
    loading,
    error,
    updateUser,
  };
};
