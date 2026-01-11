import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { Animated, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadVoiceNotes, saveVoiceNotes } from "../storage/VoiceNoteStorage";
import { VoiceNote } from "../type/audio";

export default function HomeScreen() {
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [playbackDuration, setPlaybackDuration] = useState<number>(0);
  const insets = useSafeAreaInsets();
  const currentSound = useRef<Audio.Sound | null>(null);
  const currentlyPlayingNoteId = useRef<string | null>(null);

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Animated bars for recording visualization
  const bar1 = new Animated.Value(10);
  const bar2 = new Animated.Value(20);
  const bar3 = new Animated.Value(15);

  useEffect(() => {
    loadSavedVoiceNotes();
  }, []);

  async function loadSavedVoiceNotes() {
    const saved = await loadVoiceNotes();
    setVoiceNotes(saved.map(note => ({ ...note, isPlaying: false })));
  }

  // Start recording
  async function startRecording() {
    if (!noteTitle.trim()) {
      alert("Please enter a name for the voice note");
      return;
    }

    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setRecordingDuration(0);
      recording.setOnRecordingStatusUpdate((status) => {
        setRecordingDuration(status.durationMillis || 0);
      });
      startWaveAnimation();
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  // Stop recording
  async function stopRecording() {
    if (!recording) return;

    setRecordingDuration(0);
    await recording.stopAndUnloadAsync(); // Re-enabled to properly stop recording
    const uri = recording.getURI();
    const audioBlob = await fetch(uri!).then(r => r.blob());
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    const audioData: string = await new Promise(resolve => {
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
    });
    const status = await recording.getStatusAsync();
    const duration = Math.floor((status.durationMillis ?? 0) / 1000);

    if (!audioData) return;

    const newVoiceNote: VoiceNote = {
      id: Date.now().toString(),
      title: noteTitle,
      audioData,
      duration,
      createdAt: new Date(),
      isPlaying: false,
    };

    const updated = [newVoiceNote, ...voiceNotes];
    setVoiceNotes(updated);
    await saveVoiceNotes(updated);

    setRecording(null);
    setNoteTitle("");
  }

  // Play / Stop audio
  async function playVoiceNote(selectedNote: VoiceNote) {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });

      // If a sound is currently playing, stop it and reset its state
      if (currentSound.current && currentlyPlayingNoteId.current) {
        console.log("Stopping existing sound for note:", currentlyPlayingNoteId.current);
        await currentSound.current.stopAsync();
        await currentSound.current.unloadAsync();

        // Reset isPlaying state for the previously playing note
        setVoiceNotes(prevNotes =>
          prevNotes.map(note =>
            note.id === currentlyPlayingNoteId.current ? { ...note, isPlaying: false } : note
          )
        );
        currentSound.current = null;
        currentlyPlayingNoteId.current = null;
        setPlaybackPosition(0);
        setPlaybackDuration(0);
      }

      // If the selected note was the one just stopped (toggle play/pause for the same note)
      if (selectedNote.id === currentlyPlayingNoteId.current) {
        console.log("Toggling play/pause for current note (was already playing, now stopped):", selectedNote.id);
        return; // No need to restart if it was just stopped by toggling
      }

      console.log("Loading new sound from audioData for note:", selectedNote.id);
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: selectedNote.audioData });
      console.log("Sound created successfully.", newSound);
      currentSound.current = newSound;
      currentlyPlayingNoteId.current = selectedNote.id;

      const playbackStatus = await newSound.getStatusAsync();
      if (playbackStatus.isLoaded) {
        setPlaybackDuration(playbackStatus.durationMillis || 0);
        setPlaybackPosition(playbackStatus.positionMillis || 0);
      }

      console.log("Playing new sound...");
      await newSound.playAsync();
      console.log("Play command sent for note:", selectedNote.id);

      // Update isPlaying status for the newly playing note
      setVoiceNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === selectedNote.id ? { ...note, isPlaying: true } : note
        )
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          // MANDATORY VERIFICATION LOG
          console.log("Playback Status Update for", currentlyPlayingNoteId.current, ":", formatTime(status.positionMillis), "/", formatTime(status.durationMillis || 0));
          setPlaybackPosition(status.positionMillis);
          setPlaybackDuration(status.durationMillis || 0); // Ensure duration is also updated
          if (status.didJustFinish) {
            console.log("Playback finished for note:", currentlyPlayingNoteId.current);
            newSound.unloadAsync();
            currentSound.current = null;
            currentlyPlayingNoteId.current = null;
            setVoiceNotes(prevNotes =>
              prevNotes.map(note =>
                note.id === selectedNote.id ? { ...note, isPlaying: false } : note
              )
            );
            setPlaybackPosition(0);
            setPlaybackDuration(0);
          }
        }
      });
    } catch (err) {
      console.error("Failed to play sound for note", selectedNote.id, err);
      setVoiceNotes(prevNotes =>
        prevNotes.map(note => ({ ...note, isPlaying: false }))
      );
      currentSound.current = null;
      currentlyPlayingNoteId.current = null;
      setPlaybackPosition(0);
      setPlaybackDuration(0);
    }
  }

  // Delete note
  async function deleteVoiceNote(id: string) {
    const filtered = voiceNotes.filter((note: VoiceNote) => note.id !== id);
    setVoiceNotes(filtered);
    await saveVoiceNotes(filtered);
  }

  // Filter notes by search query
  const filteredNotes = voiceNotes.filter((note: VoiceNote) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Waveform animation
  function startWaveAnimation() {
    Animated.loop(
      Animated.parallel([
        animateBar(bar1, 10, 40, 300),
        animateBar(bar2, 15, 30, 200),
        animateBar(bar3, 20, 35, 250),
      ])
    ).start();
  }

  function animateBar(
    bar: Animated.Value,
    min: number,
    max: number,
    duration: number
  ) {
    return Animated.sequence([
      Animated.timing(bar, { toValue: max, duration, useNativeDriver: false }),
      Animated.timing(bar, { toValue: min, duration, useNativeDriver: false }),
    ]);
  }

  return (
    <View style={styles.background}>
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>AUDIO RECORDER</Text>
        </View>

        {/* Recording Section */}
        <View style={styles.recordingSection}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter voice note title"
              placeholderTextColor={Colors.textSecondary}
              value={noteTitle}
              onChangeText={setNoteTitle}
            />
            <Pressable
              style={({ pressed }) => [
                styles.recordButton,
                (!noteTitle && !recording) && styles.recordButtonDisabled,
                pressed && styles.recordButtonPressed,
              ]}
              onPress={recording ? stopRecording : startRecording}
              disabled={!noteTitle && !recording}
            >
              {recording ? (
                <Ionicons name="stop-circle" size={40} color={Colors.cardBackground} />
              ) : (
                <Ionicons name="mic-circle" size={40} color={Colors.cardBackground} />
              )}
            </Pressable>
          </View>

          {!noteTitle && (
            <Text style={styles.titlePrompt}>Please enter a title before recording</Text>
          )}

          {/* Recording waveform */}
          {recording && (
            <View style={styles.recordingActiveContainer}>
              <View style={styles.waveContainer}>
                <Animated.View style={[styles.waveBar, { height: bar1 }]} />
                <Animated.View style={[styles.waveBar, { height: bar2 }]} />
                <Animated.View style={[styles.waveBar, { height: bar3 }]} />
              </View>
              <Text style={styles.recordingTimerText}>{formatTime(recordingDuration)}</Text>
            </View>
          )}
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.search}
            placeholder="Search notes..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Voice notes list */}
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          extraData={[playbackPosition, playbackDuration]}
          renderItem={({ item }) => (
            <View style={styles.note}>
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.noteMeta}>
                  {item.isPlaying && playbackDuration > 0
                    ? `${formatTime(playbackPosition)} / ${formatTime(playbackDuration)}`
                    : formatTime(item.duration * 1000)}
                </Text>
              </View>

              <View style={styles.noteActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={() => playVoiceNote(item)}
                >
                  {item.isPlaying ? (
                    <Ionicons name="pause-circle" size={40} color={Colors.cardBackground} />
                  ) : (
                    <Ionicons name="play-circle" size={40} color={Colors.cardBackground} />
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.deleteButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={() => deleteVoiceNote(item.id)}
                >
                  <Ionicons name="trash" size={22} color={Colors.cardBackground} />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No voice notes yet</Text>
              <Text style={styles.emptySubtext}>
                Start by recording a new voice note above.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const Colors = {
  primary: "#4F46E5", // Indigo
  accent: "#14B8A6", // Teal
  background: "#F8FAFC", // Light Gray / Off-white
  cardBackground: "#FFFFFF", // White
  textPrimary: "#1E293B", // Dark Slate
  textSecondary: "#64748B", // Muted Gray
  error: "#EF4444", // Soft Red
  shadowColor: "#000000", // For general shadows
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  headerSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    backgroundColor: Colors.background,
    marginBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  searchSection: {
    marginBottom: 24,
    marginHorizontal: 16,
  },
  search: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 0,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  recordingSection: {
    marginBottom: 24,
    borderRadius: 15,
    padding: 16,
    backgroundColor: Colors.cardBackground,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
    marginHorizontal: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 50,
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  recordButtonDisabled: {
    opacity: 0.6,
    backgroundColor: Colors.textSecondary,
    shadowOpacity: 0.05,
    elevation: 2,
  },
  recordButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
    shadowRadius: 6,
    elevation: 4,
  },
  waveContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 8,
    paddingVertical: 16,
  },
  recordingActiveContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  recordingTimerText: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  waveBar: {
    width: 10,
    backgroundColor: Colors.accent,
    borderRadius: 5,
    minHeight: 15,
  },
  titlePrompt: {
    fontSize: 13,
    color: Colors.error,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  note: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  noteContent: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  noteTitle: {
    fontWeight: "600",
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  noteMeta: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "400",
  },
  noteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: Colors.error,
  },
  actionButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.92 }],
    shadowRadius: 4,
    elevation: 2,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    marginTop: 24,
    marginHorizontal: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
