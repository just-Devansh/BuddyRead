import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeProvider'
import { DeviceFrame } from './components/DeviceFrame'
import { Welcome } from './pages/Welcome'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'

/**
 * App root: theme + the mobile/iPad device frame + routing. Auth-gated routes
 * arrive in M1; for now every route is public so the skeleton walks end to end.
 */
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <DeviceFrame>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/home" element={<Home />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DeviceFrame>
      </BrowserRouter>
    </ThemeProvider>
  )
}
