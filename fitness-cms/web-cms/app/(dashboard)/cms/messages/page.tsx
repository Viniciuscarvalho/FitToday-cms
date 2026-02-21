'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  MessageSquare,
  Users,
  Star,
  Loader2,
  Lock,
  Sparkles,
  MessageCircle,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  addDoc,
  onSnapshot,
  Firestore,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantPhoto?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isPinned: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  createdAt: Date;
  readAt?: Date;
}

export default function MessagesPage() {
  const { user, trainer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { db } = await import('@/lib/firebase');
      if (!db) return;

      // Load subscriptions to get students
      const subsRef = collection(db as Firestore, 'subscriptions');
      const subsQuery = query(
        subsRef,
        where('trainerId', '==', user.uid),
        where('status', '==', 'active')
      );
      const subsSnapshot = await getDocs(subsQuery);

      // Create mock conversations from subscriptions
      const conversationsList: Conversation[] = subsSnapshot.docs.map((doc, index) => {
        const data = doc.data();
        return {
          id: doc.id,
          participantId: data.studentId,
          participantName: data.studentName || `Aluno ${index + 1}`,
          participantPhoto: data.studentPhoto,
          lastMessage: 'Clique para iniciar uma conversa',
          lastMessageAt: data.createdAt?.toDate?.() || new Date(),
          unreadCount: Math.floor(Math.random() * 3),
          isPinned: false,
        };
      });

      // Sort by last message date
      conversationsList.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

      setConversations(conversationsList);

      // Auto-select first conversation on desktop
      if (conversationsList.length > 0 && window.innerWidth >= 768) {
        setSelectedConversation(conversationsList[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!user) return;

    try {
      const { db } = await import('@/lib/firebase');
      if (!db) return;

      const messagesRef = collection(db as Firestore, 'conversations', conversationId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

      // Real-time listener
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          readAt: doc.data().readAt?.toDate?.() || undefined,
        })) as Message[];

        setMessages(messagesList);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading messages:', error);
      // Set empty messages for demo
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      setSending(true);
      const { db } = await import('@/lib/firebase');
      if (!db) throw new Error('Firebase not configured');

      const messageData = {
        senderId: user.uid,
        content: newMessage.trim(),
        type: 'text',
        createdAt: Timestamp.now(),
      };

      // Add message to Firestore
      await addDoc(
        collection(db as Firestore, 'conversations', selectedConversation.id, 'messages'),
        messageData
      );

      // Update last message in conversation
      await updateDoc(doc(db as Firestore, 'conversations', selectedConversation.id), {
        lastMessage: newMessage.trim(),
        lastMessageAt: Timestamp.now(),
      });

      // Add to local state immediately for better UX
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderId: user.uid,
          content: newMessage.trim(),
          type: 'text',
          createdAt: new Date(),
        },
      ]);

      // Update conversation in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? { ...c, lastMessage: newMessage.trim(), lastMessageAt: new Date() }
            : c
        )
      );

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Still show message locally for demo purposes
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderId: user?.uid || '',
          content: newMessage.trim(),
          type: 'text',
          createdAt: new Date(),
        },
      ]);
      setNewMessage('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatConversationTime = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return formatMessageTime(date);
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
  };

  // Check if trainer has Elite plan for chat access
  const trainerPlan = trainer?.subscription?.plan || 'starter';
  const hasChatAccess = trainerPlan === 'elite';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Upsell screen for non-Elite plans
  if (!hasChatAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-lg text-center px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-10 w-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Chat com Alunos
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Comunique-se diretamente com seus alunos em tempo real. Envie mensagens, arquivos e
            acompanhe tudo em um só lugar. Disponível exclusivamente no plano Elite.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              Incluído no plano Elite
            </h3>
            <ul className="space-y-3">
              {[
                'Mensagens em tempo real com alunos',
                'Envio de fotos e arquivos',
                'Histórico completo de conversas',
                'Notificações push no app',
                'Suporte prioritário',
                '0% de comissão nas vendas',
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                  <Zap className="h-4 w-4 text-primary-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href="/cms/settings"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <Lock className="h-5 w-5" />
              Fazer Upgrade para Elite — R$197/mês
            </Link>
            <p className="text-xs text-gray-400">
              Seu plano atual: <span className="font-medium capitalize">{trainerPlan}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Conversations List */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col ${
          showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Mensagens</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      {conversation.participantPhoto ? (
                        <img
                          src={conversation.participantPhoto}
                          alt={conversation.participantName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary-600">
                            {conversation.participantName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {conversation.isPinned && (
                        <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conversation.participantName}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatConversationTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-primary-600 text-white text-xs font-medium rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`flex-1 flex flex-col ${
          !showMobileChat && !selectedConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                {selectedConversation.participantPhoto ? (
                  <img
                    src={selectedConversation.participantPhoto}
                    alt={selectedConversation.participantName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="font-semibold text-primary-600">
                      {selectedConversation.participantName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.participantName}
                  </h2>
                  <p className="text-xs text-green-600">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <Video className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <Info className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma mensagem ainda</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Comece uma conversa enviando uma mensagem
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === user?.uid;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-primary-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 ${
                            isOwn ? 'text-primary-200' : 'text-gray-400'
                          }`}
                        >
                          <span className="text-xs">{formatMessageTime(message.createdAt)}</span>
                          {isOwn && (
                            <>
                              {message.readAt ? (
                                <CheckCheck className="h-4 w-4" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-end gap-3">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <ImageIcon className="h-5 w-5" />
                </button>
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    rows={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    style={{ maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                Escolha um aluno para iniciar uma conversa
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
