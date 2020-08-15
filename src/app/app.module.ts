import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChatComponent } from './chats/components/chat/chat.component';
import {FormsModule} from '@angular/forms';
import { ChatListComponent } from './chats/components/chat-list/chat-list.component';
import { UserComponent } from './chats/components/user/user.component';

@NgModule({
  declarations: [
    AppComponent,
    ChatComponent,
    ChatListComponent,
    UserComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
