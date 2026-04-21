import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// This is the "Brain" of your Home Screen
export default function HomeScreen() {
  /**
   * STEP 1: Define our States
   * We have 3 states: 'idle', 'running', 'finished'
   */
  const [status, setStatus] = useState('idle');

  /**
   * STEP 2: The Transition Logic
   * This function handles the cycle: idle -> running -> finished -> idle
   */
  const handlePress = () => {
    if (status === 'idle') {
      setStatus('running');
    } else if (status === 'running') {
      setStatus('finished');
    } else if (status === 'finished') {
      setStatus('idle');
    }
  };

  /**
   * STEP 3: Helper to get the Button Text based on the state
   */
  const getButtonText = () => {
    if (status === 'idle') return 'START RUN';
    if (status === 'running') return 'FINISH RUN';
    if (status === 'finished') return 'RESET TO IDLE';
    return 'ERROR';
  };

  return (
    <View style={styles.container}>
      {/* State Display */}
      <View style={styles.stateContainer}>
        <Text style={styles.label}>CURRENT STATUS</Text>
        <View style={[
          styles.badge, 
          status === 'running' ? styles.badgeRunning : 
          status === 'finished' ? styles.badgeFinished : styles.badgeIdle
        ]}>
          <Text style={styles.badgeText}>{status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Buddy Placeholder (Visual indicator of state) */}
      <View style={styles.buddyBox}>
        <Text style={styles.buddyEmoji}>
          {status === 'idle' && '😴'}
          {status === 'running' && '🏃‍♂️'}
          {status === 'finished' && '🥳'}
        </Text>
        <Text style={styles.buddyText}>
          {status === 'idle' && 'Buddy is resting...'}
          {status === 'running' && 'Buddy is moving!'}
          {status === 'finished' && 'Buddy is proud of you!'}
        </Text>
      </View>

      {/* The Simulation Button */}
      <TouchableOpacity 
        style={[
          styles.button, 
          status === 'running' ? styles.buttonStop : styles.buttonStart
        ]} 
        onPress={handlePress}
      >
        <Text style={styles.buttonText}>{getButtonText()}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Minimal Styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  stateContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 2,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeIdle: { backgroundColor: '#64748b' },
  badgeRunning: { backgroundColor: '#2563eb' },
  badgeFinished: { backgroundColor: '#16a34a' },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buddyBox: {
    width: '100%',
    height: 250,
    backgroundColor: 'white',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  buddyEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  buddyText: {
    color: '#64748b',
    fontWeight: '600',
  },
  button: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  buttonStart: { backgroundColor: '#0f172a' },
  buttonStop: { backgroundColor: '#ef4444' },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
});