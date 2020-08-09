import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {ChatMessage} from '../models/chat-message.model';
import {webSocket} from 'rxjs/webSocket';
import {Message} from '../models/message.model';

enum MessageType {
  CONNECTION = 'connection',
  CHAT_MESSAGE = 'chat-message',
  TYPING_INDICATOR = 'typing-indicator'
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private _connection = webSocket({
    url: 'ws://localhost:8080',
    openObserver: {
      next: () => this._connected.next(true)
    },
    closeObserver: {
      next: () => this._connected.next(false)
    }
  });

  private _connected = new BehaviorSubject(false);

  private _messages = new BehaviorSubject<Array<ChatMessage>>(null);

  constructor() { }

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
          if (receivedMessage.messageType === MessageType.CONNECTION) {
            this._messages.next(receivedMessage.payload);
          } else if (receivedMessage.messageType === MessageType.CHAT_MESSAGE) {
            const messages = this._messages.getValue();
            messages.push(receivedMessage.payload);
            this._messages.next(messages.sort((a, b) => a.time < b.time ? -1 : 1));
          }
        }
      },
      () => {
        this._connected.next(false);
      },
      () => {
        this._connected.next(false);
      }
    );
  }

  disconnect(): void {
    this._messages.next(null);
    this._connection.complete();
  }

  isConnected(): Observable<boolean> {
    return this._connected.asObservable();
  }

  getMessages(): Observable<Array<ChatMessage>> {
    return this._messages.asObservable();
  }
}
