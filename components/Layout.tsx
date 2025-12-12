import React, { useState, useRef, useEffect } from 'react';
import { NavProps, ViewState } from '../types';
import { Menu, LogOut, Home, FileText, Settings, User as UserIcon, ChevronDown, Lock, Moon, Sun, BarChart3 } from 'lucide-react';

interface LayoutProps extends NavProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, changeView, logout, children, currentUser }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const navItems = [
    { label: 'Home', view: ViewState.HOME, icon: <Home size={20} />, roles: ['admin', 'financeiro', 'vistoriador'] },
    { label: 'Fichas', view: ViewState.INSPECTION_LIST, icon: <FileText size={20} />, roles: ['admin', 'financeiro', 'vistoriador'] },
    // Only Admin and Financeiro see Reports and Management
    { label: 'Relatórios', view: ViewState.REPORTS, icon: <BarChart3 size={20} />, roles: ['admin', 'financeiro'] },
    { label: 'Cadastros', view: ViewState.MANAGEMENT, icon: <Settings size={20} />, roles: ['admin', 'financeiro'] },
  ];

  const getPageTitle = () => {
    switch (currentView) {
        case ViewState.HOME: return 'Dashboard';
        case ViewState.INSPECTION_LIST: return 'Gestão de Fichas';
        case ViewState.INSPECTION_FORM: return 'Nova Vistoria';
        case ViewState.MANAGEMENT: return 'Administração';
        default: return 'Prevencar';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch(role) {
        case 'admin': return 'Administrador';
        case 'financeiro': return 'Financeiro';
        case 'vistoriador': return 'Vistoriador';
        default: return 'Usuário';
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brand-bg dark:bg-brand-bg font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 
        bg-gradient-to-b from-brand-blue to-[#2a3d66] text-white shadow-2xl flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-white/10 bg-black/10">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-yellow p-2 rounded-xl text-brand-blue shadow-lg">
              <img src="/logo.png" alt="Prevencar Logo" className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-wide leading-none">Prevencar</span>
              <span className="text-xs text-blue-200 font-medium uppercase tracking-wider mt-1">Vistorias</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.filter(item => item.roles.includes(currentUser?.role || 'vistoriador')).map((item) => (
            <button
              key={item.label}
              onClick={() => {
                changeView(item.view);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden
                ${currentView === item.view 
                  ? 'bg-white/10 text-white shadow-lg' 
                  : 'text-blue-200 hover:bg-white/5 hover:text-white'}`}
            >
              {currentView === item.view && (
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-yellow rounded-l-full"></div>
              )}
              <span className={`${currentView === item.view ? 'text-brand-yellow' : 'text-blue-300 group-hover:text-white'}`}>
                {item.icon}
              </span>
              <span className="font-medium tracking-wide">{item.label}</span>
            </button>
          ))}
          
          {/* Link to Profile for everyone */}
          <button
              onClick={() => {
                changeView(ViewState.MANAGEMENT);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden text-blue-200 hover:bg-white/5 hover:text-white`}
            >
               <UserIcon size={20} className="text-blue-300 group-hover:text-white"/>
               <span className="font-medium tracking-wide">Meu Perfil</span>
          </button>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-black/20">
             <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-blue-200 hover:bg-brand-mauve hover:text-white transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Sair do Sistema</span>
            </button>
          </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
            />
        )}

        {/* Top Header */}
        <header className="h-20 bg-white shadow-sm flex items-center justify-between px-6 z-20 sticky top-0 border-b border-gray-100">
            <div className="flex items-center">
                <button 
                    className="md:hidden mr-4 text-gray-600 hover:text-brand-blue p-2 rounded-lg hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(true)}
                >
                    <Menu size={24} />
                </button>
                <h2 className="text-xl font-bold text-gray-800 hidden md:block tracking-tight">{getPageTitle()}</h2>
                <div className="md:hidden font-bold text-brand-blue text-lg">Prevencar</div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600 dark:text-gray-300" />}
                </button>

                {/* User Profile Dropdown */}
                <div className="relative" ref={userMenuRef}>
                    <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className={`flex items-center space-x-3 cursor-pointer p-1.5 rounded-xl transition-all duration-200 border border-transparent
                        ${isUserMenuOpen ? 'bg-gray-50 border-gray-200 shadow-sm' : 'hover:bg-gray-50'}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white uppercase">
                            {currentUser?.name.charAt(0) || 'U'}
                        </div>
                        <div className="hidden md:block text-left pr-2">
                            <div className="text-sm font-bold text-gray-700 leading-tight">{currentUser?.name}</div>
                            <div className="text-xs text-gray-500">{currentUser?.email}</div>
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 hidden md:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform origin-top-right animate-in fade-in slide-in-from-top-2">
                        <div className="p-5 border-b border-gray-50 bg-brand-blue text-white relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-10 rounded-full -mr-4 -mt-4"></div>
                           <div className="relative z-10">
                             <p className="font-bold text-lg">{currentUser?.name}</p>
                             <p className="text-xs text-blue-200 flex items-center gap-1">
                                <Lock size={10} />
                                {getRoleLabel(currentUser?.role)}
                             </p>
                           </div>
                        </div>
                        <div className="p-2 space-y-1">
                          <button onClick={() => changeView(ViewState.MANAGEMENT)} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 text-sm flex items-center space-x-3 transition-colors">
                             <UserIcon size={16} className="text-gray-400" />
                             <span>Meu Perfil (Dados)</span>
                          </button>
                          <button onClick={() => changeView(ViewState.MANAGEMENT)} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 text-sm flex items-center space-x-3 transition-colors">
                             <Settings size={16} className="text-gray-400" />
                             <span>Configurações da Conta</span>
                          </button>
                        </div>
                        <div className="p-2 border-t border-gray-100">
                          <button 
                            onClick={logout}
                            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 text-sm flex items-center space-x-3 font-medium transition-colors"
                          >
                            <LogOut size={16} />
                            <span>Sair do Sistema</span>
                          </button>
                        </div>
                      </div>
                    )}
                </div>

            </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-brand-bg p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};