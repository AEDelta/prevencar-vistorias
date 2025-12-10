import React, { useState } from 'react';
import { ViewState } from '../types';
import { KeyRound, Check, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

interface ForgotPasswordProps {
  changeView: (view: ViewState) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ changeView }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: Success, 3: Instructions
  const [email, setEmail] = useState('');

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Email de redefinição de senha enviado! Verifique sua caixa de entrada.');
      setStep(2);
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      let message = 'Erro ao enviar email de redefinição de senha.';
      if (error.code === 'auth/user-not-found') {
        message = 'Email não encontrado. Verifique se o email está correto.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido.';
      }
      alert(message);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
      e.preventDefault();
      // Since Firebase handles the reset through email links,
      // we just show a success message
      alert('Verifique seu email e clique no link para redefinir sua senha.');
      setStep(3);
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

        {step === 1 && (
          <form onSubmit={handleSendEmail} className="space-y-6 animate-fade-in">
            <p className="text-gray-600 text-center">
              Informe seu e-mail cadastrado para receber o link de redefinição de senha.
            </p>
            <Input 
              label="E-mail" 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="space-y-3">
              <Button type="submit" className="w-full">
                Enviar Link de Redefinição
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
        )}

        {step === 2 && (
            <div className="space-y-6 animate-fade-in text-center">
                <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg">
                    <Check size={48} className="mx-auto mb-4 text-green-600"/>
                    <p className="font-bold text-lg mb-2">Email Enviado!</p>
                    <p className="text-sm">Enviamos um link de redefinição de senha para:</p>
                    <p className="font-bold text-brand-blue mt-2">{email}</p>
                    <p className="text-sm mt-4">Verifique sua caixa de entrada e clique no link para redefinir sua senha.</p>
                </div>
                <div className="space-y-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setStep(1)}
                    >
                        Enviar Novamente
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => changeView(ViewState.LOGIN)}
                    >
                        Voltar ao Login
                    </Button>
                </div>
            </div>
        )}

        {step === 3 && (
            <div className="space-y-6 animate-fade-in text-center">
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-6 rounded-lg">
                    <Shield size={48} className="mx-auto mb-4 text-blue-600"/>
                    <p className="font-bold text-lg mb-2">Próximos Passos</p>
                    <p className="text-sm">1. Verifique seu email e clique no link de redefinição</p>
                    <p className="text-sm">2. Você será redirecionado para uma página segura</p>
                    <p className="text-sm">3. Digite sua nova senha</p>
                    <p className="text-sm mt-4">O link é válido por 1 hora.</p>
                </div>
                <Button
                    className="w-full"
                    onClick={() => changeView(ViewState.LOGIN)}
                >
                    Voltar ao Login
                </Button>
            </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="bg-green-100 text-green-700 p-6 rounded-lg flex flex-col items-center">
                <Shield size={48} className="mb-2"/>
              <p className="font-bold text-lg">Senha Alterada!</p>
              <p className="text-sm">Você já pode acessar o sistema com sua nova senha.</p>
            </div>
            <Button 
              className="w-full"
              onClick={() => changeView(ViewState.LOGIN)}
            >
              Voltar ao Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};