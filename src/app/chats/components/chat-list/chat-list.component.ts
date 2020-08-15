import { Component, OnInit } from '@angular/core';
import {ChatService} from '../../services/chat.service';
import {combineLatest, Observable} from 'rxjs';
import {Chat} from '../../models/chat.model';
import {map, shareReplay} from 'rxjs/operators';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.css']
})
export class ChatListComponent implements OnInit {

  readonly currentUser$: Observable<string> = this.chatService.getCurrentUser();

  readonly chats$: Observable<Array<Chat>> = this.chatService.getChats();

  readonly chatParticipantListMap$: Observable<{ [id: number]: string }> = this.chats$.pipe(
    map(chats => {
      const participantMap: { [id: number]: string } = {};
      for (const chat of chats) {
        let participantString = '';
        if (chat.users.length > 1) {
          if (chat.users.length > 3) {
            participantString = `${chat.users[0].name}, ${chat.users[1].name}, ${chat.users[2].name}`;
            const remainingParticipantCount = chat.users.length - 3;
            participantString += ` and ${remainingParticipantCount} ${remainingParticipantCount > 0 ? 'others' : 'other'}`;
          } else {
            participantString = chat.users.join(', ');
          }
        } else {
          participantString = chat.users[0].name;
        }

        participantMap[chat.chatId] = participantString;
      }

      return participantMap;
    })
  );

  readonly currentUserChatMembershipMap$: Observable<{ [id: number]: boolean; }> = combineLatest([this.currentUser$, this.chats$]).pipe(
    map(([currentUser, chats]) => {
      const userMembershipMap: { [id: number]: boolean } = {};
      for (const chat of chats) {
        const usersInChat = chat.users.map(user => user.name);
        userMembershipMap[chat.chatId] = usersInChat.includes(currentUser);
      }

      return userMembershipMap;
    }),
    shareReplay()
  );

  constructor(private chatService: ChatService) { }

  ngOnInit(): void { }

  createChat(name: string): void {
    this.chatService.sendUserCreatedChatMessage(name);
  }

  joinChat(chatId: number, name: string): void {
    this.chatService.sendUserJoinChatMessage(chatId, name);
  }

  leaveChat(chatId: number, name: string): void {
    this.chatService.sendUserLeftChatMessage(chatId, name);
  }

}
