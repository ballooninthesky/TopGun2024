// Import BrowserRouter, Route, and Switch from react-router-dom
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './componants/Dashboard';
import Login from './componants/Login';
import Register from './componants/Register';
import DataGrid from './componants/DataGrid';
import ControlRas from './componants/ControlRas';
import StatusPage from './componants/StatusPage';
import Sound from './componants/Sound';
import FileUpload  from './componants/upload';
import Code from './componants/Code';

function App() {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} /> {/* Login page */}
        <Route path="/dashboard" element={<Dashboard />} /> 
        <Route path="/register" element={<Register />} /> 
        <Route path="/datagrid" element={<DataGrid />} /> 
        <Route path="/controlRas" element={<ControlRas />} /> 
        <Route path="/statuspage" element={<StatusPage />} /> 
        <Route path="/sound" element={<Sound />} /> 
        <Route path="/upload" element={<FileUpload />} />
        <Route path="/code" element={<Code />} />
      </Routes>
    </Router>
  );
}

export default App;
