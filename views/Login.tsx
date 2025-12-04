import React, { useState } from 'react';
import { ViewState } from '../types';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginProps {
  onLogin: (email: string) => void;
  changeView: (view: ViewState) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, changeView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Real Firebase authentication
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setLoading(false);
        const user = userCredential.user;
        // Pass user email (or uid) back to app
        onLogin(user.email ?? email);
      })
      .catch((error) => {
        setLoading(false);
        // Basic error handling — improve as needed
        const message = error?.message || 'Erro ao autenticar';
        alert(message);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-br from-brand-blue to-[#2a3d66] skew-y-[-4deg] origin-top-left z-0 transform -translate-y-20 shadow-2xl"></div>
      
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-brand-red opacity-10 rounded-full blur-2xl z-0"></div>
      <div className="absolute top-20 right-20 w-48 h-48 bg-brand-yellow opacity-10 rounded-full blur-3xl z-0"></div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 md:p-10 relative z-10 mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white p-4 rounded-2xl mb-6 shadow-lg shadow-blue-900/10 ring-1 ring-gray-100">
             <ShieldCheck className="text-brand-blue" size={48} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Prevencar</h1>
          <h2 className="text-sm font-bold text-brand-red uppercase tracking-[0.2em] mt-1">Vistorias</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="E-mail Corporativo" 
            type="email" 
            placeholder="nome@prevencar.com.br" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-50 focus:bg-white h-12"
            required
          />
          <div className="space-y-1">
             <Input 
                label="Senha de Acesso" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 focus:bg-white h-12"
                required
            />
            <div className="text-right">
                <button 
                    type="button"
                    onClick={() => changeView(ViewState.FORGOT_PASSWORD)}
                    className="text-xs text-gray-500 hover:text-brand-blue hover:underline font-medium transition-colors mt-1"
                >
                    Esqueceu a senha?
                </button>
            </div>
          </div>
          
          <Button type="submit" className="w-full h-14 text-lg font-bold shadow-lg shadow-red-200 mt-4 rounded-xl">
             {loading ? 'Entrando...' : 'Acessar Sistema'}
          </Button>

          <div className="text-xs text-center text-gray-400 mt-4 bg-gray-50 p-2 rounded">
             <p>Simulação de perfis:</p>
             <p>admin@... (Administrador)</p>
             <p>financeiro@... (Financeiro)</p>
             <p>qualquer@... (Vistoriador)</p>
          </div>
        </form>

        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 leading-relaxed">
                Ao entrar, você concorda com os termos de uso<br/> e política de privacidade da Prevencar.
            </p>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-center w-full text-xs text-gray-500 font-medium">
        &copy; 2024 Prevencar Vistorias. Versão 1.1.0
      </div>
    </div>
  );
};