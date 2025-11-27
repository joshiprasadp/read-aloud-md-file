import React, { useState, useEffect, useRef } from 'react';
import { FileUploader } from './components/FileUploader';
import { MarkdownViewer, MarkdownViewerRef } from './components/MarkdownViewer';
import { GeminiPanel } from './components/GeminiPanel';
import { Button } from './components/Button';
import { MarkdownFile } from './types';
import { Play, Pause, Square, FileText, MessageSquareText, RotateCcw, Gauge, Mic2, MoveHorizontal } from 'lucide-react';

type ContentWidth = 'max-w-4xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-none';

const App: React.FC = () => {
  const [file, setFile] = useState<MarkdownFile | null>(null);
  const [showGemini, setShowGemini] = useState(false);
  const [contentWidth, setContentWidth] = useState<ContentWidth>('max-w-6xl');
  
  // TTS State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  
  // TTS Settings
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1.0);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const viewerRef = useRef<MarkdownViewerRef>(null);

  // Initialize Voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      const preferred = availableVoices.find(v => v.name.includes('Google US English')) || 
                        availableVoices.find(v => v.lang.startsWith('en')) || 
                        availableVoices[0];
      if (preferred && !selectedVoice) setSelectedVoice(preferred);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleFileUpload = (content: string, fileName: string) => {
    setFile({ name: fileName, content });
    stopReading(); 
  };

  // TTS Control Functions
  const startReading = (startIndex: number = 0) => {
    if (!file || !viewerRef.current) return;

    if (!('speechSynthesis' in window)) {
      alert("Your browser does not support text-to-speech.");
      return;
    }

    // Capture text directly from the rendered DOM to ensure indices match 
    const textContent = viewerRef.current.getInnerText();
    if (!textContent.trim()) return;

    window.speechSynthesis.cancel();

    // Slicing text to start from specific point
    const textToRead = textContent.substring(startIndex);
    if (!textToRead.trim()) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = rate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        // The event.charIndex is relative to the text segment being read.
        // We add startIndex to map it back to the full text index.
        setCurrentWordIndex(startIndex + event.charIndex);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const onWordClick = (index: number) => {
      // Seek to this word
      // Small debounce/timeout to prevent rapid firing glitches
      window.speechSynthesis.cancel();
      setTimeout(() => startReading(index), 10);
  };

  const handleRateChange = (newRate: number) => {
      setRate(newRate);
      if (isPlaying) {
          window.speechSynthesis.cancel();
          const currentIndex = currentWordIndex > 0 ? currentWordIndex : 0;
          setTimeout(() => startReading(currentIndex), 50);
      }
  };

  const handleVoiceChange = (voiceName: string) => {
      const voice = voices.find(v => v.name === voiceName);
      if (voice) {
          setSelectedVoice(voice);
          if (isPlaying) {
            window.speechSynthesis.cancel();
            const currentIndex = currentWordIndex > 0 ? currentWordIndex : 0;
            setTimeout(() => startReading(currentIndex), 50);
          }
      }
  };

  const pauseReading = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  };

  const resumeReading = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
  };

  const replayReading = () => {
    stopReading();
    setTimeout(() => startReading(0), 100);
  };
  
  const cycleWidth = () => {
      if (contentWidth === 'max-w-4xl') setContentWidth('max-w-6xl');
      else if (contentWidth === 'max-w-6xl') setContentWidth('max-w-7xl');
      else if (contentWidth === 'max-w-7xl') setContentWidth('max-w-none');
      else setContentWidth('max-w-4xl');
  };

  const getWidthLabel = () => {
      if (contentWidth === 'max-w-4xl') return 'Narrow';
      if (contentWidth === 'max-w-6xl') return 'Wide';
      if (contentWidth === 'max-w-7xl') return 'X-Wide';
      return 'Full';
  }

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gray-950 text-gray-300 font-sans">
      
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
                <FileText className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-100 hidden sm:block">
              {file ? file.name : 'Gemini Markdown Reader'}
            </h1>
          </div>

          {file && (
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Width Toggle */}
               <button 
                  onClick={cycleWidth}
                  className="hidden md:flex items-center px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-md border border-gray-700 transition-colors"
                  title="Toggle Text Width"
                >
                  <MoveHorizontal className="w-4 h-4 mr-2" />
                  {getWidthLabel()}
                </button>

              <div className="h-6 w-px bg-gray-800 mx-1 hidden sm:block" />

              <Button 
                variant={showGemini ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setShowGemini(!showGemini)}
                icon={<MessageSquareText className="w-4 h-4" />}
                className={showGemini ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}
              >
                {showGemini ? 'Hide Gemini' : 'Ask Gemini'}
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <div className="flex h-full">
          
          {/* Central Viewer Area */}
          <div className={`flex-1 overflow-y-auto transition-all duration-300 ${showGemini ? 'mr-0 md:mr-80 lg:mr-96' : ''} bg-gray-950`}>
            <div className="w-full px-4 py-6">
              {!file ? (
                <div className="mt-20 max-w-xl mx-auto">
                  <FileUploader onFileUpload={handleFileUpload} />
                  
                  <div className="mt-12 text-center text-gray-500">
                    <h3 className="font-medium text-gray-300 mb-2">Features</h3>
                    <ul className="text-sm space-y-2 text-gray-400">
                        <li>• Upload standard Markdown (.md) files</li>
                        <li>• <strong>Formal Document Styling</strong> (GitHub flavor)</li>
                        <li>• Text-to-Speech with <strong>Real-time Word Highlighting</strong></li>
                        <li>• <strong>Click-to-Play</strong>: Click any word to start reading from there</li>
                        <li>• <strong>Gemini Integration</strong> for summary and Q&A</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pb-32">
                    <MarkdownViewer 
                        ref={viewerRef}
                        content={file.content} 
                        maxWidth={contentWidth} 
                        currentWordIndex={currentWordIndex}
                        isPlaying={isPlaying}
                        onWordClick={onWordClick}
                    />
                </div>
              )}
            </div>
          </div>

          {/* Gemini Sidebar */}
          {file && showGemini && (
            <GeminiPanel documentContent={file.content} />
          )}

        </div>
      </main>

      {/* Footer Controls */}
      {file && (
        <div className={`fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 shadow-xl z-40 transition-all duration-300 ${showGemini ? 'md:pr-80 lg:pr-96' : ''}`}>
           <div className={`mx-auto transition-all duration-300 ${contentWidth}`}>
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Playback Controls */}
                <div className="flex items-center space-x-3 w-full md:w-auto justify-center md:justify-start">
                    {!isPlaying ? (
                        <Button variant="primary" onClick={() => startReading(0)} icon={<Play className="w-5 h-5 fill-current" />}>
                        Read Aloud
                        </Button>
                    ) : (
                        <>
                        {isPaused ? (
                            <Button variant="primary" onClick={resumeReading} icon={<Play className="w-5 h-5 fill-current" />}>
                                Resume
                            </Button>
                        ) : (
                            <Button variant="secondary" onClick={pauseReading} icon={<Pause className="w-5 h-5 fill-current" />}>
                                Pause
                            </Button>
                        )}
                        <Button variant="danger" onClick={stopReading} icon={<Square className="w-5 h-5 fill-current" />}>
                            Stop
                        </Button>
                        <Button variant="ghost" onClick={replayReading} title="Restart">
                            <RotateCcw className="w-5 h-5" />
                        </Button>
                        </>
                    )}
                </div>

                {/* Settings Toggle (Mobile mainly, or compact view) */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end">
                    
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 border border-gray-700">
                        <Gauge className="w-4 h-4 text-gray-400" />
                        <input 
                            type="range" 
                            min="0.5" 
                            max="2" 
                            step="0.1" 
                            value={rate} 
                            onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                            className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <span className="text-xs text-gray-400 w-8">{rate}x</span>
                    </div>

                    <div className="relative group">
                         <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 border border-gray-700 max-w-[200px]">
                            <Mic2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <select 
                                value={selectedVoice?.name || ''} 
                                onChange={(e) => handleVoiceChange(e.target.value)}
                                className="bg-transparent text-sm text-gray-300 focus:outline-none w-full truncate appearance-none pr-4 cursor-pointer"
                            >
                                {voices.map(v => (
                                    <option key={v.name} value={v.name} className="bg-gray-800">{v.name.slice(0, 25)}{v.name.length > 25 ? '...' : ''}</option>
                                ))}
                            </select>
                         </div>
                    </div>
                </div>
             </div>
             
             {isPlaying && (
                 <div className="mt-2 text-center md:text-left">
                     <span className="animate-pulse text-xs font-medium text-blue-400 flex items-center justify-center md:justify-start">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                          Reading... (Click any text to skip to it)
                      </span>
                 </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
};

export default App;