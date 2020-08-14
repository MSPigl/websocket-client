import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {ChatMessage} from '../models/chat-message.model';
import {webSocket} from 'rxjs/webSocket';
import {Message} from '../models/message.model';
import {User} from '../models/user.model';
import {Chat} from '../models/chat.model';

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

  private readonly _chats = new BehaviorSubject<Array<Chat>>(null);

  private readonly _selectedChat = new BehaviorSubject<Chat>(null);

  private readonly _messages = new BehaviorSubject<Array<ChatMessage>>(null);

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

        if (!!receivedMessage.messageType && !!receivedMessage.payload) {
          switch (receivedMessage.messageType) {
            case MessageType.CONNECTION:
              this._messages.next(receivedMessage.payload);
              break;
            case MessageType.USER_CONNECTED:
            case MessageType.USER_DISCONNECTED:
              this._users.next(receivedMessage.payload);
              break;
            case MessageType.CHAT_CREATED:
            case MessageType.USER_JOINED_CHAT:
            case MessageType.USER_LEFT_CHAT:
              this._chats.next(receivedMessage.payload);
              break;
            case MessageType.USER_TYPING_START:
            case MessageType.USER_TYPING_END:
              this._users.next(receivedMessage.payload);
              break;
            case MessageType.CHAT_MESSAGE:
              const chats = this._chats.getValue();
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
    this._messages.next(null);
    this._connection.complete();
  }

  isConnected(): Observable<{ isConnected: boolean, sendMessage: boolean }> {
    return this._connected.asObservable();
  }

  getMessages(): Observable<Array<ChatMessage>> {
    return this._messages.asObservable();
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
}
