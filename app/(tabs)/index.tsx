import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [status, setStatus] = useState<'idle' | 'running' | 'finished'>('idle');
  const [showCamera, setShowCamera] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  
  // 📸 NEW: Preview States
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [timer, setTimer] = useState(0);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  const navigation = useNavigation();

// ⚡️ AUDITED STREAK LOGIC
  const calculateStreak = (runs: any[]) => {
    if (!runs || runs.length === 0) return 0;

    // 1. Convert all dates to Local YYYY-MM-DD (Fixes Timezone/Duplicate bugs)
    const localDates = runs.map(r => {
      const d = new Date(r.date);
      // Returns 'YYYY-MM-DD' in local time
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    });

    // 2. Remove duplicates (Multiple runs in one day = 1 streak day)
    const uniqueDates = Array.from(new Set(localDates)).sort((a, b) => b.localeCompare(a));

    // 3. Check if we have a run today or yesterday
    const now = new Date();
    const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    const yesterdayDate = new Date(Date.now() - 86400000);
    const yesterday = `${yesterdayDate.getFullYear()}-${(yesterdayDate.getMonth() + 1).toString().padStart(2, '0')}-${yesterdayDate.getDate().toString().padStart(2, '0')}`;

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

    // 4. Count backward consecutively
    let count = 0;
    let checkDate = new Date(uniqueDates[0]); // Start from the most recent run

    for (const dateStr of uniqueDates) {
      const current = new Date(dateStr);
      // If this date is the one we expect (consecutive), increment
      if (current.toDateString() === checkDate.toDateString()) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1); // Look for the previous day
      } else {
        break; // Gap found!
      }
    }
    return count;
  };

  const loadData = async () => {
    const saved = await AsyncStorage.getItem('RUN_HISTORY');
    if (saved) {
      const parsed = JSON.parse(saved);
      setHistory(parsed);
      setStreak(calculateStreak(parsed));
    } else {
      setHistory([]);
      setStreak(0);
      setStatus('idle');
      setTimer(0);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    let interval: any;
    if (status === 'running') {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handlePress = async () => {
    if (status === 'idle') {
      setTimer(0);
      setStatus('running');
    } else if (status === 'running') {
      const distance = (timer / 300).toFixed(2);
      const newRunId = Math.random().toString(36).substring(2);
      const run = {
        id: newRunId,
        date: new Date().toISOString(),
        stats: { duration: timer, distance },
        reward: { photoUri: '' }
      };
      
      const updatedHistory = [...history, run];
      await AsyncStorage.setItem('RUN_HISTORY', JSON.stringify(updatedHistory));
      
      // 🔥 SYNC FIX: Update local state immediately
      setHistory(updatedHistory);
      setStreak(calculateStreak(updatedHistory)); 
      
      setCurrentRunId(newRunId);
      setStatus('finished');
      setShowReward(true);
    } else {
      setStatus('idle');
      setTimer(0);
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return Alert.alert('Permission needed');
    }
    setCapturedPhoto(null);
    setShowPreview(false);
    setShowReward(false);
    setShowCamera(true);
  };

  const takePhoto = async () => {
    if (isCapturing) return;
    try {
      if (cameraRef.current) {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        setCapturedPhoto(photo.uri);
        setShowPreview(true); // Switch to preview
        setIsCapturing(false);
      }
    } catch (e) { setIsCapturing(false); }
  };

  const saveFinalPhoto = async () => {
    if (!capturedPhoto) return;
    const updatedHistory = history.map(r => 
      r.id === currentRunId ? { ...r, reward: { photoUri: capturedPhoto } } : r
    );
    await AsyncStorage.setItem('RUN_HISTORY', JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
    setShowCamera(false);
    setShowPreview(false);
    Alert.alert('Success!', 'Victory photo saved! 📸');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>STREAK: {streak} {streak === 1 ? 'DAY' : 'DAYS'}</Text>
        </View>
        <View style={[styles.stageBadge, { backgroundColor: status === 'running' ? '#2563eb' : '#1e293b' }]}>
          <Text style={styles.stageText}>STAGE: {status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.label}>RUN DURATION</Text>
      <Text style={styles.timerBold}>{formatTime(timer)}</Text>
      
      <View style={styles.buddyCard}>
        <Text style={styles.emojiDisplay}>{status === 'idle' ? '😴' : status === 'running' ? '🏃‍♂️' : '🎉'}</Text>
        <Text style={styles.buddyMood}>{status === 'idle' ? 'Buddy is resting...' : status === 'running' ? 'Tracking effort!' : 'Run Summary Ready!'}</Text>
      </View>

      <TouchableOpacity style={[styles.actionBtn, status === 'running' && { backgroundColor: '#ef4444' }]} onPress={handlePress}>
        <Text style={styles.actionBtnText}>{status === 'idle' ? 'START RUN' : status === 'running' ? 'FINISH RUN' : 'RESET SESSION'}</Text>
      </TouchableOpacity>

      <Modal visible={showReward} transparent animationType="slide">
        <View style={styles.modalOverlay}><View style={styles.modalBox}><Text style={styles.modalTitle}>Great Run! 📸</Text><View style={styles.summaryStats}><Text style={styles.sumText}>Time: {formatTime(timer)}</Text><Text style={styles.sumText}>Distance: {(timer / 300).toFixed(2)} KM</Text></View>
        <TouchableOpacity style={styles.rewardBtn} onPress={openCamera}><Text style={styles.rewardBtnText}>Open Camera</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setShowReward(false)} style={{ marginTop: 20 }}><Text style={styles.skipText}>Skip reward</Text></TouchableOpacity></View></View>
      </Modal>

      {/* CAMERA & PREVIEW MODAL */}
      <Modal visible={showCamera} animationType="fade">
        {!showPreview ? (
          <CameraView style={styles.camera} ref={cameraRef} facing={facing}>
            <View style={styles.cameraTopControls}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}><Text style={styles.iconEmoji}>🔄</Text></TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setShowCamera(false)}><Text style={styles.iconEmoji}>ⓧ</Text></TouchableOpacity>
            </View>
            <View style={styles.cameraBottomUI}>
              <TouchableOpacity style={styles.shutter} onPress={takePhoto} disabled={isCapturing}><View style={styles.shutterInner} /></TouchableOpacity>
            </View>
          </CameraView>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedPhoto! }} style={styles.previewImage} />
            <View style={styles.previewControls}>
              <TouchableOpacity style={styles.retakeBtn} onPress={() => setShowPreview(false)}>
                <Text style={styles.retakeText}>RETAKE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveFinalPhoto}>
                <Text style={styles.saveText}>USE PHOTO</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 30, paddingTop: 60, alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 40 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#ffedd5' },
  streakEmoji: { fontSize: 14, marginRight: 5 },
  streakText: { fontSize: 10, fontWeight: '900', color: '#f97316' },
  stageBadge: { padding: 8, borderRadius: 12 },
  stageText: { color: 'white', fontSize: 10, fontWeight: '900' },
  label: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', letterSpacing: 2 },
  timerBold: { fontSize: 56, fontWeight: '900', color: '#0f172a', marginVertical: 10 },
  buddyCard: { width: '100%', height: 260, backgroundColor: 'white', borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginVertical: 20, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  emojiDisplay: { fontSize: 70 },
  buddyMood: { marginTop: 15, color: '#64748b', fontWeight: '600' },
  actionBtn: { width: '100%', backgroundColor: '#0f172a', padding: 20, borderRadius: 20, alignItems: 'center' },
  actionBtnText: { color: 'white', fontWeight: '900', fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: 'white', padding: 30, borderRadius: 30, alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 20 },
  summaryStats: { backgroundColor: '#f1f5f9', width: '100%', padding: 15, borderRadius: 15, marginBottom: 25 },
  sumText: { fontWeight: '700', color: '#475569', textAlign: 'center', marginVertical: 2 },
  rewardBtn: { backgroundColor: '#2563eb', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  rewardBtnText: { color: 'white', fontWeight: 'bold' },
  skipText: { color: '#94a3b8', fontWeight: '800' },
  camera: { flex: 1 },
  previewContainer: { flex: 1, backgroundColor: 'black' },
  previewImage: { flex: 1, resizeMode: 'cover' },
  previewControls: { position: 'absolute', bottom: 60, width: '100%', flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 20 },
  retakeBtn: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 18, borderRadius: 15, width: '45%', alignItems: 'center', borderWidth: 1, borderColor: 'white' },
  retakeText: { color: 'white', fontWeight: '900' },
  saveBtn: { backgroundColor: 'white', padding: 18, borderRadius: 15, width: '45%', alignItems: 'center' },
  saveText: { color: 'black', fontWeight: '900' },
  cameraTopControls: { position: 'absolute', top: 60, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30 },
  iconBtn: { width: 50, height: 50, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  iconEmoji: { color: 'white', fontSize: 24 },
  cameraBottomUI: { position: 'absolute', bottom: 60, width: '100%', alignItems: 'center' },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' }
});