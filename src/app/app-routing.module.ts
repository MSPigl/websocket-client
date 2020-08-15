import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ChatComponent} from './chats/components/chat/chat.component';
import {ChatListComponent} from './chats/components/chat-list/chat-list.component';
import {UserComponent} from './chats/components/user/user.component';

const routes: Routes = [
  { path: '', component: UserComponent },
  { path: 'chats', component: ChatListComponent },
  { path: 'chats/:chatId', component: ChatComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
