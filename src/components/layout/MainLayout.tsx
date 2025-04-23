
import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const MainLayout = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  // Автоматически закрываем сайдбар при переходе на мобильный размер
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);
  
  // Обработчики для сайдбара
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleCloseSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Кнопка переключения сайдбара для мобильных */}
      <Button
        variant="ghost"
        size="icon"
        className={`${isMobile ? 'fixed' : 'hidden'} top-4 left-4 z-50`}
        onClick={handleToggleSidebar}
      >
        {sidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>
      
      {/* Сайдбар */}
      <div 
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-200 ease-in-out ${
          isMobile ? 'fixed z-40 h-full' : 'relative'
        } bg-sidebar`}
      >
        <Sidebar onClose={handleCloseSidebar} />
      </div>
      
      {/* Затемнение для мобильных при открытом сайдбаре */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 animate-fade-in"
          onClick={handleCloseSidebar}
        />
      )}
      
      {/* Основной контент */}
      <main className={`flex flex-col flex-1 overflow-hidden ${isMobile && sidebarOpen ? 'blur-sm' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
