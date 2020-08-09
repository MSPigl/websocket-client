import {ChatMessage} from './chat-message.model';

export interface OutputMessage extends ChatMessage {
  time: number;
}
