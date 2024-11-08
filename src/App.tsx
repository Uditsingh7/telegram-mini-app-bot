import UserDashboard from './UserDashboard'
import { TelegramProvider } from './WithTelegramProvider';

function App() {

  return (
    <>
      <TelegramProvider>
        <UserDashboard />
      </TelegramProvider>
    </>
  )
}

export default App
