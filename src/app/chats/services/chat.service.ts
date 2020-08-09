import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {OutputMessage} from '../models/output-message.model';
import {Message} from '../models/message.model';
import {webSocket} from 'rxjs/webSocket';

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

  private _messages = new BehaviorSubject<Array<OutputMessage>>(null);

  constructor() { }

  sendMessage(message: Message): void {
    this._connection.next(message);
  }

  connect(): void {
    this._connection.subscribe(
      message => {
        const messageType = (message as any).messageType;
        const data = (message as any).data;

        if (!!messageType && !!data) {
          if (messageType === 'connection') {
            this._messages.next(data);
          } else if (messageType === 'message') {
            const messages = this._messages.getValue();
            messages.push(data);
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

  getMessages(): Observable<Array<OutputMessage>> {
    return this._messages.asObservable();
  }
}
