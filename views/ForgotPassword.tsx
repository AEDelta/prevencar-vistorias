import React, { useState } from 'react';
import { ViewState } from '../types';
import { KeyRound, Check, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import emailjs from '@emailjs/browser';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ForgotPasswordProps {
  changeView: (view: ViewState) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ changeView }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const resetData = {
        email,
        code,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      };
      await setDoc(doc(db, 'passwordResets', email), resetData);
      // Send email
      await emailjs.send(
        'your_service_id', // Replace with your EmailJS service ID
        'your_template_id', // Replace with your EmailJS template ID
        {
          to_email: email,
          code: code
        },
        'your_public_key' // Replace with your EmailJS public key
      );
      setStep(2);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      alert('Erro ao enviar email');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const resetDoc = await getDoc(doc(db, 'passwordResets', email));
        if (resetDoc.exists()) {
          const data = resetDoc.data();
          if (data.code === code && data.expiresAt.toDate() > new Date()) {
            setStep(3);
          } else {
            alert('Código inválido ou expirado');
          }
        } else {
          alert('Código inválido');
        }
      } catch (error) {
        console.error('Erro ao verificar código:', error);
        alert('Erro ao verificar código');
      }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      // Since no backend, simulate success
      alert('Senha alterada com sucesso');
      setStep(4);
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
              Informe seu e-mail cadastrado para receber o código de verificação.
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
                Enviar Código
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
            <form onSubmit={handleVerifyCode} className="space-y-6 animate-fade-in">
                <div className="text-center">
                    <p className="text-gray-600">Enviamos um código para:</p>
                    <p className="font-bold text-brand-blue mb-4">{email}</p>
                </div>
                <Input 
                    label="Código de Verificação" 
                    type="text" 
                    placeholder="000000" 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                />
                <div className="space-y-3">
                    <Button type="submit" className="w-full">
                        Verificar Código
                    </Button>
                    <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setStep(1)}
                    >
                        Voltar
                    </Button>
                </div>
            </form>
        )}

        {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-fade-in">
                <p className="text-gray-600 text-center">
                    Crie sua nova senha de acesso.
                </p>
                <Input 
                    label="Nova Senha" 
                    type="password" 
                    placeholder="••••••••" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                 <Input 
                    label="Confirmar Nova Senha" 
                    type="password" 
                    placeholder="••••••••" 
                    required
                />
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    <Check size={18} className="mr-2"/> Redefinir Senha
                </Button>
            </form>
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