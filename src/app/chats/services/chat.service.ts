import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {OutputMessage} from '../models/output-message.model';
import {Message} from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private _connected = new BehaviorSubject(false);

  private _messages = new BehaviorSubject<Array<OutputMessage>>([
    { from: 'Big Chungus', text: 'Hi!', time: '17:00' },
    { from: 'Bigger Chungus', text: 'Yo!', time: '17:03' },
    { from: 'Biggest Chungus', text: 'Hola!', time: '17:12' }
  ]);

  constructor() { }

  sendMessage(message: Message): void {
    const messages = this._messages.getValue();
    messages.push({ from: message.from, text: message.text, time: `${new Date().getHours()}:${new Date().getMinutes()}`});
    this._messages.next(messages);
  }

  connect(): void {
    this._connected.next(true);
  }

  disconnect(): void {
    this._connected.next(false);
  }

  isConnected(): Observable<boolean> {
    return this._connected.asObservable();
  }

  getMessages(): Observable<Array<OutputMessage>> {
    return this._messages.asObservable();
  }
}
