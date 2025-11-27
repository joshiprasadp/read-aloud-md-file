import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
  content: string;
  maxWidth: string;
  currentWordIndex: number;
  isPlaying: boolean;
  onWordClick: (index: number) => void;
}

export interface MarkdownViewerRef {
  getInnerText: () => string;
}

export const MarkdownViewer = forwardRef<MarkdownViewerRef, MarkdownViewerProps>(
  ({ content, maxWidth, currentWordIndex, isPlaying, onWordClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const highlightRef = useRef<HTMLElement | null>(null);

    // Expose innerText to parent for SpeechSynthesis
    useImperativeHandle(ref, () => ({
      getInnerText: () => {
        if (!containerRef.current) return '';
        // innerText approximates what the user sees and what the speech engine reads best
        return containerRef.current.innerText;
      }
    }));

    // Handle Highlighting
    useEffect(() => {
      if (!containerRef.current) return;

      // Cleanup previous highlight
      if (highlightRef.current) {
        const parent = highlightRef.current.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(highlightRef.current.textContent || ''), highlightRef.current);
          parent.normalize(); // Merge adjacent text nodes
        }
        highlightRef.current = null;
      }

      if (currentWordIndex < 0 || !isPlaying) return;

      // Walk the DOM to find the text node at currentWordIndex
      const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT, null);
      let currentNode = walker.nextNode();
      let charCount = 0;

      while (currentNode) {
        const nodeValue = currentNode.nodeValue || '';
        const nodeLength = nodeValue.length;

        // We use a heuristic here: InnerText usually maps closely to TextNodes, but block elements add 'virtual' newlines.
        // If the speech index is far ahead, we might need to skip ahead. 
        // For now, we assume a close mapping. A production-grade solution would need a robust DOM-to-Text map.
        
        if (charCount + nodeLength > currentWordIndex) {
          // The target word starts in this node (or we successfully landed on it)
          const offset = Math.max(0, currentWordIndex - charCount);
          
          // Find the end of the word for highlighting
          const remainingText = nodeValue.substring(offset);
          const match = remainingText.match(/^\w+/); // Match word characters at start
          const wordLength = match ? match[0].length : 1; 

          if (offset + wordLength <= nodeValue.length) {
            const range = document.createRange();
            range.setStart(currentNode, offset);
            range.setEnd(currentNode, offset + wordLength);

            const mark = document.createElement('mark');
            mark.className = 'tts-highlight';
            
            try {
                range.surroundContents(mark);
                highlightRef.current = mark;
                
                // Auto-scroll into view
                mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch (e) {
                // Ignore complex range errors (can happen if range spans nodes)
                console.debug('Highlight range error', e);
            }
          }
          break;
        }

        // Heuristic: Add +1 for potential newline if this text node is at end of a block? 
        // This is tricky. For now, we just sum text lengths.
        charCount += nodeLength;
        currentNode = walker.nextNode();
      }
    }, [currentWordIndex, isPlaying, content]); // Re-run if content changes or index updates

    // Handle Click to Seek
    const handleContainerClick = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        
        // Use Selection API to find where we clicked
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const clickedNode = range.startContainer;
        
        // Ensure we clicked inside our viewer
        if (!containerRef.current.contains(clickedNode)) return;

        // Only handle text node clicks directly (or close wrappers)
        if (clickedNode.nodeType !== Node.TEXT_NODE && clickedNode.nodeType !== Node.ELEMENT_NODE) return;

        // Calculate global offset
        let offset = 0;
        const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT, null);
        let currentNode = walker.nextNode();
        
        let found = false;
        while (currentNode) {
            if (currentNode === clickedNode || currentNode === range.startContainer) {
                offset += range.startOffset;
                found = true;
                break;
            }
            offset += (currentNode.nodeValue?.length || 0);
            currentNode = walker.nextNode();
        }

        if (found) {
            onWordClick(offset);
        }
    };

    return (
      <div className={`mx-auto transition-all duration-300 ease-in-out ${maxWidth}`}>
        <div 
            ref={containerRef}
            onClick={handleContainerClick}
            className="prose prose-invert prose-lg w-full max-w-none p-6 md:p-10 bg-gray-900 rounded-xl shadow-lg border border-gray-800 min-h-[500px] cursor-text"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }
);

MarkdownViewer.displayName = 'MarkdownViewer';