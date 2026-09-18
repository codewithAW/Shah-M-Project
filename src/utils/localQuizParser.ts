import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import Tesseract from 'tesseract.js';

// Setup PDF.js worker using CDN to avoid Vite build issues with the local worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface DraftOption {
  option_text: string;
  is_correct: boolean;
}

export interface DraftQuestion {
  id?: string;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'written';
  question_text: string;
  marks: number;
  options?: DraftOption[];
  expected_answer?: string;
  explanation?: string;
  validationWarning?: string;
}

export async function extractTextFromFile(
  file: File, 
  onProgress: (status: string, progress: number) => void
): Promise<string> {
  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  
  if (isPDF) {
    onProgress("Loading PDF...", 0);
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress(`Processing Page ${i} of ${pdf.numPages}`, (i / pdf.numPages) * 50);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      
      // If the page has very little selectable text, it might be a scanned image
      if (pageText.trim().length < 50) {
        onProgress(`OCR on Page ${i}...`, 50 + ((i / pdf.numPages) * 50));
        
        const scale = 2.0; // Higher scale for better OCR
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context!, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/png');
        
        const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              onProgress(`OCR Page ${i}: ${Math.round(m.progress * 100)}%`, 50 + ((i / pdf.numPages) * 50));
            }
          }
        });
        fullText += text + "\n\n";
      } else {
        // Native PDF text often lacks good line breaks, let's try to preserve them somewhat
        let pageString = "";
        let lastY = -1;
        
        for (const item of textContent.items) {
          // If Y changes significantly, it's a new line
          if (lastY !== -1 && Math.abs(lastY - item.transform[5]) > 5) {
            pageString += "\n";
          } else if (lastY !== -1) {
            // Same line, add a space to separate items
            pageString += " ";
          }
          pageString += item.str;
          lastY = item.transform[5];
        }
        fullText += pageString + "\n\n";
      }
    }
    
    return fullText;
  } else {
    // Image file
    onProgress("Starting OCR...", 0);
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          onProgress(`Extracting Text...`, Math.round(m.progress * 100));
        }
      }
    });
    return text;
  }
}

export async function parseQuestions(text: string): Promise<DraftQuestion[]> {
  const questions: DraftQuestion[] = [];
  
  // 1. Pre-process text to extract answer keys globally
  // Looks for patterns like "1. A", "1-B", "Q1: C", "1 A" (at word boundaries)
  const answerKeyMap: Record<number, string> = {};
  const answerKeyRegex = /(?:^|\b|Q)(\d+)[\.\-\:\s]+([A-Ea-e])(?=\b|\s|$|,)/gi;
  let match;
  while ((match = answerKeyRegex.exec(text)) !== null) {
    answerKeyMap[parseInt(match[1])] = match[2].toUpperCase();
  }

  // Normalize text
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Relaxed regex: matches "1. What", "1 What", "Q1. What", "Question 1: What", etc.
  const questionStartRegex = /^(?:[Qq]uestion\s*|Q\s*)?(\d+)(?:[\.\)\-\:]\s*|\s+)(.+)/i;
  
  // Option regex: matches "A.", "a)", "(A)", "A- "
  const optionRegex = /^(?:\(?([A-Fa-f])[\.\)\-])\s*(.+)/;
  
  let currentQ: DraftQuestion | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Ignore lines that are purely answer keys (e.g. "1. B") so they don't get parsed as questions
    if (/^(\d+)[\.\-\:\s]+([A-Ea-e])$/i.test(line)) {
      continue;
    }

    const qMatch = line.match(questionStartRegex);
    if (qMatch) {
      if (currentQ) finalizeAndPush(currentQ, questions);
      
      // Check for inline options: "1. What is X? A) Y B) Z"
      const inlineOptionRegex = /(?:\(?([A-Fa-f])[\.\)\-])\s+/g;
      const matches = [...line.matchAll(inlineOptionRegex)];
      
      if (matches.length >= 2) {
        // Inline options found
        const firstOptIndex = matches[0].index!;
        const qText = line.substring(0, firstOptIndex).replace(/^(?:[Qq]uestion\s*|Q\s*)?(\d+)(?:[\.\)\-\:]\s*|\s+)/i, '').trim();
        
        currentQ = {
          question_type: 'mcq',
          question_text: qText,
          marks: 1,
          options: []
        };
        
        let lastIdx = firstOptIndex;
        for (let j = 1; j <= matches.length; j++) {
          const nextIdx = j < matches.length ? matches[j].index! : line.length;
          const optFullText = line.substring(lastIdx, nextIdx).trim();
          const optTextMatch = optFullText.match(/^(?:\(?([A-Fa-f])[\.\)\-])\s*(.+)/);
          if (optTextMatch) {
            currentQ.options!.push({ option_text: optTextMatch[2].trim(), is_correct: false });
          }
          lastIdx = nextIdx;
        }
      } else {
        currentQ = {
          question_type: 'short_answer', 
          question_text: qMatch[2],
          marks: 1,
        };
      }
      continue;
    }
    
    if (currentQ) {
      const optMatch = line.match(optionRegex);
      if (optMatch) {
        if (currentQ.question_type !== 'mcq') {
          currentQ.question_type = 'mcq';
          currentQ.options = [];
        }
        currentQ.options!.push({ option_text: optMatch[2].trim(), is_correct: false });
      } else {
        // Append to question text or last option
        if (currentQ.question_type === 'mcq' && currentQ.options && currentQ.options.length > 0) {
          const lastOpt = currentQ.options[currentQ.options.length - 1];
          lastOpt.option_text += '\n' + line;
        } else {
          currentQ.question_text += '\n' + line;
        }
      }
    }
  }
  
  if (currentQ) finalizeAndPush(currentQ, questions);

  // Post-process
  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    
    // Map extracted answer keys
    if (q.question_type === 'mcq' && q.options && answerKeyMap[qNum]) {
      const targetChar = answerKeyMap[qNum];
      const optIndex = targetChar.charCodeAt(0) - 65; // A=0, B=1...
      if (q.options[optIndex]) {
        q.options[optIndex].is_correct = true;
      }
    } 
    
    if (q.question_type === 'mcq' && q.options) {
      if (!q.options.some(o => o.is_correct)) {
        q.validationWarning = "Answer not found — teacher verification required.";
      }
    }
  });

  return questions;
}

function finalizeAndPush(q: DraftQuestion, arr: DraftQuestion[]) {
  // Clean up
  q.question_text = q.question_text.trim();
  if (q.options) {
    q.options = q.options.filter(o => o.option_text.trim().length > 0);
  }
  
  // Assign UUID for UI rendering
  q.id = Math.random().toString(36).substring(2, 9);
  
  arr.push(q);
}

export async function parseQuestionsWithAI(text: string, apiKey: string): Promise<DraftQuestion[]> {
  const prompt = `You are an expert quiz parser and generator.
I will provide you with text extracted from a PDF or image.
If the text contains explicit multiple choice questions, extract them exactly as is, with zero mistakes. Ensure you identify the correct option if it is marked or implied. If not marked, just leave it as false.
If the text is just study notes, paragraphs, or general information, generate a high-quality quiz based on the notes.

Return ONLY a valid JSON array of objects matching this exact format:
[
  {
    "question_type": "mcq",
    "question_text": "...",
    "marks": 1,
    "explanation": "...",
    "options": [
      { "option_text": "...", "is_correct": true }
    ],
    "expected_answer": "..."
  }
]
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }, { text: `TEXT TO PROCESS:\n\n${text}` }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    
    if (!response.ok) {
       throw new Error(`Gemini API Error: ${await response.text()}`);
    }
    
    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const questions = JSON.parse(rawText);
    
    questions.forEach((q: any) => {
       q.id = Math.random().toString(36).substring(2, 9);
    });
    
    return questions;
  } catch (err: any) {
    throw new Error("Failed to process with AI: " + err.message);
  }
}


