import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {ChatMessage} from '../models/chat-message.model';
import {webSocket} from 'rxjs/webSocket';
import {Message} from '../models/message.model';
import {User} from '../models/user.model';

enum MessageType {
  CONNECTION = 'connection',
  USER_CONNECTED = 'user-connected',
  USER_DISCONNECTED = 'user-disconnected',
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

  private readonly _messages = new BehaviorSubject<Array<ChatMessage>>(null);

  private readonly _users = new BehaviorSubject<Array<User>>(null);

  constructor() { }

  sendUserConnectionMessage(name: string): void {
    this.sendMessage(MessageType.USER_CONNECTED, name);
  }

  sendUserDisconnectionMessage(name: string): void {
    this.sendMessage(MessageType.USER_DISCONNECTED, name);
  }

  sendUserTypingStartMessage(name: string): void {
    this.sendMessage(MessageType.USER_TYPING_START, name);
  }

  sendUserTypingEndMessage(name: string): void {
    this.sendMessage(MessageType.USER_TYPING_END, name);
  }

  sendChatMessage(message: ChatMessage): void {
    this.sendMessage(MessageType.CHAT_MESSAGE, message);
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
            case MessageType.USER_TYPING_START:
            case MessageType.USER_TYPING_END:
              this._users.next(receivedMessage.payload);
              break;
            case MessageType.CHAT_MESSAGE:
              const messages = this._messages.getValue();
              messages.push(receivedMessage.payload);
              this._messages.next(messages.sort((a, b) => a.time < b.time ? -1 : 1));
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
}
