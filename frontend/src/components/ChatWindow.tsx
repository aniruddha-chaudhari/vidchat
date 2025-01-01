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
  const { startIndividualChat, currentChat, sendMessage } = useChatStore();
  const currentUser = useUserStore((state) => state.user);
  
  useEffect(() => {
    startIndividualChat(contact.id);
    
    // Cleanup function to leave chat room when component unmounts
    return () => {
      const socket = useUserStore.getState().socket;
      if (socket && currentChat) {
        socket.emit('leave_chat', currentChat.id);
      }
    };
  }, [contact.id, startIndividualChat]);
  
const handleonclick = () => {
  if (!message.trim()) {
    console.log('Message is empty, not sending');
    return;
  }
  
  if (currentChat) {
    console.log('Sending message:', {
      content: message,
      chatId: currentChat.id,
      currentChat
    });
    sendMessage(message, currentChat.id);
    setMessage(''); // Clear the input after sending
  } else {
    console.log('No current chat available');
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
        {/* <div className="flex flex-col gap-4">
          {currentChat?.messages.map((msg) => (
            <div 
              key={msg.id}
              className={`${
                String(msg.senderId) === currentUser?.id ? 'self-end' : 'self-start'
              } max-w-[70%]`}
            >
              <div className={`${
                String(msg.senderId) === currentUser?.id 
                  ? 'bg-blue-500' 
                  : 'bg-gray-800'
              } text-white rounded-lg p-3`}>
                {msg.content}
              </div>
              <span className="text-xs text-gray-400 mt-1">
                {formatTimestamp(msg.createdAt || new Date())}
              </span>
            </div>
          ))}
        </div> */}
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
