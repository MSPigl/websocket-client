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

  readonly typingUsers$: Observable<Array<User>> = combineLatest([this.currentUser$, this.users$]).pipe(
    map(([currentUser, users]) => users?.filter(user => user.typing && (user.name !== currentUser)))
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

  messageText: string;

  private subscriptions = new Subscription();

  constructor(private chatService: ChatService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.params.subscribe(
        params => {
          const chatId = +params?.chatId;

          if (chatId >= 1) {
            this.chatService.selectChat(chatId);
          }
        }
      )
    );

    this.subscriptions.add(
      combineLatest([this.chatId$, this._typingIndicator, this.currentUser$]).pipe(
        map(([chatId, ___, currentUser]) => {
          return { chatId, currentUser};
        }),
        tap(obj => this.chatService.sendUserTypingStartMessage(obj.chatId, obj.currentUser)),
        debounceTime(1000)
      ).subscribe(obj => this.chatService.sendUserTypingEndMessage(obj.chatId, obj.currentUser))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  sendMessage(chatId: number, currentUser: string): void {
    this.chatService.sendChatMessage(chatId, { from: currentUser, text: this.messageText });
    this.messageText = null;
  }
}
