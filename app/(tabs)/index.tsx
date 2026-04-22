import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from 'expo-router';
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
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  const navigation = useNavigation();

  // 🔥 DETECT RESET: Listen for tab focus and fresh storage
  const loadData = async () => {
    const saved = await AsyncStorage.getItem('RUN_HISTORY');
    if (saved) {
      const parsed = JSON.parse(saved);
      setHistory(parsed);
      setStreak(calculateStreak(parsed));
    } else {
      // CLEAR EVERYTHING IF STORAGE IS EMPTY
      setHistory([]);
      setStreak(0);
      setStatus('idle');
      setTimer(0);
      setCurrentRunId(null);
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

  const calculateStreak = (runs: any[]) => {
    if (!runs || runs.length === 0) return 0;
    const dates = Array.from(new Set(runs.map(r => new Date(r.date).toISOString().split('T')[0]))).sort((a, b) => b.localeCompare(a));
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    let count = 0, expected = new Date(dates[0]);
    for (const d of dates) {
      if (new Date(d).toDateString() === expected.toDateString()) { count++; expected.setDate(expected.getDate() - 1); }
      else break;
    }
    return count;
  };

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
      setHistory(updatedHistory);
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
    setShowReward(false);
    setShowCamera(true);
  };

  const takePhoto = async () => {
    if (isCapturing) return;
    try {
      if (cameraRef.current) {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        const updatedHistory = history.map(r => 
          r.id === currentRunId ? { ...r, reward: { photoUri: photo.uri } } : r
        );
        await AsyncStorage.setItem('RUN_HISTORY', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
        setShowCamera(false);
        setIsCapturing(false);
        Alert.alert('Saved!', 'Victory photo pinned! 📸');
      }
    } catch (e) { setIsCapturing(false); }
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
          {/* 🔥 GRAMMAR FIX: 1 Day vs X Days */}
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
      <Modal visible={showCamera} animationType="fade">
        <CameraView style={styles.camera} ref={cameraRef} facing={facing}><View style={styles.cameraTopControls}><TouchableOpacity style={styles.iconBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}><Text style={styles.iconEmoji}>🔄</Text></TouchableOpacity><TouchableOpacity style={styles.iconBtn} onPress={() => setShowCamera(false)}><Text style={styles.iconEmoji}>ⓧ</Text></TouchableOpacity></View><View style={styles.cameraBottomUI}><TouchableOpacity style={styles.shutter} onPress={takePhoto} disabled={isCapturing}><View style={styles.shutterInner} /></TouchableOpacity></View></CameraView>
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