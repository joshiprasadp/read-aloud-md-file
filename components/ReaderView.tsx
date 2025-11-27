import React, { useMemo, useEffect, useRef } from 'react';

interface ReaderViewProps {
  content: string;
  currentWordIndex: number; // The character index from speech synthesis
  onWordClick: (index: number) => void;
  maxWidth: string;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ content, currentWordIndex, onWordClick, maxWidth }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // We split the text into words/tokens to make them clickable.
  const tokenizedContent = useMemo(() => {
    let regex = /([\s\S]+?)([\s]+|$)/g; 
    let match;
    const wordRegex = /\S+/g;
    let lastIndex = 0;
    
    const elements = [];
    
    while ((match = wordRegex.exec(content)) !== null) {
        const start = match.index;
        const end = match.index + match[0].length;
        const text = match[0];
        
        // Push preceding whitespace
        if (start > lastIndex) {
            elements.push({
                text: content.substring(lastIndex, start),
                index: lastIndex,
                isWord: false
            });
        }
        
        // Push word
        elements.push({
            text: text,
            index: start,
            isWord: true
        });
        
        lastIndex = end;
    }
    
    // Trailing whitespace
    if (lastIndex < content.length) {
        elements.push({
            text: content.substring(lastIndex),
            index: lastIndex,
            isWord: false
        });
    }
    
    return elements;
  }, [content]);

  // Auto-scroll logic
  useEffect(() => {
      if (activeWordRef.current && containerRef.current) {
          const container = containerRef.current;
          const highlightEl = activeWordRef.current;
          
          const offsetTop = highlightEl.offsetTop;
          const containerHeight = container.clientHeight;
          const scrollTop = container.scrollTop;

          // Scroll if out of the comfortable middle zone
          if (offsetTop > scrollTop + containerHeight * 0.6 || offsetTop < scrollTop + containerHeight * 0.1) {
              highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [currentWordIndex]);

  // Helper to check if a token contains the current index
  const isActive = (start: number, text: string) => {
    return currentWordIndex >= start && currentWordIndex < start + text.length;
  };

  return (
    <div className={`mx-auto transition-all duration-300 ease-in-out ${maxWidth}`}>
        <div 
            ref={containerRef}
            className="h-[calc(100vh-300px)] min-h-[500px] overflow-y-auto p-8 md:p-12 bg-gray-900 rounded-xl shadow-inner border border-gray-800 text-lg md:text-xl leading-loose font-serif text-gray-300"
        >
            {tokenizedContent.map((token, i) => {
                if (!token.isWord) {
                    return <span key={i} className="whitespace-pre">{token.text}</span>;
                }
                
                const active = isActive(token.index, token.text);
                
                return (
                    <span
                        key={i}
                        ref={active ? activeWordRef : null}
                        onClick={() => onWordClick(token.index)}
                        className={`
                            cursor-pointer rounded px-0.5 transition-colors duration-100
                            hover:bg-gray-700 hover:text-white
                            ${active ? 'bg-yellow-500 text-gray-900 font-bold scale-105 shadow-sm' : ''}
                        `}
                    >
                        {token.text}
                    </span>
                );
            })}
        </div>
    </div>
  );
};