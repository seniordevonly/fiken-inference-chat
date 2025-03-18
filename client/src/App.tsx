import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Chat from './pages/Chat';
import Layout from './components/Layout';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Chat />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App; 