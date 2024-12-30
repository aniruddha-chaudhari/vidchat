export interface Contact {
    id: string;
    name: string;
    lastMessage: string;
    timestamp: string;
    unread?: number;
  }
  
  export const contacts: Contact[] = [
    // {
    //   id: '1',
    //   name: 'John Doe',
    //   lastMessage: 'Hey, how are you?',
    //   timestamp: '2:48 PM',
    //   unread: 2,
    // },
    // {
    //   id: '2',
    //   name: 'Jane Smith',
    //   lastMessage: 'Meeting at 3 PM',
    //   timestamp: '1:30 PM',
    // },
    // {
    //   id: '3',
    //   name: 'Tech Group',
    //   lastMessage: 'Alice: The new update is live!',
    //   timestamp: '12:15 PM',
    //   unread: 5,
    // },
  ]
  
  