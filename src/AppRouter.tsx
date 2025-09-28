import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SimpleApp from './SimpleApp';
import { AdminLogin } from './components/Admin/AdminLogin';
import { AdminApp } from './components/Admin/AdminApp';

function AdminRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AdminLogin onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return <AdminApp />;
}

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SimpleApp />} />
        <Route path="/admin" element={<AdminRoute />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;