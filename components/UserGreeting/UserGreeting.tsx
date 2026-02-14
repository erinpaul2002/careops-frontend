'use client';

import React from 'react';
import { useUserGreeting } from './useUserGreeting';
import UserGreetingUI from './UserGreetingUI';

const UserGreeting: React.FC = () => {
  const { user, loading, error, updateUser } = useUserGreeting();

  return (
    <UserGreetingUI
      user={user}
      loading={loading}
      error={error}
      onUpdateUser={updateUser}
    />
  );
};

export default UserGreeting;