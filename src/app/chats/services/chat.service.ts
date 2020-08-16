import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {ChatMessage} from '../models/chat-message.model';
import {webSocket} from 'rxjs/webSocket';
import {Message} from '../models/message.model';
import {User} from '../models/user.model';
import {Chat} from '../models/chat.model';

// TODO: fix typing indicators
enum MessageType {
  CONNECTION = 'connection',
  USER_CONNECTED = 'user-connected',
  USER_DISCONNECTED = 'user-disconnected',
  CHAT_CREATED = 'chat-created',
  USER_JOINED_CHAT = 'user-joined-chat',
  USER_LEFT_CHAT = 'user-left-chat',
  CHAT_MESSAGE = 'chat-message',
  USER_TYPING_START = 'user-typing-start',
  USER_TYPING_END = 'user-typing-end'
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private readonly _connection = webSocket({
    url: 'ws://localhost:8080',
    openObserver: {
      next: () => this._connected.next({ isConnected: true, sendMessage: true })
    },
    closeObserver: {
      next: () => this._connected.next({ isConnected: true, sendMessage: true })
    }
  });

  private readonly _connected = new BehaviorSubject<{ isConnected: boolean, sendMessage: boolean }>(null);

  private readonly _currentUser = new BehaviorSubject<string>(null);

  private readonly _chats = new BehaviorSubject<Array<Chat>>(null);

  private readonly _selectedChat = new BehaviorSubject<Chat>(null);

  private readonly _users = new BehaviorSubject<Array<User>>(null);

  constructor() { }

  sendUserConnectionMessage(name: string): void {
    this.sendMessage(MessageType.USER_CONNECTED, name);
  }

  sendUserDisconnectionMessage(name: string): void {
    this.sendMessage(MessageType.USER_DISCONNECTED, name);
  }

  sendUserTypingStartMessage(chatId: number, name: string): void {
    this.sendMessage(MessageType.USER_TYPING_START, { chatId, name, typing: true });
  }

  sendUserTypingEndMessage(chatId: number, name: string): void {
    this.sendMessage(MessageType.USER_TYPING_END, { chatId, name, typing: false });
  }

  sendChatMessage(chatId: number, message: ChatMessage): void {
    this.sendMessage(MessageType.CHAT_MESSAGE, { chatId, message });
  }

  sendUserCreatedChatMessage(name: string): void {
    this.sendMessage(MessageType.CHAT_CREATED, name);
  }

  sendUserJoinChatMessage(chatId: number, name: string): void {
    this.sendMessage(MessageType.USER_JOINED_CHAT, { chatId, name });
  }

  sendUserLeftChatMessage(chatId: number, name: string): void {
    this.sendMessage(MessageType.USER_LEFT_CHAT, { chatId, name });
  }

  private sendMessage(messageType: string, payload: any): void {
    this._connection.next({
      messageType,
      payload
    });
  }

  connect(): void {
    this._connection.subscribe(
      message => {
        const receivedMessage: Message = message as Message;
        let chats: Array<Chat>;
        let users: Array<User>;

        if (!!receivedMessage.messageType && !!receivedMessage.payload) {
          switch (receivedMessage.messageType) {
            case MessageType.CONNECTION:
              this._chats.next(receivedMessage.payload);
              break;
            case MessageType.USER_CONNECTED:
            case MessageType.USER_DISCONNECTED:
              chats = receivedMessage.payload.chats;
              users = receivedMessage.payload.users;
              if (!!users && !!chats) {
                this._users.next(users);
                this._chats.next(chats);
              }
              break;
            case MessageType.CHAT_CREATED:
            case MessageType.USER_JOINED_CHAT:
            case MessageType.USER_LEFT_CHAT:
              this._chats.next(receivedMessage.payload);
              break;
            case MessageType.USER_TYPING_START:
            case MessageType.USER_TYPING_END:
              const chatId = receivedMessage.payload.chatId;
              users = receivedMessage.payload.users;
              if (chatId >= 1 && !!users) {
                chats = this._chats.getValue();
                const foundChat = chats.find(chat => chat.chatId === chatId);

                if (!!foundChat) {
                  foundChat.users = users;
                  this._chats.next(chats);

                  const selectedChat = this._selectedChat.getValue();
                  if (chatId === selectedChat?.chatId) {
                    this._selectedChat.next(foundChat);
                  }
                }
              }

              break;
            case MessageType.CHAT_MESSAGE:
              chats = this._chats.getValue();
              const foundChatIndex = chats.findIndex(chat => chat.chatId === receivedMessage.payload.chatId);

              if (foundChatIndex >= 0) {
                chats[foundChatIndex].messages.push(receivedMessage.payload.message);
                chats[foundChatIndex].messages = chats[foundChatIndex].messages.sort((a, b) => a.time < b.time ? -1 : 1);
                this._chats.next(chats);
              }

              break;
          }
        }
      },
      () => {
        this._connected.next({ isConnected: false, sendMessage: false });
      },
      () => {
        this._connected.next({ isConnected: false, sendMessage: false });
      }
    );
  }

  disconnect(): void {
    this._chats.next(null);
    this._connection.complete();
  }

  isConnected(): Observable<{ isConnected: boolean, sendMessage: boolean }> {
    return this._connected.asObservable();
  }

  getCurrentUser(): Observable<string> {
    return this._currentUser.asObservable();
  }

  setCurrentUser(name: string): void {
    this._currentUser.next(name);
  }

  getUsers(): Observable<Array<User>> {
    return this._users.asObservable();
  }

  getChats(): Observable<Array<Chat>> {
    return this._chats.asObservable();
  }

  getSelectedChat(): Observable<Chat> {
    return this._selectedChat.asObservable();
  }

  selectChat(chatId: number): void {
    const chats = this._chats.getValue();
    const foundChat = chats.find(chat => chat.chatId === chatId);

    if (!!foundChat) {
      this._selectedChat.next(foundChat);
    }
  }
}
