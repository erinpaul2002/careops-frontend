import React from 'react';

interface User {
  name: string;
  email: string;
}

interface UserGreetingUIProps {
  user: User | null;
  loading: boolean;
  error: string | null;
  onUpdateUser: (user: User) => void;
}

const UserGreetingUI: React.FC<UserGreetingUIProps> = ({
  user,
  loading,
  error,
  onUpdateUser,
}) => {
  if (loading) {
    return <div className="text-center p-4" style={{ color: "#5A6A7A" }}>Loading user...</div>;
  }

  if (error) {
    return <div className="text-center p-4" style={{ color: "#EF4444" }}>{error}</div>;
  }

  if (!user) {
    return <div className="text-center p-4" style={{ color: "#5A6A7A" }}>No user found</div>;
  }

  return (
    <div className="panel p-4">
      <h2 className="text-xl font-semibold mb-2" style={{ color: "#1A1A1A" }}>Welcome, {user.name}!</h2>
      <p className="mb-4 text-sm" style={{ color: "#5A6A7A" }}>Email: {user.email}</p>
      <button
        onClick={() => onUpdateUser({ name: 'Jane Doe', email: 'jane@example.com' })}
        className="px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200"
        style={{ background: "#00AA6C", color: "#ffffff" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#009960"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#00AA6C"; }}
      >
        Switch User
      </button>
    </div>
  );
};

export default UserGreetingUI;