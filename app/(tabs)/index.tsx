import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [status, setStatus] = useState('idle');

  return (
    <View style={styles.container}>
      {/* System Status Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.viewLabel}>View 01: Core</Text>
          <View style={[styles.stateBadge, { backgroundColor: status === 'running' ? '#2563eb' : '#1e293b' }]}>
            <Text style={styles.stateBadgeText}>STATE: {status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Main UI Card */}
      <View style={styles.mainCard}>
        <View style={[styles.buddyBox, { backgroundColor: status === 'running' ? '#f0f7ff' : '#f8fafc', borderColor: status === 'running' ? '#dbeafe' : '#e2e8f0' }]}>
          <Text style={[styles.buddyText, { color: status === 'running' ? '#3b82f6' : '#94a3b8' }]}>
            {status === 'running' ? '[Buddy: Active]' : '[Buddy: Idle]'}
          </Text>
          {status === 'running' && <View style={styles.spinnerPlaceholder} />}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {status === 'running' ? '14:22' : 'Ready to roll?'}
          </Text>
          <Text style={styles.subtitle}>
            {status === 'running' ? 'Simulation Active' : 'Your buddy is waiting for movement.'}
          </Text>
        </View>

        <TouchableOpacity 
          activeOpacity={0.9}
          style={[styles.button, status === 'running' ? styles.stopBtn : styles.runBtn]}
          onPress={() => setStatus(status === 'running' ? 'finished' : 'running')}
        >
          <Text style={styles.buttonText}>
            {status === 'running' ? 'STOP RUN' : 'SIMULATE RUN'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>RUN_BUDDY_ALPHA  •  BUILD.PROTO.LOGIC</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 25 },
  header: { marginBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 2 },
  stateBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  stateBadgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
  mainCard: { backgroundColor: 'white', borderRadius: 40, padding: 30, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, borderStyle: 'solid', borderColor: '#f1f5f9', borderWidth: 1 },
  buddyBox: { height: 220, borderRadius: 30, borderStyle: 'dashed', borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  buddyText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  spinnerPlaceholder: { marginTop: 15, width: 30, height: 30, borderRadius: 15, borderTopWidth: 3, borderColor: '#3b82f6', borderLeftWidth: 3, borderLeftColor: 'transparent' },
  textContainer: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 5, fontWeight: '500' },
  button: { width: '100%', paddingVertical: 20, borderRadius: 15, alignItems: 'center' },
  runBtn: { backgroundColor: '#0f172a' },
  stopBtn: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '900' },
  footer: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  footerText: { fontSize: 10, fontWeight: 'bold', color: '#cbd5e1', letterSpacing: 2 }
});