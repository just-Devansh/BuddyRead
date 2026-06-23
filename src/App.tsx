import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { ThemeProvider } from './theme/ThemeProvider'
import { ThemeSync } from './theme/ThemeSync'
import { DeviceFrame } from './components/DeviceFrame'
import { Welcome } from './pages/Welcome'
import { Home } from './pages/Home'
import { Search } from './pages/Search'
import { BookDetail } from './pages/Book'
import { CoRead } from './pages/CoRead'
import { InviteRead } from './pages/InviteRead'
import { Friends } from './pages/Friends'
import { Activity } from './pages/Activity'
import { History } from './pages/History'
import { Profile } from './pages/Profile'
import { NotFound } from './pages/NotFound'

/**
 * App root: auth + theme + the mobile/iPad device frame + routing. `/home` and
 * `/profile` sit behind RequireAuth; `/` is the public landing. ThemeSync keeps
 * the per-device theme and the account theme in step.
 */
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ThemeSync />
        <BrowserRouter>
          <DeviceFrame>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route element={<RequireAuth />}>
                <Route path="/home" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/book/:id" element={<BookDetail />} />
                <Route path="/start/:id" element={<InviteRead />} />
                <Route path="/read" element={<CoRead />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/finished" element={<History />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DeviceFrame>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}
