import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/lib/store';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const { language } = useAppStore();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: language === 'en'
                ? 'Hello! I am your AI Assistant for Bright Choice (powered by OpenGravity). How can I help you analyze products today?'
                : '¡Hola! Soy tu asistente de Inteligencia Artificial para Bright Choice (OpenGravity). ¿En qué puedo ayudarte a analizar productos hoy?'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Generate a session ID for the user if they're not logged in, or get their true ID.
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
            } else {
                // Fallback to a session-based anonymous ID so memory works during this session
                let anonId = sessionStorage.getItem('opengravity_anon_id');
                if (!anonId) {
                    anonId = `anon_${Math.random().toString(36).substring(2, 10)}`;
                    sessionStorage.setItem('opengravity_anon_id', anonId);
                }
                setUserId(anonId);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        const newMsg: Message = { id: Date.now().toString(), role: 'user', content: userMessage };
        setMessages((prev) => [...prev, newMsg]);
        setIsLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('chatbot', {
                body: { message: userMessage, userId }
            });

            if (error) {
                throw error;
            }

            const replyContent = data?.reply || (language === 'en' ? 'Sorry, I could not get a response right now.' : 'Lo siento, no pude obtener una respuesta en este momento.');
            setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: replyContent }]);

        } catch (err) {
            console.error('Chatbot error:', err);
            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: language === 'en' ? 'Connection error with the agent. Please try again.' : 'Error de conexión con el agente. Por favor, intenta de nuevo.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* FAB */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-primary/30 transition-shadow hover:shadow-xl bg-primary text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        <MessageCircle className="h-6 w-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[350px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
                            <div className="flex items-center gap-2">
                                <Bot className="h-5 w-5" />
                                <h3 className="font-semibold">{language === 'en' ? 'AI Assistant' : 'Asistente IA'}</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-1 hover:bg-primary-foreground/20 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card/50">
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                : 'bg-muted border text-foreground shadow-sm rounded-bl-sm'
                                            }`}
                                    >
                                        {m.content.split('\n').map((line, i) => (
                                            <span key={i}>
                                                {line}
                                                <br />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted border text-foreground shadow-sm rounded-bl-sm">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="border-t p-3 bg-background flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={language === 'en' ? 'Ask about products...' : 'Pregunta sobre los productos...'}
                                className="flex-1 rounded-full border bg-muted/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || isLoading}
                                className="rounded-full shrink-0"
                            >
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
