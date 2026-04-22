import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [status, setStatus] = useState<'idle' | 'running' | 'finished'>('idle');
  const [showCamera, setShowCamera] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [timer, setTimer] = useState(0);
  const [currentRun, setCurrentRun] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (status === 'running') {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Load history to calculate streak
  useEffect(() => {
    const loadData = async () => {
      const saved = await AsyncStorage.getItem('RUN_HISTORY');
      if (saved) setHistory(JSON.parse(saved));
    };
    loadData();
  }, [status]);

  const saveRunToHistory = async (run: any) => {
    const updated = [...history, run];
    setHistory(updated);
    await AsyncStorage.setItem('RUN_HISTORY', JSON.stringify(updated));
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handlePress = () => {
    if (status === 'idle') {
      setTimer(0);
      setStatus('running');
    } else if (status === 'running') {
      const distance = (timer / 300).toFixed(2);
      const run = {
        id: Math.random().toString(36).substring(2),
        date: new Date().toISOString(),
        stats: { duration: timer, distance },
        reward: { photoUri: '' }
      };
      setCurrentRun(run);
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
    setShowReward(false);
    setShowCamera(true);
  };

  const takePhoto = async () => {
    if (isCapturing) return;
    try {
      if (cameraRef.current) {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        const finalRun = { ...currentRun, reward: { photoUri: photo.uri } };
        await saveRunToHistory(finalRun);
        Alert.alert('Saved!', 'Victory photo stored! 📸');
        setShowCamera(false);
        setIsCapturing(false);
      }
    } catch (e) {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP STATS BAR */}
      <View style={styles.header}>
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>STREAK: 5 DAYS</Text>
        </View>
        <View style={[styles.stageBadge, { backgroundColor: status === 'running' ? '#2563eb' : '#1e293b' }]}>
          <Text style={styles.stageText}>STAGE: {status.toUpperCase()}</Text>
        </View>
      </View>

      {/* 2. MAIN TIMER */}
      <Text style={styles.label}>RUN DURATION</Text>
      <Text style={styles.timerBold}>{formatTime(timer)}</Text>

      {/* 3. BUDDY AREA */}
      <View style={styles.buddyCard}>
        <Text style={styles.emojiDisplay}>
          {status === 'idle' ? '😴' : status === 'running' ? '🏃‍♂️' : '🎉'}
        </Text>
        <Text style={styles.buddyMood}>
          {status === 'idle' ? 'Buddy is resting...' : status === 'running' ? 'Tracking effort!' : 'Run Summary Ready!'}
        </Text>
      </View>

      {/* 4. PRIMARY BUTTON */}
      <TouchableOpacity style={[styles.actionBtn, status === 'running' && { backgroundColor: '#ef4444' }]} onPress={handlePress}>
        <Text style={styles.actionBtnText}>
          {status === 'idle' ? 'START RUN' : status === 'running' ? 'FINISH RUN' : 'RESET SESSION'}
        </Text>
      </TouchableOpacity>

      {/* REWARD MODAL */}
      <Modal visible={showReward} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Great Run! 📸</Text>
            <View style={styles.summaryStats}>
              <Text style={styles.sumText}>Time: {formatTime(timer)}</Text>
              <Text style={styles.sumText}>Distance: {(timer / 300).toFixed(2)} KM</Text>
            </View>
            <TouchableOpacity style={styles.rewardBtn} onPress={openCamera}>
              <Text style={styles.rewardBtnText}>Open Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowReward(false)} style={{ marginTop: 20 }}>
              <Text style={styles.skipText}>Skip reward</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CAMERA MODAL - FIXED UI */}
      <Modal visible={showCamera} animationType="fade">
        <CameraView style={styles.camera} ref={cameraRef} facing={facing}>
          {/* Top Controls */}
          <View style={styles.cameraTopControls}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
              <Text style={styles.iconEmoji}>🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowCamera(false)}>
              <Text style={styles.iconEmoji}>ⓧ</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Shutter */}
          <View style={styles.cameraBottomUI}>
            <TouchableOpacity style={styles.shutter} onPress={takePhoto} disabled={isCapturing}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
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
  cameraTopControls: { position: 'absolute', top: 60, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30 },
  iconBtn: { width: 50, height: 50, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  iconEmoji: { color: 'white', fontSize: 24 },
  cameraBottomUI: { position: 'absolute', bottom: 60, width: '100%', alignItems: 'center' },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' }
});