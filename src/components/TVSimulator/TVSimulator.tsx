import React, { useState, useEffect, useCallback } from 'react';
import { TVSplashScreen } from './TVSplashScreen';
import { TVInitialScreen } from './TVInitialScreen';
import { TVLoginScreen } from './TVLoginScreen';
import { TVHomeScreen } from './TVHomeScreen';
import { RemoteControl } from './RemoteControl';
import { TVScreenMode } from '../../types/flutter';
import { Maximize2, RefreshCw, Smartphone } from 'lucide-react';

interface TVSimulatorProps {
  onOpenCustomerPortal?: () => void;
  developmentPreview?: boolean;
}

export const TVSimulator: React.FC<TVSimulatorProps> = ({
  onOpenCustomerPortal,
  developmentPreview = true,
}) => {
  const [screenMode, setScreenMode] = useState<TVScreenMode>('splash');
  const [loginFocusIndex, setLoginFocusIndex] = useState<number>(0);
  const [homeRowIndex, setHomeRowIndex] = useState<number>(2); // 0=sidebar, 1=hero, 2=grid
  const [homeColIndex, setHomeColIndex] = useState<number>(0);
  const [showRemote, setShowRemote] = useState<boolean>(true);

  // Restart simulation
  const handleRestart = () => {
    setScreenMode('splash');
    setLoginFocusIndex(0);
    setHomeRowIndex(2);
    setHomeColIndex(0);
  };

  // D-Pad Navigation Handler
  const handleNavigate = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (screenMode === 'splash') {
        setScreenMode('initial');
        return;
      }

      if (screenMode === 'initial') {
        if (direction === 'right' || direction === 'left' || direction === 'down') {
          // Focus navigation on initial screen
        }
        return;
      }

      if (screenMode === 'login') {
        if (direction === 'up') {
          setLoginFocusIndex((prev) => Math.max(0, prev - 1));
        } else if (direction === 'down') {
          setLoginFocusIndex((prev) => Math.min(3, prev + 1));
        }
        return;
      }

      if (screenMode === 'home') {
        if (direction === 'left') {
          if (homeRowIndex === 0) {
            setHomeColIndex((prev) => Math.max(0, prev - 1));
          } else if (homeRowIndex === 1) {
            setHomeColIndex((prev) => Math.max(0, prev - 1));
          } else if (homeRowIndex === 2) {
            setHomeColIndex((prev) => Math.max(0, prev - 1));
          }
        } else if (direction === 'right') {
          if (homeRowIndex === 0) {
            setHomeColIndex((prev) => Math.min(4, prev + 1));
          } else if (homeRowIndex === 1) {
            setHomeColIndex((prev) => Math.min(5, prev + 1));
          } else if (homeRowIndex === 2) {
            setHomeColIndex((prev) => Math.min(5, prev + 1));
          }
        } else if (direction === 'up') {
          if (homeRowIndex === 0) {
            // Stay on top navbar
          } else if (homeRowIndex === 1) {
            setHomeRowIndex(0); // Move back to top navbar
            setHomeColIndex(0);
          } else if (homeRowIndex === 2) {
            setHomeRowIndex(1); // Move to sub-row or hero
            setHomeColIndex(0);
          }
        } else if (direction === 'down') {
          if (homeRowIndex === 0) {
            setHomeRowIndex(1); // Move to main body
            setHomeColIndex(0);
          } else if (homeRowIndex === 1) {
            setHomeRowIndex(2); // Move to content grid
            setHomeColIndex(0);
          }
        }
      }
    },
    [screenMode, homeRowIndex, homeColIndex]
  );

  // Handle OK / Select
  const handleSelect = useCallback(() => {
    if (screenMode === 'splash') {
      setScreenMode('initial');
    } else if (screenMode === 'initial') {
      setScreenMode('login');
    } else if (screenMode === 'login') {
      if (loginFocusIndex === 3) {
        setScreenMode('home');
      } else {
        setLoginFocusIndex((prev) => (prev + 1) % 4);
      }
    } else if (screenMode === 'home') {
      // Action triggered
    }
  }, [screenMode, loginFocusIndex]);

  // Handle Back
  const handleBack = useCallback(() => {
    if (screenMode === 'home') {
      setScreenMode('login');
    } else if (screenMode === 'login') {
      setScreenMode('initial');
    } else if (screenMode === 'initial') {
      setScreenMode('splash');
    }
  }, [screenMode]);

  // Handle Home button
  const handleHome = useCallback(() => {
    setScreenMode('home');
  }, []);

  // Global Keyboard listener for arrow keys, enter, escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing inside text inputs unless arrow key
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && !['ArrowUp', 'ArrowDown', 'Escape', 'Enter'].includes(e.key)) {
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleNavigate('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNavigate('down');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNavigate('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNavigate('right');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect();
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        if (target.tagName !== 'INPUT') {
          e.preventDefault();
          handleBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavigate, handleSelect, handleBack]);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-6 p-4 max-w-7xl mx-auto min-h-[calc(100vh-100px)]">
      {/* Smart TV Frame Container */}
      <div className="flex-1 w-full max-w-5xl flex flex-col items-center">
        {/* Top TV Frame Bar (Dev Mode Only) */}
        {developmentPreview && (
          <div className="w-full bg-[#000000] border border-[#2A2A2A] rounded-t-3xl px-6 py-2.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-mono text-gray-400 border-l border-gray-700 pl-3">
                Android TV / Fire TV Leanback Simulator (1080p)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRestart}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 bg-[#252525] hover:bg-[#333] px-2.5 py-1 rounded-lg border border-white/10 transition-colors cursor-pointer"
                title="Reiniciar Simulação da TV"
              >
                <RefreshCw size={12} />
                <span>Reiniciar</span>
              </button>
              <button
                onClick={() => setShowRemote(!showRemote)}
                className="text-xs text-gray-300 hover:text-white flex items-center gap-1.5 bg-[#6A00FF]/20 hover:bg-[#6A00FF]/40 px-2.5 py-1 rounded-lg border border-white/10 transition-colors cursor-pointer"
              >
                <Smartphone size={12} />
                <span>{showRemote ? 'Ocultar Controle' : 'Mostrar Controle'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TV DISPLAY ASPECT 16:9 CONTAINER */}
        <div className={`w-full aspect-video bg-[#000000] border border-[#2A2A2A] ${developmentPreview ? 'rounded-b-3xl' : 'rounded-3xl'} shadow-2xl relative overflow-hidden ring-1 ring-white/10`}>
          {screenMode === 'splash' && (
            <TVSplashScreen onFinish={() => setScreenMode('initial')} />
          )}

          {screenMode === 'initial' && (
            <TVInitialScreen
              onGoToLogin={() => setScreenMode('login')}
              onOpenCustomerPortal={onOpenCustomerPortal}
            />
          )}

          {screenMode === 'login' && (
            <TVLoginScreen
              focusedIndex={loginFocusIndex}
              onLoginSuccess={() => setScreenMode('home')}
              onSelectFocused={(idx) => setLoginFocusIndex(idx)}
              onBackToInitial={() => setScreenMode('initial')}
            />
          )}

          {screenMode === 'home' && (
            <TVHomeScreen
              focusedRow={homeRowIndex}
              focusedCol={homeColIndex}
              onLogout={() => {
                localStorage.removeItem('streamflix_token');
                localStorage.removeItem('streamflix_username');
                localStorage.removeItem('streamflix_user_data');
                localStorage.removeItem('streamflix_license_data');
                localStorage.removeItem('streamflix_server_url');
                localStorage.removeItem('streamflix_server_name');
                setScreenMode('initial');
              }}
            />
          )}
        </div>

        {/* TV Bottom Stand Visual (Dev Mode Only) */}
        {developmentPreview && (
          <div className="w-48 h-3 bg-gradient-to-b from-[#2A2A2A] to-[#181818] rounded-b-xl border-x border-b border-[#333] shadow-sm flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#9C4DFF] animate-pulse" />
          </div>
        )}
      </div>

      {/* D-Pad Remote Control Overlay / Sidebar */}
      {showRemote && developmentPreview && (
        <div className="shrink-0 animate-in fade-in slide-in-from-right duration-300">
          <RemoteControl
            onNavigate={handleNavigate}
            onSelect={handleSelect}
            onBack={handleBack}
            onHome={handleHome}
          />
        </div>
      )}
    </div>
  );
};
