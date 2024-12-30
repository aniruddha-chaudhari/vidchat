import { useState } from 'react';
import { MoreVertical, Send, Smile, Paperclip } from 'lucide-react';

interface Contact {
  id: string;
  username: string;
  email: string;
}

interface ChatWindowProps {
  contact: Contact;
}

export function ChatWindow({ contact }: ChatWindowProps) {
  const [message, setMessage] = useState('');

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
          <div className="self-start max-w-[70%]">
            <div className="bg-gray-800 text-white rounded-lg p-3">
              Hey, how are you?
            </div>
            <span className="text-xs text-gray-400 mt-1">2:45 PM</span>
          </div>
          <div className="self-end max-w-[70%]">
            <div className="bg-blue-500 text-white rounded-lg p-3">
              I'm doing great! Thanks for asking.
            </div>
            <span className="text-xs text-gray-400 mt-1">2:46 PM</span>
          </div>
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
            placeholder="Type a message"
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="p-2 hover:bg-gray-700 rounded-full">
            <Send className="w-6 h-6 text-blue-500 group-hover:text-blue-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
