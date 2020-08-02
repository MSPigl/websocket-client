import { Component, OnInit } from '@angular/core';
import {OutputMessage} from '../../models/output-message.model';
import {ChatService} from '../../services/chat.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  readonly isConnected$: Observable<boolean> = this.chatService.isConnected();

  readonly messages$: Observable<Array<OutputMessage>> = this.chatService.getMessages();

  currentUser: string;

  messageText: string;

  constructor(private chatService: ChatService) { }

  ngOnInit(): void { }

  connect(): void {
    this.chatService.connect();
  }

  disconnect(): void {
    this.currentUser = null;
    this.messageText = null;
    this.chatService.disconnect();
  }

  sendMessage(): void {
    this.chatService.sendMessage({ from: this.currentUser, text: this.messageText });
    this.messageText = null;
  }
}
