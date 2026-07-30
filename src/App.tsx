import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './routes/index';
import Dashboard from './routes/dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;