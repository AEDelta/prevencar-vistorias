import React, { useState } from 'react';
import { ViewState } from '../types';
import { KeyRound, Check, Shield, Mail, Phone } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

interface ForgotPasswordProps {
  changeView: (view: ViewState) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ changeView }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, insira seu email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error: any) {
      console.error('Erro ao enviar email de redefinição:', error);
      let message = 'Erro ao enviar email. Tente novamente.';
      if (error.code === 'auth/user-not-found') {
        message = 'Email não encontrado no sistema.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Muitas tentativas. Tente novamente mais tarde.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 border-t-4 border-brand-mauve">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-brand-mauve p-3 rounded-full mb-3">
             <KeyRound className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-brand-blue">Recuperar Senha</h2>
        </div>

        {!success ? (
          <form onSubmit={handleSendEmail} className="space-y-6 animate-fade-in">
            <p className="text-gray-600 text-center">
              Informe seu e-mail cadastrado para receber o link de redefinição de senha.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => changeView(ViewState.LOGIN)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg">
              <Check size={48} className="mx-auto mb-4 text-green-600"/>
              <p className="font-bold text-lg mb-2">Email Enviado!</p>
              <p className="text-sm">Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
              <p className="text-sm mt-2">Se não encontrar o email, verifique a pasta de spam.</p>
            </div>
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => changeView(ViewState.LOGIN)}
              >
                Voltar ao Login
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                  setError('');
                }}
              >
                Enviar para Outro Email
              </Button>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};