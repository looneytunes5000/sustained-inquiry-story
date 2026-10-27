import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SessionProvider } from "./session";
import AppShell from "./components/AppShell";
import { Phase2Card } from "./components/Phase2Card";
import Landing from "./sections/Landing";
import Video from "./sections/Video";
import Cycle from "./sections/Cycle";
import Quiz from "./sections/Quiz";
import Module from "./sections/Module";
import Done from "./sections/Done";
import Story, { useAppStoryShell } from "./sections/Story";
import Admin from "./admin/Admin";

/** Route wrapper: binds the shared Story screen to the app's session. */
function StoryRoute() {
  return <Story shell={useAppStoryShell()} />;
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/story" element={<StoryRoute />} />
          <Route element={<AppShell />}>
            <Route path="/section/1" element={<Video />} />
            <Route path="/section/2" element={<Cycle />} />
            <Route path="/section/3" element={<Phase2Card id={3} />} />
            <Route path="/section/4" element={<Quiz />} />
            <Route path="/section/5" element={<Phase2Card id={5} />} />
            <Route path="/section/6" element={<Module />} />
            <Route path="/done" element={<Done />} />
          </Route>
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}
