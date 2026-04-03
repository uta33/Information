import { BrowserRouter, Route, Routes } from "react-router-dom";
import Shell from "./components/layout/Shell";
import DashboardPage from "./pages/DashboardPage";
import InboxPage from "./pages/InboxPage";
import SavedPage from "./pages/SavedPage";
import SettingsPage from "./pages/SettingsPage";
import DetailPage from "./pages/DetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<DashboardPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/notification/:id" element={<DetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
