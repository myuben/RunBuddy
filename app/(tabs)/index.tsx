import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  // --- 1. CORE STATES ---
  const [status, setStatus] = useState<'idle' | 'running' | 'finished'>('idle');
  const [showCamera, setShowCamera] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // --- 2. RUN DATA STATES ---
  const [timer, setTimer] = useState(0); // Real seconds elapsed
  const [currentRun, setCurrentRun] = useState<any>(null); // Our Run Object

  // --- 3. TIMER LOGIC ---
  useEffect(() => {
    let interval: any;
    if (status === 'running') {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval); 
  }, [status]);

  // Helper to turn 72 seconds into "01:12"
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- 4. STATE TRANSITIONS ---
  const handlePress = () => {
    if (status === 'idle') {
      // RESET AND START
      setTimer(0);
      setStatus('running');
    } else if (status === 'running') {
      // FINISH AND CALCULATE DATA
      const calculatedDistance = (timer / 300).toFixed(2); // Simulated distance

      const newRun = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        stats: {
          duration: timer,
          distance: calculatedDistance,
        },
        reward: {
          photoUri: '',
        }
      };
      
      setCurrentRun(newRun); // Create the object
      setStatus('finished');
      setShowReward(true); // Trigger pop-up
    } else {
      // GO BACK TO IDLE
      setStatus('idle');
      setCurrentRun(null);
      setTimer(0);
    }
  };

  // --- 5. CAMERA LOGIC ---
  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return Alert.alert("Permission Error", "Buddy needs the camera!");
    }
    setShowReward(false);
    setShowCamera(true);
  };

  const takePhoto = async () => {
    if (isCapturing) return;
    try {
      if (cameraRef.current) {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          skipProcessing: true,
        });

        // Save the Photo URI into our Run Object
        setCurrentRun((prev: any) => ({
          ...prev,
          reward: { photoUri: photo.uri }
        }));

        Alert.alert("Success!", "Run data & photo saved! 📸");
        setShowCamera(false);
        setIsCapturing(false);
        setStatus('finished'); 
      }
    } catch (err) {
      Alert.alert("Error", "Could not capture photo.");
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER: REAL TIME DISPLAY */}
      <Text style={styles.label}>RUN DURATION</Text>
      <Text style={styles.status}>{formatTime(timer)}</Text>

      {/* CENTER BOX: BUDDY EMOJI */}
      <View style={styles.box}>
        <Text style={styles.emoji}>
          {status === 'idle' ? '😴' : status === 'running' ? '🏃‍♂️' : '🎉'}
        </Text>
        <Text style={styles.subtext}>
          {status === 'idle' ? 'Buddy is ready!' : status === 'running' ? 'Tracking movement...' : 'Run finished!'}
        </Text>
      </View>

      {/* MAIN START/STOP BUTTON */}
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>
          {status === 'idle' ? 'START RUN' : status === 'running' ? 'FINISH RUN' : 'RESET'}
        </Text>
      </TouchableOpacity>

      {/* REWARD MODAL (Summary with distance) */}
      <Modal visible={showReward} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Great Run! 📸</Text>
            
            <View style={styles.statsPreview}>
              <Text style={styles.statsText}>Time: {formatTime(currentRun?.stats?.duration || 0)}</Text>
              <Text style={styles.statsText}>Distance: {currentRun?.stats?.distance || "0.00"} KM</Text>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={openCamera}>
              <Text style={styles.primaryText}>Capture Victory</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowReward(false)} style={{marginTop: 15}}>
              <Text style={styles.secondaryText}>Skip reward</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FULL SCREEN CAMERA */}
      <Modal visible={showCamera} animationType="fade">
        <CameraView style={styles.camera} ref={cameraRef} facing={facing}>
          <View style={styles.cameraUI}>
            
            {/* Stats Overlay on Camera */}
            <View style={styles.cameraTimer}>
              <Text style={styles.cameraTimerText}>
                {formatTime(currentRun?.stats?.duration || 0)} | {currentRun?.stats?.distance || "0.00"} KM
              </Text>
            </View>

            {/* Selfie Flip Button */}
            <TouchableOpacity style={styles.flipButton} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
              <Text style={styles.flipText}>🔄 FLIP</Text>
            </TouchableOpacity>

            {/* Circle Capture Button */}
            <TouchableOpacity 
              style={[styles.capture, isCapturing && { opacity: 0.5 }]} 
              onPress={takePhoto} 
              disabled={isCapturing}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.close} onPress={() => setShowCamera(false)}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', padding: 30 },
  label: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', letterSpacing: 2 },
  status: { fontSize: 48, fontWeight: '900', marginBottom: 20, color: '#0f172a' },
  box: { width: '100%', height: 250, backgroundColor: 'white', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#e2e8f0' },
  emoji: { fontSize: 60 },
  subtext: { marginTop: 10, color: '#64748b', fontWeight: '600' },
  button: { width: '100%', backgroundColor: '#0f172a', padding: 18, borderRadius: 15, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '900', fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: 'white', padding: 30, borderRadius: 30, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10 },
  statsPreview: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 15, marginBottom: 25, width: '100%', alignItems: 'center' },
  statsText: { fontSize: 16, color: '#64748b', fontWeight: 'bold', marginVertical: 2 },
  
  primaryBtn: { backgroundColor: '#2563eb', padding: 18, width: '100%', borderRadius: 15, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: 'bold' },
  secondaryText: { color: '#94a3b8', fontWeight: 'bold' },
  
  camera: { flex: 1 },
  cameraUI: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60 },
  cameraTimer: { position: 'absolute', top: 120, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  cameraTimerText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  flipButton: { position: 'absolute', top: 60, left: 30, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10 },
  flipText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  capture: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'white' },
  close: { position: 'absolute', top: 60, right: 30, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10 }
});