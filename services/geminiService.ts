import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// Note: process.env.API_KEY is expected to be available in the build environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSummary = async (text: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: `Please provide a concise summary (max 3 sentences) of the following markdown content. Focus on the key takeaways.\n\nContent:\n${text}`,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to Gemini API. Please check your API key.";
  }
};

export const chatWithDocument = async (documentContent: string, question: string, history: {role: string, parts: {text: string}[]}[] = []): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash';
        
        // We start a chat session with the document as context in the system instruction or first message
        // Ideally we use system instruction for context
        const chat = ai.chats.create({
            model,
            config: {
                systemInstruction: `You are a helpful assistant. You have access to the following document content. Answer the user's questions based strictly on this document.\n\nDocument Content:\n${documentContent}`
            },
            history: history.map(h => ({
                role: h.role,
                parts: h.parts
            }))
        });

        const response = await chat.sendMessage({ message: question });
        return response.text || "No response generated.";

    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "Error processing your request.";
    }
}
