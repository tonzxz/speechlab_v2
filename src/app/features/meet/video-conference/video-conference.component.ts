import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


interface ChatMessage {
  sender: string;
  avatar: string;
  time: string;
  message: string;
}

@Component({
  selector: 'app-video-conference',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-conference.component.html',
  styleUrls: ['./video-conference.component.css']
})
export class VideoConferenceComponent implements OnInit, OnDestroy {
  meetingJoined = false;
  participantCount = 0;
  chatMessages: ChatMessage[] = [];
  newMessage = '';
  sdkInstance: any; // This will hold your sdkvideo.live instance
  localStream: any; // Local user stream for video/audio
  remoteStreams: any[] = []; // List of remote participants' streams

  // Properties for video controls
  isMicOn: boolean = true;
  isVideoOn: boolean = true;
  isScreenShared: boolean = false;

  // Add your API key and secret here
  private readonly apiKey = 'b8bbeb31-f493-4f77-893f-6a822cd2a781';
  private readonly apiSecret = '7c6867d55969803a9b974456d4e1c1fb7bb3973c20b908fa481f3da7dd2f4a86';

  ngOnInit() {
    this.loadMockChatMessages();
    this.initializeSDK();
  }

  ngOnDestroy() {
    // Clean up resources when the component is destroyed
    if (this.sdkInstance) {
      this.sdkInstance.leaveRoom();
    }
  }

  initializeSDK() {
    // Initialize the SDK using API key and secret
    // this.sdkInstance = new SdkVideo({
    //   apiKey: this.apiKey,
    //   apiSecret: this.apiSecret,
    // });

    // Listen to events from the SDK
    this.sdkInstance.on('joinedRoom', (participantCount: number) => {
      this.meetingJoined = true;
      this.participantCount = participantCount;
    });

    this.sdkInstance.on('remoteStreamAdded', (stream: any) => {
      this.remoteStreams.push(stream);
      this.updateParticipantCount();
    });

    this.sdkInstance.on('remoteStreamRemoved', (stream: any) => {
      this.remoteStreams = this.remoteStreams.filter(s => s !== stream);
      this.updateParticipantCount();
    });
  }

  joinMeeting() {
    // Join a room
    this.sdkInstance.joinRoom('roomId'); // Replace 'roomId' with your room identifier
  }

  endCall() {
    this.sdkInstance.leaveRoom();
    this.meetingJoined = false;
    this.participantCount = 0;
  }

  toggleMic() {
    this.isMicOn = !this.isMicOn;
    this.sdkInstance.toggleMic(this.isMicOn);
  }

  toggleVideo() {
    this.isVideoOn = !this.isVideoOn;
    this.sdkInstance.toggleVideo(this.isVideoOn);
  }

  toggleScreenShare() {
    this.isScreenShared = !this.isScreenShared;
    this.sdkInstance.toggleScreenShare(this.isScreenShared);
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      const newChatMessage: ChatMessage = {
        sender: 'You',
        avatar: 'https://cdn.builder.io/api/v1/image/assets/TEMP/a8cd93cfbc575632fd625e94e2e2aada9971a2f7a8dc8a17fb01c8ab4c452882?placeholderIfAbsent=true&apiKey=f35c25b17acb406083beeda46a28c843',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: this.newMessage.trim()
      };
      this.chatMessages.push(newChatMessage);
      this.newMessage = '';
    }
  }

  private loadMockChatMessages() {
    this.chatMessages = [
      {
        sender: 'You',
        avatar: 'https://cdn.builder.io/api/v1/image/assets/TEMP/a8cd93cfbc575632fd625e94e2e2aada9971a2f7a8dc8a17fb01c8ab4c452882?placeholderIfAbsent=true&apiKey=f35c25b17acb406083beeda46a28c843',
        time: '3:22 PM',
        message: 'Hello'
      },
      {
        sender: 'John',
        avatar: 'https://cdn.builder.io/api/v1/image/assets/TEMP/28447851b8acd8d9feca280325d6649abc84864e0b549bb8d26393e0fad1a914?placeholderIfAbsent=true&apiKey=f35c25b17acb406083beeda46a28c843',
        time: '3:23 PM',
        message: 'Hi there!'
      }
    ];
  }

  updateParticipantCount() {
    this.participantCount = this.remoteStreams.length + 1; // Including the local stream
  }
}
