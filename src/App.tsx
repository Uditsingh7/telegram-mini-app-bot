import UserDashboard from './UserDashboard'
import { TelegramProvider } from './WithTelegramProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import the CSS for toast notifications

function App() {

  return (
    <>
      <ToastContainer />
      <TelegramProvider>
        <UserDashboard />
      </TelegramProvider>
    </>
  )
}

export default App
