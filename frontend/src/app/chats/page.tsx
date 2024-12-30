'use client'

import { useState } from 'react'
import { Search, MoreVertical, Plus, Send, Smile, Paperclip } from 'lucide-react'
import { contacts as initialContacts, type Contact } from '@/app/chats/contacts'
import { AddContactModal } from '@/components/contactmodal'

export default function ChatApp() {
  const [contacts, setContacts] = useState(initialContacts)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [message, setMessage] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAddContact = (email: string) => {
    const newContact: Contact = {
      id: (contacts.length + 1).toString(),
      name: email.split('@')[0], // Using email username as temporary name
      lastMessage: 'New contact added',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    
    setContacts([...contacts, newContact])
    setIsModalOpen(false)
  }

  const handleEmptyStateClick = () => {
    setIsModalOpen(true)
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left sidebar */}
      <div className="w-[400px] flex flex-col border-r border-gray-700">
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <h1 className="text-xl font-semibold text-white">Chats</h1>
          <button className="p-2 hover:bg-gray-700 rounded-full">
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Search bar */}
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search or start new chat"
              className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Contact list or empty state */}
        {contacts.length > 0 ? (
          <div className="flex-1 overflow-y-auto">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-4 flex items-center gap-4 hover:bg-gray-800 border-b border-gray-700 ${
                  selectedContact?.id === contact.id ? 'bg-gray-800' : ''
                }`}
              >
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-lg text-white">{contact.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-white font-medium truncate">{contact.name}</h3>
                    <span className="text-sm text-gray-400 flex-shrink-0">{contact.timestamp}</span>
                  </div>
                  <p className="text-gray-400 text-sm truncate">{contact.lastMessage}</p>
                </div>
                {contact.unread && (
                  <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {contact.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div 
            onClick={handleEmptyStateClick}
            className="flex-1 flex items-center justify-center flex-col gap-4 p-4 cursor-pointer hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-12 h-12 text-gray-500" />
            <p className="text-gray-400 text-center">No contacts yet. Click to add new contacts.</p>
          </div>
        )}
      </div>

      {/* Right chat window */}
      {selectedContact ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 flex items-center gap-4 border-b border-gray-700">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white">{selectedContact.name[0]}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-white font-medium">{selectedContact.name}</h2>
              <p className="text-sm text-gray-400">Online</p>
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
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Select a chat to start messaging</p>
        </div>
      )}

      <AddContactModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddContact}
      />
    </div>
  )
}

