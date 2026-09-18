import { BrowserRouter, Route, Routes } from 'react-router-dom';
import PublicApp from './PublicApp';
import { AdminApp } from './components/Admin/AdminApp';

export default function AppRouter() {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<PublicApp />} />
      <Route path="/admin" element={<AdminApp />} />
      <Route path="*" element={<PublicApp />} />
    </Routes>
  </BrowserRouter>;
}
