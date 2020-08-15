import {Component, OnDestroy, OnInit} from '@angular/core';
import {ChatService} from '../../services/chat.service';
import {Subject, Observable, Subscription, combineLatest} from 'rxjs';
import {debounceTime, map, pluck, shareReplay, tap} from 'rxjs/operators';
import {ChatMessage} from '../../models/chat-message.model';
import {User} from '../../models/user.model';
import {Chat} from '../../models/chat.model';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnDestroy, OnInit {

  readonly currentUser$: Observable<string> = this.chatService.getCurrentUser().pipe(shareReplay());

  readonly chat$: Observable<Chat> = this.chatService.getSelectedChat();

  readonly chatId$: Observable<number> = this.chat$.pipe(pluck('chatId'));

  readonly messages$: Observable<Array<ChatMessage>> = this.chat$.pipe(pluck('messages'));

  readonly users$: Observable<Array<User>> = this.chat$.pipe(pluck('users'));

  readonly typingUsers$: Observable<Array<User>> = this.users$.pipe(
    map(users => users?.filter(user => user.typing && (user.name !== this.currentUser)))
  );

  readonly typingUsersMessage$: Observable<string> = this.typingUsers$.pipe(
    map(users => {
      let message = '';

      if (!!users?.length) {
        if (users.length > 3) {
          message = 'Several users are typing...';
        } else if (users.length === 1) {
          message = `${users[0].name} is typing...`;
        } else {
          for (let i = 0; i < users.length - 1; i++) {
            message += `${users[i].name}, `;
          }

          message = `${message.substring(0, message.length - 2)} and ${users[users.length - 1].name} are typing...`;
        }
      }

      return message;
    })
  );

  readonly _typingIndicator = new Subject<void>();

  currentUser: string;

  messageText: string;

  private subscription = new Subscription();

  constructor(private chatService: ChatService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.subscription.add(
      this.route.params.subscribe(
        params => {
          const chatId = +params?.chatId;

          if (chatId >= 1) {
            this.chatService.selectChat(chatId);
          }
        }
      )
    );

    this.subscription.add(
      combineLatest([this.chatId$, this._typingIndicator]).pipe(
        map(([chatId, ___]) => chatId),
        tap(chatId => this.chatService.sendUserTypingStartMessage(chatId, this.currentUser)),
        debounceTime(1000)
      ).subscribe(chatId => this.chatService.sendUserTypingEndMessage(chatId, this.currentUser))
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
    this.chatService.sendChatMessage(0, { from: this.currentUser, text: this.messageText });
    this.messageText = null;
  }
}
