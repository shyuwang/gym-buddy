import React, { useState, useRef } from 'react';
import { Upload, ChevronRight, CheckCircle2, AlertCircle, PlayCircle, BarChart3, HelpCircle, Dumbbell, Zap } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { LoadingScreen } from './components/LoadingScreen';
import { ScoreCircle } from './components/ScoreCircle';
import { ChatInterface } from './components/ChatInterface';
import { AppView, AnalysisResult, HistoryItem } from './types';
import { analyzeVideo } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for history visualization
const HISTORY_MOCK = [
  { date: '10/24', score: 65 },
  { date: '10/26', score: 72 },
  { date: '10/28', score: 68 },
  { date: '11/01', score: 80 },
  { date: '11/03', score: 85 },
];

export default function App() {
  const [currentView, setView] = useState<AppView>(AppView.HOME);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // HUD Overlay State
  const [overlayText, setOverlayText] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  // Ref to track when to auto-pause the video after a jump
  const videoStopTimeRef = useRef<number | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (file.size > 20 * 1024 * 1024) {
      setError("视频太大了，请上传 20MB 以内的视频。");
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeVideo(file);
      setAnalysis(result);
      setView(AppView.ANALYSIS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "分析失败，请重试。");
      setVideoUrl(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const jumpToTimestamp = (seconds: number, feedbackText: string) => {
    if (videoRef.current) {
      // 1. Scroll to video so user sees it
      videoContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 2. Set Video State
      videoRef.current.currentTime = seconds;
      videoRef.current.playbackRate = 0.5; // Enable Slow Motion
      videoRef.current.play();

      // 3. Set Logic State
      setOverlayText(feedbackText); // Show HUD
      videoStopTimeRef.current = seconds + 4; // Play for 4 seconds
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && videoStopTimeRef.current !== null) {
      if (videoRef.current.currentTime >= videoStopTimeRef.current) {
        // Stop Logic
        videoRef.current.pause();
        videoRef.current.playbackRate = 1.0; // Reset speed
        videoStopTimeRef.current = null;
        setOverlayText(null); // Hide HUD
      }
    }
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          AI 健身 <span className="text-energy-500">搭子</span>
        </h1>
        <p className="text-slate-500 max-w-xs mx-auto">
          你的专属动作教练。上传视频，获取即时专业反馈。
        </p>
      </div>

      <div className="w-full max-w-sm">
        {isAnalyzing ? (
          <LoadingScreen />
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative cursor-pointer"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-energy-500 to-energy-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white border-2 border-dashed border-energy-200 rounded-2xl p-10 flex flex-col items-center gap-4 hover:border-energy-400 transition-colors">
              <div className="p-4 bg-energy-50 text-energy-500 rounded-full group-hover:scale-110 transition-transform duration-300">
                <Upload size={32} />
              </div>
              <div>
                <span className="block font-bold text-slate-800">点击上传视频</span>
                <span className="text-sm text-slate-400">支持 MP4, MOV (最大 20MB)</span>
              </div>
            </div>
            <input 
              type="file" 
              accept="video/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
            />
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center justify-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {!isAnalyzing && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm text-left">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="bg-growth-50 w-8 h-8 rounded-full flex items-center justify-center text-growth-500 mb-2">
              <CheckCircle2 size={18} />
            </div>
            <h3 className="font-bold text-sm">即时纠正</h3>
            <p className="text-xs text-slate-500">实时动作优化建议</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="bg-trust-50 w-8 h-8 rounded-full flex items-center justify-center text-trust-500 mb-2">
              <BarChart3 size={18} />
            </div>
            <h3 className="font-bold text-sm">追踪进度</h3>
            <p className="text-xs text-slate-500">见证动作质量提升</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalysis = () => {
    if (!analysis) return null;

    return (
      <div className="h-screen flex flex-col lg:flex-row bg-gray-50 overflow-hidden animate-in fade-in duration-500">
        
        {/* Left Column: Video Container - Styled like a phone */}
        {/* Added pb-20 on mobile to allow scrolling past nav, centered nicely on desktop */}
        <div ref={videoContainerRef} className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-gray-100 relative z-10 p-4 lg:p-8 shrink-0 overflow-y-auto lg:overflow-visible">
          
          <div className="relative w-full max-w-[320px] lg:max-w-[340px] transition-all duration-300">
            {/* Phone Bezel Container - Added max-h constraint to prevent top clipping */}
            <div className="relative bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl ring-1 ring-white/10 ring-inset mx-auto" style={{ maxHeight: '85vh', aspectRatio: '9/19.5' }}>
               {/* Inner Border/Screen */}
               <div className="relative w-full h-full bg-black rounded-[2rem] overflow-hidden ring-1 ring-slate-800 flex items-center bg-black group">
                  <video 
                    ref={videoRef}
                    src={videoUrl || ''} 
                    controls 
                    className="w-full h-full object-contain"
                    playsInline
                    onTimeUpdate={handleVideoTimeUpdate}
                  />

                  {/* HUD Overlay - Lower Third Floating Pill Style */}
                  {overlayText && (
                    <div className="absolute bottom-14 left-4 right-4 bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-xl p-4 rounded-3xl animate-in fade-in slide-in-from-bottom-8 duration-500 pointer-events-none z-30 flex flex-col gap-1.5">
                       <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                             <div className="w-1.5 h-1.5 rounded-full bg-energy-500 animate-pulse"></div>
                             <span className="text-[10px] uppercase font-bold text-energy-400 tracking-wider">0.5x 慢放指导</span>
                          </div>
                       </div>
                       <p className="text-white/95 font-medium text-sm leading-snug drop-shadow-md pl-1">
                         {overlayText}
                       </p>
                    </div>
                  )}

               </div>
               {/* Home Bar Indicator */}
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-white/20 rounded-full backdrop-blur-sm pointer-events-none z-20"></div>
            </div>
             {/* Decorative background glow behind phone */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[80%] bg-gradient-to-tr from-energy-200/50 to-trust-200/50 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          </div>
        </div>

        {/* Right Column: Scrollable Analysis Content */}
        {/* Added pb-24 to ensure bottom content isn't hidden behind navbar */}
        <div className="w-full lg:w-1/2 h-full overflow-y-auto bg-gray-50 px-4 lg:px-8 pt-6 pb-24 space-y-6 scroll-smooth">
          
          {/* Header & Score */}
          <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-100 sticky top-0 z-20 bg-opacity-90 backdrop-blur-md">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900">{analysis.exerciseName}</h2>
              <div className="flex gap-2 mt-2 flex-wrap">
                {analysis.muscleGroups.map((m, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] lg:text-xs uppercase font-bold rounded-full tracking-wide">
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <ScoreCircle score={analysis.score} />
          </div>

          {/* AI Summary */}
          <div className="bg-gradient-to-r from-trust-50 to-white border border-trust-100 p-5 rounded-2xl flex gap-4 shadow-sm">
             <div className="shrink-0">
               <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-xl">
                 🤖
               </div>
             </div>
             <div>
               <p className="text-sm text-slate-700 leading-relaxed font-medium mt-1">
                 "{analysis.summary}"
               </p>
             </div>
          </div>

          {/* Highlights */}
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <div className="p-1.5 bg-growth-100 rounded-lg text-growth-500">
                <CheckCircle2 size={18} />
              </div>
              做得棒的地方
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.strengths.map((str, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-growth-500 transition-transform hover:scale-[1.02]">
                  <p className="text-slate-700 font-medium text-sm">{str}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Improvements */}
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <div className="p-1.5 bg-energy-100 rounded-lg text-energy-500">
                <AlertCircle size={18} />
              </div>
              提升空间
            </h3>
            <div className="space-y-4">
              {analysis.improvements.map((imp, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
                  <div className="p-5 border-b border-gray-50">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h4 className="font-bold text-slate-800">{imp.point}</h4>
                      {imp.timestamp !== undefined && imp.timestamp >= 0 && (
                        <button 
                          onClick={() => jumpToTimestamp(imp.timestamp!, imp.correction)}
                          className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-energy-600 bg-energy-50 px-3 py-1.5 rounded-full hover:bg-energy-100 transition-colors"
                        >
                          <PlayCircle size={14} />
                          智能慢放
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-0">{imp.explanation}</p>
                  </div>
                  <div className="px-5 py-3 bg-energy-50 border-t border-energy-100">
                    <p className="text-sm font-medium text-energy-800 flex gap-2 items-center">
                      <span className="shrink-0 text-lg">💡</span> 
                      {imp.correction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Chat */}
          <section className="pb-8">
             <h3 className="text-lg font-bold text-slate-800 mb-3">有疑问？聊两句</h3>
             <ChatInterface analysis={analysis} />
          </section>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
     <div className="p-6 pb-24 max-w-md mx-auto min-h-screen animate-in fade-in slide-in-from-bottom-2">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">你的进步</h2>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">动作评分趋势</h3>
             <span className="text-xs font-medium text-energy-500 bg-energy-50 px-2 py-1 rounded-full">近 5 次</span>
           </div>
           <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={HISTORY_MOCK}>
                 <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 12, fill: '#94a3b8'}} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                 />
                 <Tooltip 
                    cursor={{fill: '#fef3c7', opacity: 0.4}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '14px', fontWeight: 'bold'}}
                 />
                 <Bar 
                    dataKey="score" 
                    fill="#f97316" 
                    radius={[6, 6, 6, 6]} 
                    barSize={20}
                  />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-4">历史训练</h3>
        <div className="space-y-4 opacity-60 pointer-events-none grayscale">
           {/* Mock History Items (Blurred out to signify demo state) */}
           {[1, 2, 3].map((_, i) => (
             <div key={i} className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-xl shrink-0 flex items-center justify-center text-slate-300">
                  <PlayCircle size={24} />
                </div>
                <div className="flex-1 py-1">
                   <div className="flex justify-between items-start">
                     <div>
                        <span className="block font-bold text-slate-800">深蹲日</span>
                        <span className="text-xs text-slate-400">10月26日</span>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-energy-100 flex items-center justify-center font-bold text-energy-600 text-xs">
                       72
                     </div>
                   </div>
                </div>
             </div>
           ))}
           <div className="text-center text-sm text-slate-400 mt-6 bg-slate-100 p-3 rounded-xl">
             连接账户以保存历史记录
           </div>
        </div>
     </div>
  );

  const renderLibrary = () => (
    <div className="p-6 pb-24 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-2">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">动作库</h2>
      <div className="space-y-4">
        {['深蹲 (Squat)', '硬拉 (Deadlift)', '卧推 (Bench Press)', '推举 (Overhead Press)'].map(move => (
          <div key={move} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center hover:border-energy-300 hover:shadow-md transition-all cursor-pointer group">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-energy-50 rounded-xl flex items-center justify-center text-energy-500 group-hover:bg-energy-500 group-hover:text-white transition-colors">
                 <Dumbbell size={24} />
               </div>
               <span className="font-bold text-slate-800">{move}</span>
             </div>
             <ChevronRight size={20} className="text-gray-300 group-hover:text-energy-500 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className="mx-auto bg-gray-50 min-h-screen">
        {currentView === AppView.HOME && renderHome()}
        {currentView === AppView.ANALYSIS && renderAnalysis()}
        {currentView === AppView.HISTORY && renderHistory()}
        {currentView === AppView.LIBRARY && renderLibrary()}
      </main>
      <Navigation currentView={currentView} setView={setView} />
    </div>
  );
}