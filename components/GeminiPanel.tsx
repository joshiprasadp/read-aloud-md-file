import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { generateSummary, chatWithDocument } from '../services/geminiService';
import { Button } from './Button';
import { ChatMessage } from '../types';

interface GeminiPanelProps {
  documentContent: string;
}

export const GeminiPanel: React.FC<GeminiPanelProps> = ({ documentContent }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    const result = await generateSummary(documentContent);
    setSummary(result);
    setIsLoadingSummary(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isChatLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsChatLoading(true);

    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const responseText = await chatWithDocument(documentContent, userMsg.text, history);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsChatLoading(false);
  };

  return (
    <div className="bg-gray-900 border-l border-gray-800 h-full flex flex-col w-full md:w-80 lg:w-96 shadow-lg fixed right-0 top-0 pt-16 md:pt-0 md:relative z-20">
      <div className="p-4 border-b border-gray-800 bg-gray-900">
        <h2 className="flex items-center text-indigo-400 font-semibold text-lg">
          <Sparkles className="w-5 h-5 mr-2" />
          Gemini Assistant
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {/* Summary Section */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-xs font-bold text-indigo-300 mb-2 uppercase tracking-wide">Summary</h3>
          {!summary ? (
            <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleGenerateSummary} 
                className="w-full"
                disabled={isLoadingSummary}
            >
              {isLoadingSummary ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isLoadingSummary ? 'Generating...' : 'Generate Summary'}
            </Button>
          ) : (
            <div className="text-sm text-gray-300 leading-relaxed animate-fade-in">
              {summary}
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide border-t border-gray-800 pt-4">Ask about the document</h3>
            
            {messages.length === 0 && (
                <p className="text-xs text-gray-500 text-center italic">Ask questions like "What is the main topic?" or "List the key points."</p>
            )}

            <div className="space-y-3">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] rounded-2xl px-4 py-2 text-sm ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isChatLoading && (
                     <div className="flex justify-start">
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-none px-4 py-2 flex items-center">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        </div>
                     </div>
                )}
            </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <form onSubmit={handleSendMessage} className="flex gap-2">
            <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Gemini..."
                className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
            />
            <Button type="submit" size="sm" variant="primary" className="bg-indigo-600 hover:bg-indigo-700" disabled={!inputValue.trim() || isChatLoading}>
                <Send className="w-4 h-4" />
            </Button>
        </form>
      </div>
    </div>
  );
};