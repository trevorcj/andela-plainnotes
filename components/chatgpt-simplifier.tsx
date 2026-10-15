'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  ArrowUp,
  Plus,
  ChevronDown,
  Volume2,
  VolumeX,
  Share2,
  Copy,
  Check,
  Download,
  Bookmark,
  BookmarkCheck,
  FileText,
  FileSpreadsheet,
  Globe,
  Radio,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  BookOpen,
  MessageSquare,
  HelpCircle,
  X,
  Laptop,
  Coins,
  Brain,
  Shield,
  UploadCloud,
  CheckCircle2,
  Circle,
  Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import { SimplifiedNote, SocraticQuiz, SUPPORTED_LANGUAGES, LanguageCode, ChatTurn } from '@/lib/types/plainnotes';
import { CURATED_AFRICAN_NOTES } from '@/lib/curated-notes';
import { createClient } from '@/lib/supabase/client';
import { extractTextFromPdfFile } from '@/lib/pdf-client';

const QUIZ_STORAGE_KEY = 'plainnotes_quiz_persistence_v2';

function getNoteTurns(note: SimplifiedNote): ChatTurn[] {
  if (note.turns && note.turns.length > 0) {
    return note.turns;
  }
  return [
    {
      id: `${note.id}-turn-0`,
      userPrompt: note.originalText || note.title,
      simplifiedText: note.simplifiedText,
      localAnalogy: note.localAnalogy,
      examEssentials: note.examEssentials,
      quizzes: note.quizzes && note.quizzes.length > 0 ? note.quizzes : (note.quiz ? [note.quiz] : []),
      createdAt: note.createdAt
    }
  ];
}

interface ChatGptSimplifierProps {
  onSaveNote: (note: SimplifiedNote) => void;
  savedNotes: SimplifiedNote[];
  activeNote: SimplifiedNote | null;
  onActiveNoteChange: (note: SimplifiedNote | null) => void;
  recentNotes: SimplifiedNote[];
  onRequestLoginModal?: () => void;
}

export function ChatGptSimplifier({
  onSaveNote,
  savedNotes,
  activeNote,
  onActiveNoteChange,
  recentNotes,
  onRequestLoginModal
}: ChatGptSimplifierProps) {
  const [inputText, setInputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('pidgin');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const dockedPlusMenuRef = useRef<HTMLDivElement>(null);

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const [dockedLangMenuOpen, setDockedLangMenuOpen] = useState(false);
  const dockedLangMenuRef = useRef<HTMLDivElement>(null);

  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    type: string;
    base64?: string;
    textPreview?: string;
  } | null>(null);

  const [submittedFile, setSubmittedFile] = useState<{
    name: string;
    type: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rootTextareaRef = useRef<HTMLTextAreaElement>(null);
  const dockedTextareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(Math.max(el.scrollHeight, 28), 200);
    el.style.height = `${nextHeight}px`;
  };

  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [checkedEssentials, setCheckedEssentials] = useState<Record<string, boolean>>({});

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<number | null>(null);
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [quotedText, setQuotedText] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState([
    {
      icon: Laptop,
      title: 'Break down Object-Oriented Programming (OOP) classes and objects',
      text: 'Explain Object-Oriented Programming classes, objects, and encapsulation in clear plain words.'
    },
    {
      icon: Coins,
      title: 'Demystify Inflation, Monetary Policy, and Currency Valuation',
      text: 'How does government printing money and central bank interest rate cause market prices to increase?'
    },
    {
      icon: Brain,
      title: 'Clarify Neuroplasticity and Memory Consolidation for exams',
      text: 'Explain how the brain forms long-term memories and adapts to new habits during exam prep.'
    },
    {
      icon: Shield,
      title: 'Unpack Asymmetric Cryptography and Public-Private Key encryption',
      text: 'Break down how public and private key pairs keep passwords and bank payments secure.'
    }
  ]);

  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);
  const [snippetTooltipPos, setSnippetTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const recognitionRef = useRef<any>(null);
  const baseSpeechTextRef = useRef('');

  const [animatingTurnId, setAnimatingTurnId] = useState<string | null>(null);
  const [typedTurnText, setTypedTurnText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [collapsedQuizzes, setCollapsedQuizzes] = useState<Record<string, boolean>>({});

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animatingTurnId || !activeNote) {
      setIsTyping(false);
      setTypedTurnText('');
      return;
    }
    const turns = getNoteTurns(activeNote);
    const turn = turns.find(t => t.id === animatingTurnId);
    if (!turn || !turn.simplifiedText) {
      setIsTyping(false);
      setTypedTurnText('');
      setAnimatingTurnId(null);
      return;
    }

    const fullText = turn.simplifiedText;
    setIsTyping(true);
    setTypedTurnText('');

    const words = fullText.split(' ');
    let wordIdx = 0;
    const interval = setInterval(() => {
      wordIdx += 3;
      if (wordIdx < words.length) {
        setTypedTurnText(words.slice(0, wordIdx).join(' '));
      } else {
        setTypedTurnText(fullText);
        setIsTyping(false);
        setAnimatingTurnId(null);
        clearInterval(interval);
      }
    }, 24);

    return () => {
      clearInterval(interval);
      setIsTyping(false);
    };
  }, [animatingTurnId, activeNote]);

  useEffect(() => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeNote?.turns?.length, loading, isTyping]);

  useEffect(() => {
    if (!activeNote?.id) return;
    try {
      const stored = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[activeNote.id]) {
          setQuizAnswers(parsed[activeNote.id].answers || {});
          setCheckedEssentials(parsed[activeNote.id].checked || {});
          return;
        }
      }
    } catch (err) {
      console.warn('Quiz restore error:', err);
    }
    setQuizAnswers({});
    setCheckedEssentials({});
  }, [activeNote?.id]);

  const persistQuizState = (answers: Record<string, number>, checked: Record<string, boolean>) => {
    if (!activeNote?.id) return;
    try {
      const stored = localStorage.getItem(QUIZ_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      parsed[activeNote.id] = { answers, checked };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(parsed));
    } catch (err) {
      console.warn('Quiz save error:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (plusMenuRef.current && !plusMenuRef.current.contains(target)) {
        setPlusMenuOpen(false);
      }
      if (dockedPlusMenuRef.current && !dockedPlusMenuRef.current.contains(target)) {
        setPlusMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setLangMenuOpen(false);
      }
      if (dockedLangMenuRef.current && !dockedLangMenuRef.current.contains(target)) {
        setDockedLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setSelectedSnippet(null);
        setSnippetTooltipPos(null);
        return;
      }
      const text = selection.toString().trim();
      if (!text || text.length < 5 || text.length > 300) {
        setSelectedSnippet(null);
        setSnippetTooltipPos(null);
        return;
      }

      const anchorNode = selection.anchorNode;
      const element =
        anchorNode?.nodeType === Node.ELEMENT_NODE
          ? (anchorNode as Element)
          : anchorNode?.parentElement;
      const aiContainer = element?.closest('[data-ai-response="true"]');
      if (!aiContainer) {
        setSelectedSnippet(null);
        setSnippetTooltipPos(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        setSelectedSnippet(text);
        setSnippetTooltipPos({
          x: rect.left + rect.width / 2,
          y: rect.top - 12
        });
        return;
      }

      setSelectedSnippet(null);
      setSnippetTooltipPos(null);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target?.closest?.('[data-snippet-tooltip="true"]')) {
        setSelectedSnippet(null);
        setSnippetTooltipPos(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalChunk = '';
          let interimChunk = '';
          for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalChunk += event.results[i][0].transcript;
            } else {
              interimChunk += event.results[i][0].transcript;
            }
          }
          const spoken = (finalChunk + ' ' + interimChunk).trim();
          const base = baseSpeechTextRef.current;
          const combined = base ? `${base} ${spoken}` : spoken;
          setInputText(combined);
          autoResizeTextarea(rootTextareaRef.current);
          autoResizeTextarea(dockedTextareaRef.current);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleVoiceDictation = () => {
    if (!recognitionRef.current) {
      toast.error('Voice dictation is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        baseSpeechTextRef.current = inputText;
        recognitionRef.current.start();
        setIsListening(true);
        toast.info('Listening... speak clearly');
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPlusMenuOpen(false);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          type: 'image',
          base64: reader.result as string
        });
        toast.success(`Attached photo: ${file.name}`);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const toastId = toast.loading(`Reading PDF: ${file.name}...`);
      try {
        const result = await extractTextFromPdfFile(file);
        if (result.text && result.text.length >= 30) {
          setAttachedFile({
            name: file.name,
            type: 'pdf',
            textPreview: result.text
          });
          toast.success(
            `Attached ${file.name} (${result.wordCount.toLocaleString()} words extracted)`,
            { id: toastId }
          );
        } else {
          // If no text could be extracted (scanned PDF / image-only)
          if (file.size > 3.5 * 1024 * 1024) {
            toast.error(
              'This PDF appears to be a scanned image and exceeds 3.5MB. Please take a photo of the page and attach it as an image, or upload a digital PDF.',
              { id: toastId }
            );
          } else {
            const reader = new FileReader();
            reader.onload = () => {
              setAttachedFile({
                name: file.name,
                type: 'pdf',
                base64: reader.result as string
              });
              toast.info(`Attached PDF (${(file.size / (1024 * 1024)).toFixed(1)}MB)`, { id: toastId });
            };
            reader.readAsDataURL(file);
          }
        }
      } catch (pdfErr) {
        console.warn('PDF client read error:', pdfErr);
        if (file.size <= 3.5 * 1024 * 1024) {
          const reader = new FileReader();
          reader.onload = () => {
            setAttachedFile({
              name: file.name,
              type: 'pdf',
              base64: reader.result as string
            });
            toast.success(`Attached PDF: ${file.name}`, { id: toastId });
          };
          reader.readAsDataURL(file);
        } else {
          toast.error('Could not read PDF. Please copy and paste the text or select a smaller PDF.', { id: toastId });
        }
      }
    } else if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        setAttachedFile({
          name: file.name,
          type: 'text',
          textPreview: content.slice(0, 15000)
        });
        toast.success(`Attached notes: ${file.name}`);
      };
      reader.readAsText(file);
    } else {
      setAttachedFile({
        name: file.name,
        type: 'document'
      });
      toast.success(`Attached document: ${file.name}`);
    }
    e.target.value = '';
  };

  const handleSimplify = async (textToSubmit?: string) => {
    const userTyped = textToSubmit || inputText;
    const promptToSend = userTyped.trim() || (attachedFile ? `Simplify and explain key concepts in attached document: "${attachedFile.name}"` : '');

    if (!promptToSend.trim() && !attachedFile?.base64 && !attachedFile?.textPreview) {
      toast.error('Please type a concept or attach a document/photo.');
      return;
    }

    const currentQuote = quotedText;
    const currentFile = attachedFile;
    const userDisplayPrompt = currentQuote ? `Regarding "${currentQuote}": ${promptToSend}` : promptToSend;
    const apiPayloadText = currentQuote
      ? `Regarding "${currentQuote}": ${promptToSend}${currentFile?.textPreview ? `\n\nAttached Document Content:\n${currentFile.textPreview}` : ''}`
      : `${promptToSend}${currentFile?.textPreview ? `\n\nAttached Document Content:\n${currentFile.textPreview}` : ''}`;

    setSubmittedPrompt(userDisplayPrompt);
    setSubmittedFile(currentFile ? { name: currentFile.name, type: currentFile.type } : null);
    setLoading(true);
    setInputText('');
    setAttachedFile(null);
    setQuotedText(null);

    if (rootTextareaRef.current) rootTextareaRef.current.style.height = 'auto';
    if (dockedTextareaRef.current) dockedTextareaRef.current.style.height = 'auto';

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const priorTurns = activeNote ? getNoteTurns(activeNote) : [];
      const history = priorTurns.flatMap(t => [
        { role: 'user' as const, content: t.userPrompt },
        { role: 'assistant' as const, content: t.simplifiedText }
      ]);

      const res = await fetch('/api/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: apiPayloadText,
          language: selectedLanguage,
          history: history.length > 0 ? history : undefined,
          imageBase64: currentFile?.type === 'image' ? currentFile.base64 : undefined,
          pdfBase64: currentFile?.type === 'pdf' && !currentFile.textPreview ? currentFile.base64 : undefined
        })
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        if (res.status === 413) {
          toast.error('The attached file is too large for the network. Please paste the text or select a smaller excerpt.');
          return;
        }
        if (res.status === 504) {
          toast.error('The request timed out. Please try a shorter excerpt or paste the key paragraphs.');
          return;
        }
        toast.error(`Server error (${res.status}). Please try again or paste the text.`);
        return;
      }

      if (!res.ok || !data?.success || !data?.note) {
        toast.error(data?.error || 'Unable to simplify note. Please try again.');
        return;
      }

      const turnId = `turn-${Date.now()}`;
      const newTurn: ChatTurn = {
        id: turnId,
        userPrompt: userDisplayPrompt,
        attachedFile: currentFile ? { name: currentFile.name, type: currentFile.type } : null,
        quotedText: currentQuote,
        simplifiedText: data.note.simplifiedText,
        localAnalogy: data.note.localAnalogy,
        examEssentials: data.note.examEssentials,
        quizzes: data.note.quizzes || (data.note.quiz ? [data.note.quiz] : []),
        createdAt: new Date().toISOString()
      };

      if (activeNote) {
        const updatedTurns = [...priorTurns, newTurn];
        const isLocalNote = recentNotes.some(n => n.id === activeNote.id) || savedNotes.some(n => n.id === activeNote.id);
        const currentUser = await getLoggedInUser();
        const isOwner = isLocalNote || Boolean(currentUser?.id && activeNote.userId === currentUser.id);

        if (!isOwner) {
          // Shared note being viewed by a guest or another learner:
          // Fork to a new local session so asking questions never affects the original owner's note
          const forkedNoteId = crypto.randomUUID();
          const forkedNote: SimplifiedNote = {
            ...activeNote,
            id: forkedNoteId,
            userId: currentUser?.id || null,
            simplifiedText: data.note.simplifiedText,
            localAnalogy: data.note.localAnalogy,
            examEssentials: data.note.examEssentials,
            quizzes: data.note.quizzes,
            turns: updatedTurns
          };
          onActiveNoteChange(forkedNote);
        } else {
          const updatedNote: SimplifiedNote = {
            ...activeNote,
            simplifiedText: data.note.simplifiedText,
            localAnalogy: data.note.localAnalogy,
            examEssentials: data.note.examEssentials,
            quizzes: data.note.quizzes,
            turns: updatedTurns
          };
          onActiveNoteChange(updatedNote);
        }
      } else {
        const fullNote: SimplifiedNote = {
          ...data.note,
          turns: [newTurn]
        };
        onActiveNoteChange(fullNote);
      }

      setAnimatingTurnId(turnId);
    } catch (err: any) {
      console.error('Simplification error:', err);
      const isNetworkErr = err?.name === 'TypeError' || (err?.message && err.message.toLowerCase().includes('failed to fetch'));
      toast.error(
        isNetworkErr
          ? 'Network connection issue. Please check your internet connection and retry.'
          : (err?.message || 'Unable to simplify note. Please try again.')
      );
    } finally {
      setLoading(false);
      setSubmittedPrompt(null);
      setSubmittedFile(null);
    }
  };

  const handleToggleAudio = (turn?: ChatTurn) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Audio narration is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const currentTurn = turn || (activeNote ? getNoteTurns(activeNote).slice(-1)[0] : null);
    if (!currentTurn) return;

    window.speechSynthesis.cancel();
    const narrationText = `${activeNote?.title || 'Explanation'}. In plain words: ${currentTurn.simplifiedText}. Everyday analogy: ${currentTurn.localAnalogy || ''}`;
    const utterance = new SpeechSynthesisUtterance(narrationText);

    if (selectedLanguage === 'french') utterance.lang = 'fr-FR';
    else if (selectedLanguage === 'swahili') utterance.lang = 'sw-KE';
    else utterance.lang = 'en-US';

    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    toast.info('Audio playing');
  };

  const handleCopy = (turn?: ChatTurn) => {
    const currentTurn = turn || (activeNote ? getNoteTurns(activeNote).slice(-1)[0] : null);
    if (!currentTurn) return;
    navigator.clipboard.writeText(`${activeNote?.title || 'Note'}\n\n${currentTurn.simplifiedText}\n\nAnalogy:\n${currentTurn.localAnalogy || ''}`);
    setHasCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const checkUserLoggedIn = (): boolean => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('plainnotes_active_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.isLoggedIn && parsed?.email) return true;
        }
      } catch {}
    }
    return false;
  };

  const getLoggedInUser = async () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('plainnotes_active_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.isLoggedIn && parsed?.email) {
            return { email: parsed.email, name: parsed.name, id: parsed.id || parsed.email };
          }
        }
      } catch {}
    }
    const supabase = createClient();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          return { email: user.email, name: user.user_metadata?.name || user.email?.split('@')[0], id: user.id };
        }
      } catch {}
    }
    return null;
  };

  const handleSaveClick = (note: SimplifiedNote) => {
    if (!checkUserLoggedIn()) {
      toast.info('Please log in or sign up to save notes to your vault');
      onRequestLoginModal?.();
      return;
    }
    onSaveNote(note);
  };

  const handleShare = async () => {
    if (!activeNote) return;
    const user = await getLoggedInUser();
    if (!user) {
      toast.info('Please log in or sign up to share this note link');
      onRequestLoginModal?.();
      return;
    }

    // Sync note to Supabase plain_notes with is_curated: true so anyone with the link can view it
    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.from('plain_notes').insert({
          id: activeNote.id,
          title: activeNote.title,
          subject: activeNote.subject,
          language: activeNote.language,
          level: activeNote.level,
          original_text: activeNote.originalText || activeNote.title,
          simplified_text: activeNote.simplifiedText,
          local_analogy: activeNote.localAnalogy,
          exam_essentials: activeNote.examEssentials || [],
          quiz: {
            ...(activeNote.quiz || {}),
            storedTurns: activeNote.turns || []
          },
          whatsapp_text: activeNote.whatsappText || '',
          is_curated: true
        });
      } catch (err) {
        console.warn('Share note sync error:', err);
      }
    }

    const shareUrl = `${window.location.origin}/app?note=${activeNote.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Shareable link copied to clipboard!');
  };

  const handleDownloadPdf = (turn?: ChatTurn) => {
    if (typeof window === 'undefined' || !activeNote) return;

    const currentTurn = turn || (activeNote ? getNoteTurns(activeNote).slice(-1)[0] : null);
    const question = currentTurn ? currentTurn.userPrompt : (submittedPrompt || activeNote.originalText || activeNote.title);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const safeTitle = (activeNote.title || 'PlainNotes Summary').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeQuestion = question.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeResponse = (currentTurn?.simplifiedText || activeNote.simplifiedText).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeAnalogy = (currentTurn?.localAnalogy || activeNote.localAnalogy || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeTitle} - PlainNotes</title>
  <style>
    @page { margin: 20mm 16mm; size: auto; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #09090b;
      margin: 0;
      padding: 32px 24px;
      line-height: 1.65;
      max-width: 760px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 2px solid #e4e4e7;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 20px;
      font-weight: 700;
      color: #09090b;
      letter-spacing: -0.02em;
    }
    .date {
      font-size: 12px;
      color: #71717a;
    }
    .label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #71717a;
      margin-bottom: 8px;
    }
    .prompt-box {
      background: #f4f4f5;
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 14px;
      color: #18181b;
      margin-bottom: 28px;
      border: 1px solid #e4e4e7;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #09090b;
      margin-bottom: 14px;
    }
    .response-box {
      font-size: 15px;
      color: #18181b;
      line-height: 1.75;
      white-space: pre-wrap;
      margin-bottom: 24px;
    }
    .analogy-box {
      border-left: 3px solid #3b82f6;
      background: #eff6ff;
      border-radius: 6px;
      padding: 14px 18px;
      font-size: 14px;
      color: #1e40af;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">PlainNotes</div>
    <div class="date">${new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
  </div>
  <div class="label">Question Asked</div>
  <div class="prompt-box">${safeQuestion}</div>
  <div class="title">${safeTitle}</div>
  <div class="label">AI Simplification</div>
  <div class="response-box">${safeResponse}</div>
  ${safeAnalogy ? `<div class="label" style="margin-top: 24px;">Everyday Analogy</div><div class="analogy-box">${safeAnalogy}</div>` : ''}
</body>
</html>`);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const isNoteSaved = activeNote ? savedNotes.some(n => n.id === activeNote.id) : false;

  const currentLangMeta =
    SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const questionsList: SocraticQuiz[] =
    activeNote?.quizzes && activeNote.quizzes.length >= 3
      ? activeNote.quizzes.slice(0, 10)
      : activeNote?.quiz
      ? [
          activeNote.quiz,
          {
            question: 'What is the primary governing factor of this process?',
            options: ['Input condition', 'Random fluctuation', 'Ambient air only', 'Measurement duration'],
            answerIndex: 0,
            explanation: 'The output directly depends upon the input condition according to core scientific principles.'
          },
          {
            question: 'Which of the following would cause this system to fail?',
            options: ['Input disconnection or zero energy', 'Steady temperature', 'Uniform pressure', 'Proper calibration'],
            answerIndex: 0,
            explanation: 'Without input energy or connectivity, the underlying mechanism cannot initiate.'
          }
        ]
      : [];

  const answeredCount = Object.keys(quizAnswers).length;
  const correctCount = Object.entries(quizAnswers).filter(
    ([idx, ans]) => questionsList[Number(idx)]?.answerIndex === ans
  ).length;

  const isChatActive = Boolean(activeNote || submittedPrompt || loading);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.txt,.pdf"
        style={{ display: 'none' }}
      />

      <style>{`
        @keyframes thinkingFade {
          0%, 100% { opacity: 0.35; transform: scale(0.99); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeSlideDown {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes blinkCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .plainnotes-thinking-text {
          animation: thinkingFade 1.6s ease-in-out infinite;
        }
        .plainnotes-fade-down {
          animation: fadeSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .plainnotes-cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blinkCursor 0.8s infinite;
          color: #2563eb;
          font-weight: 700;
        }
      `}</style>

      {snippetTooltipPos && selectedSnippet && isChatActive && (
        <div
          data-snippet-tooltip="true"
          style={{
            position: 'fixed',
            left: snippetTooltipPos.x,
            top: snippetTooltipPos.y,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(9, 9, 11, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 9999,
            padding: '7px 16px',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.25)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            userSelect: 'none',
            whiteSpace: 'nowrap'
          }}
          onMouseDown={e => e.stopPropagation()}
          onClick={() => {
            setQuotedText(selectedSnippet);
            setSelectedSnippet(null);
            setSnippetTooltipPos(null);
            if (dockedTextareaRef.current) {
              dockedTextareaRef.current.focus();
            } else if (rootTextareaRef.current) {
              rootTextareaRef.current.focus();
            }
          }}
        >
          <MessageSquare size={13} color="#93c5fd" />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Ask follow-up on this snippet</span>
        </div>
      )}

      {!isChatActive ? (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 20px 48px',
            maxWidth: 760,
            margin: '0 auto',
            width: '100%'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 36px)',
                fontWeight: 600,
                color: '#09090b',
                letterSpacing: '-0.03em',
                marginBottom: 8
              }}
            >
              What would you like simplified?
            </h1>
            <p
              style={{
                fontSize: 16,
                color: '#71717a',
                lineHeight: 1.5,
                margin: '0 auto',
                maxWidth: 580
              }}
            >
              PlainNotes is a focused academic simplifier, not a casual chatbot. Skip the greetings and enter the exact topic, concept, or exam question you want broken down.
            </p>
          </div>

          <div
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #e4e4e7',
              borderRadius: 24,
              padding: '14px 16px 12px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box'
            }}
          >
            {attachedFile && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#f4f4f5',
                  border: '1px solid #e4e4e7',
                  borderRadius: 8,
                  padding: '4px 10px',
                  marginBottom: 10,
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: '#18181b',
                  width: 'fit-content'
                }}
              >
                {attachedFile.type === 'pdf' ? (
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                    PDF
                  </span>
                ) : attachedFile.type === 'image' ? (
                  <span style={{ background: '#3b82f6', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                    IMG
                  </span>
                ) : (
                  <FileText size={14} style={{ color: '#71717a' }} />
                )}
                <span style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {attachedFile.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAttachedFile(null);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 2,
                    color: '#71717a',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {quotedText && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#f4f4f5',
                  borderRadius: 8,
                  padding: '6px 12px',
                  marginBottom: 10,
                  fontSize: 12.5,
                  color: '#3f3f46',
                  width: '100%'
                }}
              >
                <MessageSquare size={13} style={{ color: '#71717a', flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                  &ldquo;{quotedText}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => setQuotedText(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#71717a', display: 'grid', placeItems: 'center' }}
                  title="Remove quote"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <textarea
              ref={rootTextareaRef}
              rows={1}
              placeholder={
                quotedText
                  ? 'Ask a follow-up on quoted text...'
                  : attachedFile
                  ? 'Ask PlainNotes to simplify this document or chapter...'
                  : 'Ask PlainNotes or paste a confusing concept...'
              }
              value={inputText}
              onChange={e => {
                setInputText(e.target.value);
                autoResizeTextarea(e.target);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSimplify();
                }
              }}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: 15,
                lineHeight: 1.5,
                color: '#09090b',
                background: 'transparent',
                padding: '4px 2px',
                resize: 'none',
                overflowY: 'auto',
                minHeight: 36,
                maxHeight: 200,
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, width: '100%' }}>
              <div style={{ position: 'relative' }} ref={plusMenuRef}>
                <button
                  type="button"
                  onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: plusMenuOpen ? '#e4e4e7' : 'transparent',
                    border: 'none',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#09090b',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Add photos & files"
                >
                  <Plus size={19} />
                </button>

                {plusMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 8,
                      width: 260,
                      background: '#ffffff',
                      border: '1px solid #e4e4e7',
                      borderRadius: 14,
                      padding: 6,
                      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12)',
                      zIndex: 50
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setPlusMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: '#f4f4f5',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <Paperclip size={16} color="#09090b" />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#09090b', lineHeight: 1.2 }}>
                          Add photos & files
                        </div>
                        <div style={{ fontSize: 11, color: '#71717a' }}>
                          Upload from computer
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ position: 'relative' }} ref={langMenuRef}>
                  <button
                    type="button"
                    onClick={() => setLangMenuOpen(!langMenuOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 8px',
                      background: 'transparent',
                      border: 'none',
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: '#71717a',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    title="Change language / dialect"
                  >
                    <img
                      src={currentLangMeta.flagUrl}
                      alt={currentLangMeta.name}
                      style={{ width: 16, height: 12, objectFit: 'cover', borderRadius: 2 }}
                    />
                    <span>{currentLangMeta.name}</span>
                    <ChevronDown size={14} color="#71717a" />
                  </button>

                  {langMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        right: 0,
                        marginBottom: 8,
                        width: 230,
                        background: '#ffffff',
                        border: '1px solid #e4e4e7',
                        borderRadius: 12,
                        padding: '8px 6px',
                        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12)',
                        zIndex: 50,
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '4px 10px 8px' }}>
                        SELECT DIALECT
                      </div>
                      {SUPPORTED_LANGUAGES.map(lang => {
                        const isSelected = selectedLanguage === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              setSelectedLanguage(lang.code);
                              setLangMenuOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 8,
                              background: isSelected ? '#f4f4f5' : 'transparent',
                              color: '#09090b',
                              fontSize: 13.5,
                              fontWeight: isSelected ? 600 : 400,
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <img
                              src={lang.flagUrl}
                              alt={lang.name}
                              style={{ width: 18, height: 13, objectFit: 'cover', borderRadius: 2 }}
                            />
                            <span>{lang.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleToggleVoiceDictation}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: isListening ? '#fee2e2' : 'transparent',
                    color: isListening ? '#ef4444' : '#71717a',
                    border: 'none',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title={isListening ? 'Stop recording' : 'Dictate with voice'}
                >
                  <Mic size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => handleSimplify()}
                  disabled={loading || (!inputText.trim() && !attachedFile)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: !inputText.trim() && !attachedFile ? '#93c5fd' : '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: !inputText.trim() && !attachedFile ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                    transition: 'background 0.15s ease'
                  }}
                  title="Send message"
                >
                  <ArrowUp size={17} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestions.map((item, idx) => {
              const Icon = item.icon;
              const isHovered = hoveredSuggestion === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredSuggestion(idx)}
                  onMouseLeave={() => setHoveredSuggestion(null)}
                  onClick={() => {
                    setInputText(item.text);
                    handleSimplify(item.text);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: isHovered ? '#f4f4f5' : 'transparent',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <Icon size={18} color="#71717a" style={{ flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: 14,
                        color: isHovered ? '#09090b' : '#3f3f46',
                        fontWeight: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.title}
                    </span>
                  </div>

                  {isHovered && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setSuggestions(prev => prev.filter((_, i) => i !== idx));
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#a1a1aa',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0
                      }}
                      title="Dismiss suggestion"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 120px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 36 }}>
              {activeNote && getNoteTurns(activeNote).map((turn, turnIdx) => {
                const turnQuizzes = turn.quizzes && turn.quizzes.length > 0
                  ? turn.quizzes
                  : (turnIdx === 0 && activeNote?.quiz ? [activeNote.quiz] : []);
                const isQuizCollapsed = collapsedQuizzes[turn.id] ?? true;
                const turnAnswered = turnQuizzes.filter((_, qIdx) => quizAnswers[`${turn.id}_${qIdx}`] !== undefined).length;
                const turnCorrect = turnQuizzes.filter((q, qIdx) => quizAnswers[`${turn.id}_${qIdx}`] === q.answerIndex).length;

                return (
                  <div key={turn.id} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* User Prompt */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      {turn.attachedFile && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#f4f4f5',
                            border: '1px solid #e4e4e7',
                            borderRadius: 8,
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#27272a'
                          }}
                        >
                          {turn.attachedFile.type === 'pdf' ? (
                            <span style={{ background: '#ef4444', color: '#ffffff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                              PDF
                            </span>
                          ) : turn.attachedFile.type === 'image' ? (
                            <span style={{ background: '#3b82f6', color: '#ffffff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                              IMG
                            </span>
                          ) : (
                            <FileText size={13} style={{ color: '#71717a' }} />
                          )}
                          <span style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {turn.attachedFile.name}
                          </span>
                        </div>
                      )}

                      {turn.quotedText && (
                        <div
                          style={{
                            maxWidth: '85%',
                            background: '#f1f5f9',
                            borderLeft: '3px solid #3b82f6',
                            borderRadius: '4px 12px 12px 4px',
                            padding: '6px 12px',
                            fontSize: 12.5,
                            color: '#475569',
                            fontStyle: 'italic',
                            marginBottom: 2
                          }}
                        >
                          ↳ &ldquo;{turn.quotedText}&rdquo;
                        </div>
                      )}

                      <div
                        style={{
                          maxWidth: '85%',
                          background: '#f4f4f5',
                          borderRadius: 18,
                          padding: '12px 18px',
                          fontSize: 14.5,
                          color: '#09090b',
                          lineHeight: 1.5
                        }}
                      >
                        {turn.userPrompt}
                      </div>
                    </div>

                    {/* Assistant Response */}
                    <div className="plainnotes-fade-down" style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
                      {turnIdx === 0 && activeNote?.title && (
                        <div>
                          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#09090b', marginBottom: 4, letterSpacing: '-0.02em' }}>
                            {activeNote.title}
                          </h2>
                        </div>
                      )}

                      <div data-ai-response="true">
                        <p style={{ fontSize: 15, lineHeight: 1.75, color: '#18181b', margin: 0, whiteSpace: 'pre-wrap' }}>
                          {animatingTurnId === turn.id && isTyping ? typedTurnText : turn.simplifiedText}
                          {animatingTurnId === turn.id && isTyping && <span className="plainnotes-cursor">▋</span>}
                        </p>
                      </div>

                      {turn.localAnalogy && (
                        <div
                          style={{
                            borderLeft: '3px solid #2563eb',
                            background: '#f8fafc',
                            padding: '14px 18px',
                            borderRadius: '0 8px 8px 0'
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
                            EVERYDAY ANALOGY
                          </div>
                          <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                            {turn.localAnalogy}
                          </div>
                        </div>
                      )}

                      {turn.examEssentials && turn.examEssentials.length > 0 && (
                        <div style={{ background: '#fafafa', border: '1px solid #f4f4f5', borderRadius: 12, padding: 18 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#09090b', marginBottom: 10 }}>
                            EXAM ESSENTIALS & MARKING CRITERIA
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {turn.examEssentials.map((point, pIdx) => {
                              const checkKey = `${turn.id}_${pIdx}`;
                              const isDone = Boolean(checkedEssentials[checkKey]);
                              return (
                                <div
                                  key={pIdx}
                                  onClick={() => {
                                    const next = { ...checkedEssentials, [checkKey]: !isDone };
                                    setCheckedEssentials(next);
                                    persistQuizState(quizAnswers, next);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 10,
                                    fontSize: 13.5,
                                    cursor: 'pointer',
                                    color: isDone ? '#a1a1aa' : '#3f3f46',
                                    textDecoration: isDone ? 'line-through' : 'none'
                                  }}
                                >
                                  {isDone ? (
                                    <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                                  ) : (
                                    <Circle size={16} color="#d4d4d8" style={{ flexShrink: 0, marginTop: 2 }} />
                                  )}
                                  <span>{point}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {turnQuizzes.length > 0 && (
                        <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: 18 }}>
                          <div
                            onClick={() => setCollapsedQuizzes(prev => ({ ...prev, [turn.id]: !isQuizCollapsed }))}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              background: '#fafafa',
                              border: '1px solid #e4e4e7',
                              borderRadius: 12,
                              cursor: 'pointer',
                              userSelect: 'none',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <HelpCircle size={17} color="#2563eb" />
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#09090b' }}>
                                Check Your Understanding ({turnQuizzes.length} Questions)
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {turnAnswered > 0 && (
                                <span style={{ fontSize: 12, fontWeight: 600, color: turnCorrect === turnAnswered ? '#16a34a' : '#d97706' }}>
                                  Score: {turnCorrect}/{turnAnswered}
                                </span>
                              )}
                              <ChevronDown
                                size={16}
                                color="#71717a"
                                style={{
                                  transform: isQuizCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                                  transition: 'transform 0.2s ease'
                                }}
                              />
                            </div>
                          </div>

                          {!isQuizCollapsed && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                              {turnQuizzes.map((q, qIdx) => {
                                const answerKey = `${turn.id}_${qIdx}`;
                                const selected = quizAnswers[answerKey];
                                const hasAnswered = selected !== undefined;
                                return (
                                  <div key={qIdx} style={{ background: '#fcfcfc', border: '1px solid #e4e4e7', borderRadius: 12, padding: 16 }}>
                                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#09090b', marginBottom: 10 }}>
                                      {qIdx + 1}. {q.question}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      {q.options.map((opt, optIdx) => {
                                        const isSelected = selected === optIdx;
                                        const isCorrect = q.answerIndex === optIdx;
                                        let bg = '#ffffff';
                                        let borderColor = '#e4e4e7';
                                        let textColor = '#27272a';

                                        if (hasAnswered) {
                                          if (isCorrect) {
                                            bg = '#f0fdf4';
                                            borderColor = '#86efac';
                                            textColor = '#166534';
                                          } else if (isSelected) {
                                            bg = '#fef2f2';
                                            borderColor = '#fca5a5';
                                            textColor = '#991b1b';
                                          }
                                        }

                                        return (
                                          <button
                                            key={optIdx}
                                            type="button"
                                            disabled={hasAnswered}
                                            onClick={() => {
                                              const next = { ...quizAnswers, [answerKey]: optIdx };
                                              setQuizAnswers(next);
                                              persistQuizState(next, checkedEssentials);
                                            }}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              padding: '9px 12px',
                                              borderRadius: 8,
                                              border: `1px solid ${borderColor}`,
                                              background: bg,
                                              color: textColor,
                                              fontSize: 13,
                                              textAlign: 'left',
                                              cursor: hasAnswered ? 'default' : 'pointer'
                                            }}
                                          >
                                            <span>{opt}</span>
                                            {hasAnswered && isCorrect && <Check size={14} color="#16a34a" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    {hasAnswered && q.explanation && (
                                      <div style={{ marginTop: 10, fontSize: 12, color: '#71717a', lineHeight: 1.5, background: '#f4f4f5', padding: '8px 12px', borderRadius: 6 }}>
                                        <strong>Why: </strong> {q.explanation}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid #f4f4f5' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleAudio(turn)}
                          style={{
                            padding: 7,
                            borderRadius: 6,
                            border: 'none',
                            background: isSpeaking ? '#f4f4f5' : 'transparent',
                            color: isSpeaking ? '#2563eb' : '#71717a',
                            cursor: 'pointer'
                          }}
                          title={isSpeaking ? 'Stop audio' : 'Listen to note'}
                        >
                          {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(turn)}
                          style={{
                            padding: 7,
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: '#71717a',
                            cursor: 'pointer'
                          }}
                          title="Copy response"
                        >
                          {hasCopied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                        </button>

                        <button
                          type="button"
                          onClick={handleShare}
                          style={{
                            padding: 7,
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: '#71717a',
                            cursor: 'pointer'
                          }}
                          title="Share note link"
                        >
                          <Share2 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(turn)}
                          style={{
                            padding: 7,
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: '#71717a',
                            cursor: 'pointer'
                          }}
                          title="Download as PDF"
                        >
                          <Download size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveClick(activeNote)}
                          style={{
                            padding: 7,
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: isNoteSaved ? '#2563eb' : '#71717a',
                            cursor: 'pointer'
                          }}
                          title={isNoteSaved ? 'Saved to vault' : 'Save to vault'}
                        >
                          {isNoteSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* In-flight loading message */}
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    {submittedFile && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#f4f4f5',
                          border: '1px solid #e4e4e7',
                          borderRadius: 8,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#27272a'
                        }}
                      >
                        {submittedFile.type === 'pdf' ? (
                          <span style={{ background: '#ef4444', color: '#ffffff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                            PDF
                          </span>
                        ) : submittedFile.type === 'image' ? (
                          <span style={{ background: '#3b82f6', color: '#ffffff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                            IMG
                          </span>
                        ) : (
                          <FileText size={13} style={{ color: '#71717a' }} />
                        )}
                        <span style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {submittedFile.name}
                        </span>
                      </div>
                    )}

                    <div
                      style={{
                        maxWidth: '85%',
                        background: '#f4f4f5',
                        borderRadius: 18,
                        padding: '12px 18px',
                        fontSize: 14.5,
                        color: '#09090b',
                        lineHeight: 1.5
                      }}
                    >
                      {submittedPrompt}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                    <span
                      className="plainnotes-thinking-text"
                      style={{
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: '#71717a',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      PlainNotes is thinking...
                    </span>
                  </div>
                </div>
              )}

              <div ref={bottomAnchorRef} />
            </div>
          </div>

          <div
            style={{
              padding: '12px 20px 20px',
              maxWidth: 760,
              margin: '0 auto',
              width: '100%',
              background: '#ffffff'
            }}
          >
            <div
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #e4e4e7',
                borderRadius: 24,
                padding: '12px 16px 10px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box'
              }}
            >
              {attachedFile && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#f4f4f5',
                    border: '1px solid #e4e4e7',
                    borderRadius: 8,
                    padding: '4px 10px',
                    marginBottom: 8,
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#18181b',
                    width: 'fit-content'
                  }}
                >
                  {attachedFile.type === 'pdf' ? (
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                      PDF
                    </span>
                  ) : attachedFile.type === 'image' ? (
                    <span style={{ background: '#3b82f6', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                      IMG
                    </span>
                  ) : (
                    <FileText size={13} style={{ color: '#71717a' }} />
                  )}
                  <span style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {attachedFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttachedFile(null);
                    }}
                    style={{ border: 'none', background: 'transparent', color: '#71717a', cursor: 'pointer', padding: 2 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {quotedText && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    background: '#f4f4f5',
                    borderRadius: 8,
                    marginBottom: 8,
                    fontSize: 12.5,
                    color: '#3f3f46',
                    width: '100%'
                  }}
                >
                  <MessageSquare size={13} style={{ color: '#71717a', flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                    &ldquo;{quotedText}&rdquo;
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuotedText(null)}
                    style={{ border: 'none', background: 'transparent', color: '#71717a', cursor: 'pointer', padding: 2, display: 'grid', placeItems: 'center' }}
                    title="Remove quote"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <textarea
                ref={dockedTextareaRef}
                rows={1}
                placeholder={
                  quotedText
                    ? 'Ask a follow-up on quoted text...'
                    : attachedFile
                    ? 'Ask PlainNotes to simplify this document...'
                    : 'Ask a follow-up or simplify another concept...'
                }
                value={inputText}
                onChange={e => {
                  setInputText(e.target.value);
                  autoResizeTextarea(e.target);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSimplify();
                  }
                }}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: 14.5,
                  lineHeight: 1.5,
                  color: '#09090b',
                  background: 'transparent',
                  padding: '4px 2px',
                  resize: 'none',
                  overflowY: 'auto',
                  minHeight: 32,
                  maxHeight: 180,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, width: '100%' }}>
                <div style={{ position: 'relative' }} ref={dockedPlusMenuRef}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'transparent',
                      border: 'none',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#09090b',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title="Add photos & files"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ position: 'relative' }} ref={dockedLangMenuRef}>
                    <button
                      type="button"
                      onClick={() => setDockedLangMenuOpen(!dockedLangMenuOpen)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 6px',
                        background: 'transparent',
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#71717a',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                      title="Change language / dialect"
                    >
                      <img
                        src={currentLangMeta.flagUrl}
                        alt={currentLangMeta.name}
                        style={{ width: 15, height: 11, objectFit: 'cover', borderRadius: 2 }}
                      />
                      <span>{currentLangMeta.name}</span>
                      <ChevronDown size={13} color="#71717a" />
                    </button>

                    {dockedLangMenuOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          right: 0,
                          marginBottom: 8,
                          width: 210,
                          background: '#ffffff',
                          border: '1px solid #e4e4e7',
                          borderRadius: 12,
                          padding: '6px 4px',
                          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12)',
                          zIndex: 50,
                          textAlign: 'left'
                        }}
                      >
                        {SUPPORTED_LANGUAGES.map(lang => {
                          const isSelected = selectedLanguage === lang.code;
                          return (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => {
                                setSelectedLanguage(lang.code);
                                setDockedLangMenuOpen(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                width: '100%',
                                padding: '7px 8px',
                                borderRadius: 6,
                                background: isSelected ? '#f4f4f5' : 'transparent',
                                color: '#09090b',
                                fontSize: 13,
                                fontWeight: isSelected ? 600 : 400,
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                            >
                              <img
                                src={lang.flagUrl}
                                alt={lang.name}
                                style={{ width: 16, height: 11, objectFit: 'cover', borderRadius: 2 }}
                              />
                              <span>{lang.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleVoiceDictation}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isListening ? '#fee2e2' : 'transparent',
                      color: isListening ? '#ef4444' : '#71717a',
                      border: 'none',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title={isListening ? 'Stop recording' : 'Dictate with voice'}
                  >
                    <Mic size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimplify()}
                    disabled={loading || (!inputText.trim() && !attachedFile)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: !inputText.trim() && !attachedFile ? '#93c5fd' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: !inputText.trim() && !attachedFile ? 'not-allowed' : 'pointer',
                      flexShrink: 0,
                      transition: 'background 0.15s ease'
                    }}
                    title="Send message"
                  >
                    <ArrowUp size={16} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
