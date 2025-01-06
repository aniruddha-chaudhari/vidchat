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
  const { startIndividualChat, currentChat, sendMessage, handleIncomingMessage } = useChatStore();
  const { socket } = useUserStore();
  const currentUser = useUserStore((state) => state.user);
  
  useEffect(() => {
    setIsLoading(true);
    const initChat = async () => {
      try {
        await startIndividualChat(contact.id);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initChat();
    
    // Set up socket event listener for receiving messages
    if (socket) {
      socket.on('receive_message', (message) => {
        console.log('Received message:', message);
        if (currentChat) {
          console.log('Current chat state:', {
            id: currentChat.id,
            participants: currentChat.participants,
            messageCount: currentChat.messages?.length
          });
        }
        handleIncomingMessage(message);
      });
    }
    
    // Cleanup function
    return () => {
      if (socket) {
        socket.off('receive_message');
        if (currentChat) {
          socket.emit('leave_chat', currentChat.id);
        }
      }
    };
  }, [contact.id, startIndividualChat, socket]);
  
  // Debug current chat state
  useEffect(() => {
    if (currentChat) {
      console.log('Chat state updated:', {
        id: currentChat.id,
        participants: currentChat.participants || [],
        messages: currentChat.messages || [],
        messageCount: currentChat.messages?.length || 0
      });
    }
  }, [currentChat]);
  
  const handleonclick = () => {
    if (!message.trim()) return;
    
    if (currentChat) {
      console.log('Chat state before sending:', {
        currentChat,
        messages: currentChat.messages
      });
      
      sendMessage(message, currentChat.id);
      setMessage('');
      
      // Log the chat state after sending
      console.log('Chat state after sending:', {
        currentChat,
        messages: currentChat.messages
      });
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
              // Convert both IDs to numbers for comparison
              const isCurrentUser = Number(msg.senderId) === Number(currentUser?.id);
              const previousMsg = index > 0 ? currentChat.messages[index - 1] : null;
              const isNewSender = !previousMsg || previousMsg.senderId !== msg.senderId;
              
              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${
                    isCurrentUser ? 'items-end' : 'items-start'
                  } ${isNewSender ? 'mt-4' : 'mt-1'}`}
                >
                  <div className={`
                    max-w-[70%] 
                    flex flex-col
                    ${isCurrentUser ? 'items-end' : 'items-start'}
                  `}>
                    {isNewSender && !isCurrentUser && (
                      <span className="text-xs text-gray-400 ml-2 mb-1">
                        {contact.username}
                      </span>
                    )}
                    <div className={`
                      rounded-2xl px-4 py-2
                      ${isCurrentUser 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-gray-700 text-white rounded-bl-sm'}
                    `}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-gray-400 mt-1 mx-2">
                      {formatTimestamp(msg.createdAt || new Date())}
                    </span>
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
