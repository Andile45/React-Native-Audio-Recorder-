export type VoiceNote = {
  id: string;
  title: string;
  audioData: string; // Storing as base64 string
  duration: number;
  createdAt: Date;
  isPlaying: boolean;
}
