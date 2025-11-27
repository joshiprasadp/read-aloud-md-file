export interface MarkdownFile {
  name: string;
  content: string;
}

export interface SpeechState {
  isPlaying: boolean;
  isPaused: boolean;
  currentWordIndex: number; // Character index in the full text
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}