import { useEffect, useState } from 'react';
import { MoreVertical, Send, Smile, Paperclip } from 'lucide-react';
import { useChatStore } from '@/store/chats';
import { useUserStore } from '@/store/user';

interface Contact {
  id: string;
  username: string;
  email: string;
}

interface ChatWindowProps {
  contact: Contact;
}

const formatTimestamp = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function ChatWindow({ contact }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { startIndividualChat, currentChat, sendMessage, handleIncomingMessage, loadCachedMessages } = useChatStore();
  const { socket } = useUserStore();
  const currentUser = useUserStore((state) => state.user);

  // Chat initialization effect
  useEffect(() => {
    let mounted = true;

    const initChat = async () => {
      try {
        setIsLoading(true);
        const chat = await startIndividualChat(contact.id);
        if (mounted && chat?.id) {
          await loadCachedMessages(chat.id);
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setHasInitialized(true);
        }
      }
    };

    if (!hasInitialized) {
      initChat();
    }

    return () => {
      mounted = false;
    };
  }, [contact.id, startIndividualChat, loadCachedMessages]);

  // Socket event handling effect
  useEffect(() => {
    if (!socket || !currentChat) return;

    const handleMessage = (message: any) => {
      if (message.chatId === currentChat.id || message.chat_id === currentChat.id) {
        handleIncomingMessage(message);
      }
    };

    socket.on('receive_message', handleMessage);
    socket.emit('join_chat', currentChat.id);

    return () => {
      socket.off('receive_message', handleMessage);
      socket.emit('leave_chat', currentChat.id);
    };
  }, [socket, currentChat, handleIncomingMessage]);

  // Remove or modify the debug effect to prevent unnecessary renders
  useEffect(() => {
    if (currentChat && !isLoading) {
      console.log('Chat state updated:', {
        id: currentChat.id,
        messageCount: currentChat.messages?.length || 0,
        messages: currentChat.messages
      });
    }
  }, [currentChat, isLoading]);

  const handleonclick = () => {
    if (!message.trim()) return;
    
    if (currentChat) {
      sendMessage(message, currentChat.id);
      setMessage('');
    }
  }

// Add keypress handler for Enter key
const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleonclick();
  }
}

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 flex items-center gap-4 border-b border-gray-700">
        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
          <span className="text-white">{contact.username[0]}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-white font-medium">{contact.username}</h2>
          <p className="text-sm text-gray-400">{contact.email}</p>
        </div>
        <button className="p-2 hover:bg-gray-700 rounded-full">
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="text-center text-gray-400">Loading messages...</div>
          ) : currentChat && currentChat.messages && currentChat.messages.length > 0 ? (
            currentChat.messages.map((msg, index) => {
              // Normalize sender IDs to numbers
              const msgSenderId = typeof msg.senderId === 'string' ? 
                parseInt(msg.senderId) : 
                msg.senderId || msg.sender_id; // Add fallback to sender_id
              const currentUserId = typeof currentUser?.id === 'string' ? 
                parseInt(currentUser.id) : 
                currentUser?.id;
              const isCurrentUser = msgSenderId === currentUserId;

              // Get previous and next messages for grouping
              const previousMsg = index > 0 ? currentChat.messages[index - 1] : null;
              const prevSenderId = previousMsg ? 
                (previousMsg.senderId || previousMsg.sender_id) : 
                null;
              
              const nextMsg = index < currentChat.messages.length - 1 ? 
                currentChat.messages[index + 1] : 
                null;
              const nextSenderId = nextMsg ? 
                (nextMsg.senderId || nextMsg.sender_id) : 
                null;

              // Determine message grouping
              const isFirstInGroup = prevSenderId !== msgSenderId;
              const isLastInGroup = nextSenderId !== msgSenderId;

              // Enhanced bubble styles for better visual grouping
              const bubbleStyle = isCurrentUser
                ? `bg-blue-600 text-white 
                   ${isFirstInGroup ? 'rounded-t-2xl rounded-bl-2xl' : 'rounded-bl-2xl'} 
                   ${isLastInGroup ? 'rounded-br-sm' : ''} 
                   ${!isFirstInGroup && !isLastInGroup ? '' : ''}`
                : `bg-gray-700 text-white 
                   ${isFirstInGroup ? 'rounded-t-2xl rounded-br-2xl' : 'rounded-br-2xl'} 
                   ${isLastInGroup ? 'rounded-bl-sm' : ''} 
                   ${!isFirstInGroup && !isLastInGroup ? '' : ''}`;

              return (
                <div 
                  key={msg.id || index}
                  className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} 
                    ${isFirstInGroup ? 'mt-4' : 'mt-0.5'}`}
                >
                  <div className={`max-w-[70%] flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    {isFirstInGroup && !isCurrentUser && (
                      <span className="text-xs text-gray-400 ml-2 mb-1">
                        {contact.username}
                      </span>
                    )}
                    <div className={`px-4 py-2 ${bubbleStyle}`}>
                      {msg.content}
                    </div>
                    {isLastInGroup && (
                      <span className="text-xs text-gray-400 mt-1 mx-2">
                        {formatTimestamp(msg.createdAt || new Date(msg.created_at || Date.now()))}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-400">No messages yet</div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-700 rounded-full">
            <Smile className="w-6 h-6 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-full">
            <Paperclip className="w-6 h-6 text-gray-400" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyUp={handleKeyPress}
            placeholder="Type a message"
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="p-2 hover:bg-gray-700 rounded-full"
          onClick={handleonclick}
          >
            <Send className="w-6 h-6 text-blue-500 group-hover:text-blue-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
