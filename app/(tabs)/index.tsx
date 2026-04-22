import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [status, setStatus] = useState<'idle' | 'running' | 'finished'>('idle');
  const [showCamera, setShowCamera] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [timer, setTimer] = useState(0);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  // 🔥 NEW: GRACE SYSTEM STATE
  const [streakStatus, setStreakStatus] = useState<"active" | "grace" | "broken">("broken");

  const [streakMessage, setStreakMessage] = useState("");
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevStreak = useRef(0);
  const navigation = useNavigation();

  // 🛡 GRACE SYSTEM HELPER (Pure Calendar Calculation)
  const determineStreakStatus = (lastRunDateStr: string | null, todayStr: string) => {
    if (!lastRunDateStr) return "broken";
    const [y1, m1, d1] = lastRunDateStr.split('-').map(Number);
    const [y2, m2, d2] = todayStr.split('-').map(Number);
    const date1 = new Date(y1, m1 - 1, d1);
    const date2 = new Date(y2, m2 - 1, d2);
    const diffTime = date2.getTime() - date1.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return "active"; // Same day or Yesterday
    if (diffDays === 2) return "grace"; // Missed 1 full day
    return "broken"; // Missed 2+ full days
  };

  // HEADING LOGIC
  useEffect(() => {
    if (streak > prevStreak.current && streak > 0) {
      let msg = "NICE START";
      if (streak >= 14) msg = "ELITE CONSISTENCY";
      else if (streak >= 7) msg = "YOU’RE ON FIRE";
      else if (streak >= 3) msg = "BUILDING MOMENTUM";
      setStreakMessage(msg);
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true })
      ]).start();
    }
    prevStreak.current = streak;
  }, [streak]);

  // 🔥 STREAK CALCULATION
  const calculateStreak = (runs: any[], offset: number) => {
    if (!runs || runs.length === 0) return 0;
    
    const getPrevDay = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dObj = new Date(y, m - 1, d - 1); 
      return `${dObj.getFullYear()}-${(dObj.getMonth() + 1).toString().padStart(2, '0')}-${dObj.getDate().toString().padStart(2, '0')}`;
    };

    const allDates = runs.map(r => r.date.split('T')[0]);
    const sortedUnique = Array.from(new Set(allDates)).sort((a, b) => b.localeCompare(a));

    const d = new Date();
    d.setDate(d.getDate() + offset);
    const todayStr = d.toISOString().split('T')[0];
    const yesterdayStr = getPrevDay(todayStr);
    const twoDaysAgoStr = getPrevDay(yesterdayStr); // 🔥 NEW: Grace day reference

    // 🔥 UPDATED: Only return 0 if the last run is older than 2 calendar days
    if (sortedUnique[0] !== todayStr && sortedUnique[0] !== yesterdayStr && sortedUnique[0] !== twoDaysAgoStr) {
      return 0;
    }

    let streakCount = 0;
    let expectedDay = sortedUnique[0];
    for (const actualDay of sortedUnique) {
      if (actualDay === expectedDay) {
        streakCount++;
        expectedDay = getPrevDay(expectedDay);
      } else break;
    }
    return streakCount;
  };

  const loadData = async () => {
    const saved = await AsyncStorage.getItem('RUN_HISTORY');
    const offRaw = await AsyncStorage.getItem('DEV_OFFSET');
    const off = offRaw ? parseInt(offRaw) : 0;
    
    if (saved) {
      const parsed = JSON.parse(saved);
      const runHistory = parsed;
      setHistory(runHistory);
      
      const currentStreak = calculateStreak(runHistory, off);
      setStreak(currentStreak);

      // 🔥 UPDATE GRACE STATUS
      const d = new Date();
      d.setDate(d.getDate() + off);
      const todayStr = d.toISOString().split('T')[0];
      const lastRun = runHistory.length > 0 ? runHistory[runHistory.length - 1].date.split('T')[0] : null;
      setStreakStatus(determineStreakStatus(lastRun, todayStr));

    } else {
      setHistory([]);
      setStreak(0);
      setStreakStatus("broken");
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
      const offRaw = await AsyncStorage.getItem('DEV_OFFSET');
      const off = offRaw ? parseInt(offRaw) : 0;
      const d = new Date();
      d.setDate(d.getDate() + off);
      const newRunId = Math.random().toString(36).substring(2);
      const run = {
        id: newRunId,
        date: d.toISOString(),
        stats: { duration: timer, distance: (timer / 300).toFixed(2) },
        reward: { photoUri: '' }
      };
      
      const updatedHistory = [...history, run];
      await AsyncStorage.setItem('RUN_HISTORY', JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
      setStreak(calculateStreak(updatedHistory, off)); 
      setCurrentRunId(newRunId);
      setStatus('finished');
      setShowReward(true);
    } else {
      setStatus('idle');
      setTimer(0);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
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
        setShowPreview(true);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.streakBadge, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>STREAK: {streak} {streak === 1 ? 'DAY' : 'DAYS'}</Text>
        </Animated.View>
        <View style={[styles.stageBadge, { backgroundColor: status === 'running' ? '#2563eb' : '#1e293b' }]}>
          <Text style={styles.stageText}>STAGE: {status.toUpperCase()}</Text>
        </View>
      </View>

      {/* 🔥 UI: GRACE & FEEDBACK MESSAGES */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        {streak > 0 && streakStatus === 'active' && <Text style={styles.feedbackMessage}>{streakMessage}</Text>}
        {streakStatus === "grace" && (
          <View style={styles.graceWarning}>
            <Text style={styles.graceText}>🛡 Still in recovery window</Text>
          </View>
        )}
        {streakStatus === "broken" && history.length > 0 && (
          <Text style={styles.brokenMessage}>STREAK RESET ⚠️</Text>
        )}
      </View>
      
      <Text style={styles.label}>RUN DURATION</Text>
      <Text style={styles.timerBold}>{formatTime(timer)}</Text>
      
      <View style={styles.buddyCard}>
        <Text style={styles.emojiDisplay}>{status === 'idle' ? '😴' : status === 'running' ? '🏃♂️' : '🎉'}</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#ffedd5' },
  streakEmoji: { fontSize: 14, marginRight: 5 },
  streakText: { fontSize: 10, fontWeight: '900', color: '#f97316' },
  feedbackMessage: { fontSize: 12, fontWeight: '800', color: '#f97316', letterSpacing: 1 },
  graceWarning: { backgroundColor: '#fef2f2', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#fee2e2' },
  graceText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },
  brokenMessage: { fontSize: 10, fontWeight: '800', color: '#94a3b8' },
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