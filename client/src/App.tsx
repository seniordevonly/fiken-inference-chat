import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import Chat from './pages/Chat';
import Login from './pages/Login';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <Chat />
          </RequireAuth>
        ),
      },
      {
        path: 'login',
        element: <Login />,
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
