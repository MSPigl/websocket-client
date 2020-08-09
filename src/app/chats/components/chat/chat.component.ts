import {Component, OnDestroy, OnInit} from '@angular/core';
import {OutputMessage} from '../../models/output-message.model';
import {ChatService} from '../../services/chat.service';
import {Subject, Observable, Subscription} from 'rxjs';
import {debounceTime, map, tap} from 'rxjs/operators';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnDestroy, OnInit {

  readonly isConnected$: Observable<boolean> = this.chatService.isConnected();

  readonly messages$: Observable<Array<OutputMessage>> = this.chatService.getMessages();

  readonly _typingIndicator = new Subject<void>();

  showTypingIndicator = false;

  currentUser: string;

  messageText: string;

  private subscription = new Subscription();

  constructor(private chatService: ChatService) { }

  ngOnInit(): void {
    this.subscription.add(
      this._typingIndicator.pipe(
        tap(() => this.showTypingIndicator = true),
        debounceTime(1000)
      ).subscribe(() => this.showTypingIndicator = false)
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  connect(): void {
    this.chatService.connect();
  }

  disconnect(): void {
    this.currentUser = null;
    this.messageText = null;
    this.chatService.disconnect();
  }

  sendMessage(): void {
    this.chatService.sendChatMessage({ from: this.currentUser, text: this.messageText });
    this.messageText = null;
  }
}
