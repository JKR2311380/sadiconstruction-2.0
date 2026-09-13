import { useState } from 'react';
import LandingPage from './LandingPage';
import LoginPage from './LoginPage';

function App() {
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return <LoginPage onNavigateBack={() => setShowLogin(false)} />;
  }

  return <LandingPage onNavigateToLogin={() => setShowLogin(true)} />;
}

export default App;