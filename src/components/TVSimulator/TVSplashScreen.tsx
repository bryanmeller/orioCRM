import React, { useEffect, useState } from 'react';
import { Tv2, Play } from 'lucide-react';

interface TVSplashScreenProps {
  onFinish: () => void;
}

export const TVSplashScreen: React.FC<TVSplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onFinish(), 300);
          return 100;
        }
        return prev + 5;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="w-full h-full bg-[#080808] flex flex-col items-center justify-center p-8 relative overflow-hidden select-none font-sans">
      {/* Background Radial Purple Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6A00FF]/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md space-y-6">
        {/* Animated App Logo */}
        <div
          onClick={onFinish}
          className="w-24 h-24 rounded-3xl bg-[#6A00FF] border-2 border-purple-400 text-white flex items-center justify-center shadow-[0_0_60px_rgba(106,0,255,0.7)] hover:scale-105 transition-transform duration-500 cursor-pointer"
        >
          <Tv2 size={48} className="text-white animate-pulse" />
        </div>

        {/* Brand Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white tracking-widest uppercase">STREAMFLIX TV</h1>
          <p className="text-gray-400 text-xs font-medium">Plataforma Android TV & Fire TV</p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-64 space-y-2 pt-4">
          <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className="bg-[#6A00FF] h-full rounded-full transition-all duration-150 ease-out shadow-[0_0_15px_#6A00FF]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
            <span>Carregando recursos...</span>
            <span className="text-purple-400 font-bold">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
