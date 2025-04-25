
import AuthForm from '@/components/auth/AuthForm';

const LoginPage = () => {
  // Check if user is already logged in
  const navigate = useNavigate();
  
  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) {
      navigate('/chat');
    }
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  );
};

export default LoginPage;
