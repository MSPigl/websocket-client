import { Component, OnInit } from '@angular/core';
import {Observable} from 'rxjs';
import {map, shareReplay, tap} from 'rxjs/operators';
import {ChatService} from '../../services/chat.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

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

  currentUser: string;

  constructor(private chatService: ChatService) { }

  ngOnInit(): void { }

  connect(): void {
    this.chatService.setCurrentUser(this.currentUser);
    this.chatService.connect();
  }

  disconnect(): void {
    this.chatService.disconnect();
  }

}
