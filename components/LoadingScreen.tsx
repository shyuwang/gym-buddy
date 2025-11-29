import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const TIPS = [
  "搭子正在仔细观察...",
  "记得补水！今天喝够水了吗？",
  "核心收紧，背部挺直！",
  "正在分析你的活动幅度...",
  "正在检查关节稳定性...",
  "每一次重复都很重要！",
  "正在准备你的个性化反馈..."
];

export const LoadingScreen: React.FC = () => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-energy-100 rounded-full blur-xl animate-pulse-slow opacity-70"></div>
        <div className="relative bg-white p-4 rounded-full shadow-lg mb-8">
          <Loader2 className="w-12 h-12 text-energy-500 animate-spin" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-4">
        正在分析动作
      </h3>
      
      <p className="text-slate-500 max-w-xs h-12 transition-opacity duration-300">
        "{TIPS[tipIndex]}"
      </p>
    </div>
  );
};