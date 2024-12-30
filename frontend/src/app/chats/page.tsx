'use client'

import { useEffect, useState } from 'react'
import { Search, MoreVertical, Plus } from 'lucide-react'
import { AddContactModal } from '@/components/contactmodal'
import { ChatWindow } from '@/components/ChatWindow'
import { useContactStore } from '@/store/contact'

export default function ChatApp() {
  const { contacts, getContacts, addContact } = useContactStore()
  const [selectedContact, setSelectedContact] = useState<typeof contacts[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    getContacts()
  }, [getContacts])

  const handleAddContact = async (email: string) => {
    await addContact(email)
    await getContacts()
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
            <Plus
            onClick={() => setIsModalOpen(true)}
            className="w-5 h-5 text-gray-400" />
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
                className={`w-full p-4 flex items-start gap-4 hover:bg-gray-800 border-b border-gray-700 ${
                  selectedContact?.id === contact.id ? 'bg-gray-800' : ''
                }`}
              >
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-lg text-white">{contact.username[0]}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-white font-medium">{contact.username}</h3>
                  <p className="text-gray-400 text-sm">{contact.email}</p>
                </div>
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
        <ChatWindow contact={selectedContact} />
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

