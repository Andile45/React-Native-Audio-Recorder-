import AsyncStorage from "@react-native-async-storage/async-storage";
import { VoiceNote } from "../type/audio";

const STORAGE_KEY = "VOICE_NOTES";

export async function loadVoiceNotes(): Promise<VoiceNote[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export async function saveVoiceNotes(notes: VoiceNote[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}
