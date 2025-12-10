import React, { useState } from 'react';
import { ViewState } from '../types';
import { KeyRound, Check, Shield, Mail, Phone } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface ForgotPasswordProps {
  changeView: (view: ViewState) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ changeView }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: Contact Info, 3: Confirmation
  const [email, setEmail] = useState('');

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate processing
    alert('Solicitação de redefinição de senha recebida! Entre em contato com o administrador para redefinir sua senha.');
    setStep(2);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
      e.preventDefault();
      // Show contact information
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
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-6 rounded-lg">
                    <Mail size={48} className="mx-auto mb-4 text-blue-600"/>
                    <p className="font-bold text-lg mb-2">Solicitação Recebida!</p>
                    <p className="text-sm mb-4">Para redefinir sua senha, entre em contato com o administrador do sistema:</p>

                    <div className="bg-white p-4 rounded-lg border border-blue-200 mb-4">
                        <div className="flex items-center justify-center mb-2">
                            <Mail size={20} className="mr-2 text-blue-600"/>
                            <span className="font-semibold">Email:</span>
                        </div>
                        <p className="text-blue-800 font-bold">admin@prevencar.com.br</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-center mb-2">
                            <Phone size={20} className="mr-2 text-blue-600"/>
                            <span className="font-semibold">Telefone:</span>
                        </div>
                        <p className="text-blue-800 font-bold">(11) 99999-9999</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setStep(1)}
                    >
                        Fazer Nova Solicitação
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
                <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg">
                    <Check size={48} className="mx-auto mb-4 text-green-600"/>
                    <p className="font-bold text-lg mb-2">Solicitação Processada!</p>
                    <p className="text-sm">Sua solicitação de redefinição de senha foi registrada.</p>
                    <p className="text-sm mt-2">O administrador entrará em contato em breve para ajudar com a redefinição.</p>
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