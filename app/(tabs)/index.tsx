import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [status, setStatus] = useState<'idle' | 'running' | 'finished'>('idle');
  const [showCamera, setShowCamera] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // 📸 NEW: State to track if we are using front or back camera
  const [facing, setFacing] = useState<'front' | 'back'>('back');

  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // STATE MACHINE
  const handlePress = () => {
    if (status === 'idle') {
      setStatus('running');
    } else if (status === 'running') {
      setStatus('finished');
      setShowReward(true);
    } else {
      setStatus('idle');
    }
  };

  // OPEN CAMERA
  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Permission Needed", "Buddy needs camera access for your victory photo!");
        return;
      }
    }
    setShowReward(false);
    setShowCamera(true);
  };

  // 📸 NEW: Toggle function to flip the camera
  const toggleCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // TAKE PHOTO
  const takePhoto = async () => {
    if (isCapturing) return;
    try {
      if (cameraRef.current) {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          skipProcessing: true,
        });
        console.log('PHOTO CAPTURED:', photo.uri);
        
        Alert.alert("Success!", "Buddy saved your photo! 📸");
        setShowCamera(false);
        setIsCapturing(false);
        setStatus('finished'); 
      }
    } catch (err) {
      Alert.alert("Error", "Could not take photo.");
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>STATUS</Text>
      <Text style={styles.status}>{status.toUpperCase()}</Text>

      <View style={styles.box}>
        <Text style={styles.emoji}>
          {status === 'idle' ? '😴' : status === 'running' ? '🏃‍♂️' : '🎉'}
        </Text>
        <Text style={styles.subtext}>
          {status === 'idle' ? 'Ready to start' : status === 'running' ? 'Running...' : 'Run complete!'}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>
          {status === 'idle' ? 'START RUN' : status === 'running' ? 'FINISH RUN' : 'RESET'}
        </Text>
      </TouchableOpacity>

      {/* REWARD MODAL */}
      <Modal visible={showReward} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Great Run 📸</Text>
            <TouchableOpacity style={[styles.primaryBtn, { marginBottom: 10 }]} onPress={openCamera}>
              <Text style={styles.primaryText}>Open Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowReward(false)}>
              <Text style={styles.secondaryText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CAMERA VIEW */}
      <Modal visible={showCamera} animationType="fade">
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing={facing} // 📸 Updated to use our new state
        >
          <View style={styles.cameraUI}>

            {/* 📸 NEW: Flip Camera Button (Top Left) */}
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCamera}
            >
              <Text style={styles.flipText}>🔄 FLIP</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.capture, isCapturing && { opacity: 0.5 }]} 
              onPress={takePhoto}
              disabled={isCapturing}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.close}
              onPress={() => setShowCamera(false)}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
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
  status: { fontSize: 22, fontWeight: '900', marginBottom: 20 },
  box: { width: '100%', height: 250, backgroundColor: 'white', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#e2e8f0' },
  emoji: { fontSize: 60 },
  subtext: { marginTop: 10, color: '#64748b', fontWeight: '500' },
  button: { width: '100%', backgroundColor: '#0f172a', padding: 18, borderRadius: 15, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '900', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: 'white', padding: 30, borderRadius: 30, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 25 },
  primaryBtn: { backgroundColor: '#2563eb', padding: 18, width: '100%', borderRadius: 15, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: 'bold' },
  secondaryText: { marginTop: 15, color: '#94a3b8', fontWeight: 'bold' },
  camera: { flex: 1 },
  cameraUI: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60 },
  
  // 📸 NEW: Flip Button Style
  flipButton: { position: 'absolute', top: 60, left: 30, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10 },
  flipText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  capture: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'white' },
  close: { position: 'absolute', top: 60, right: 30, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10 }
});