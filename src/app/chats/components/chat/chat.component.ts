import {Component, OnDestroy, OnInit} from '@angular/core';
import {ChatService} from '../../services/chat.service';
import {Subject, Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, shareReplay, tap} from 'rxjs/operators';
import {ChatMessage} from '../../models/chat-message.model';
import {User} from '../../models/user.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnDestroy, OnInit {

  readonly isConnected$: Observable<boolean> = this.chatService.isConnected().pipe(
    tap(connectionStatus => {
      if (!!connectionStatus) {
        connectionStatus.isConnected
          ? this.chatService.sendUserConnectionMessage(this.currentUser)
          : this.chatService.sendUserDisconnectionMessage(this.currentUser);
      }
    }),
    map(connectionStatus => connectionStatus?.isConnected),
    shareReplay()
  );

  readonly messages$: Observable<Array<ChatMessage>> = this.chatService.getMessages();

  readonly users$: Observable<Array<User>> = this.chatService.getUsers();

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

  constructor(private chatService: ChatService) { }

  ngOnInit(): void {
    this.subscription.add(
      this._typingIndicator.pipe(
        tap(() => this.chatService.sendUserTypingStartMessage(this.currentUser)),
        debounceTime(1000)
      ).subscribe(() => this.chatService.sendUserTypingEndMessage(this.currentUser))
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
