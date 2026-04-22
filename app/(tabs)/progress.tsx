import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProgressScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const navigation = useNavigation();

// ⚡️ AUDITED: Pure String-Based Streak Logic (Fixed Timezone & Locale)
  const calculateStreak = (runs: any[]) => {
    if (!runs || runs.length === 0) return 0;

    // Helper: Step-back 1 day using pure string math logic (via numeric constructor)
    const getPrevDay = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      // Using numeric constructor is safe and locale-independent
      const dObj = new Date(y, m - 1, d - 1); 
      return `${dObj.getFullYear()}-${(dObj.getMonth() + 1).toString().padStart(2, '0')}-${dObj.getDate().toString().padStart(2, '0')}`;
    };

    // 1. Extract UTC date strings (String-only: '2024-04-22')
    // No "new Date(dateStr)" used here.
    const allDates = runs.map(r => r.date.split('T')[0]);

    // 2. Filter Unique & Sort Newest to Oldest (String comparison)
    const sortedUnique = Array.from(new Set(allDates)).sort((a, b) => b.localeCompare(a));

    // 3. Get Reference Strings (Today/Yesterday in UTC)
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = getPrevDay(todayStr);

    // 4. Verify Streak is alive
    if (sortedUnique[0] !== todayStr && sortedUnique[0] !== yesterdayStr) return 0;

    // 5. String-comparison loop
    let streakCount = 0;
    let expectedDay = sortedUnique[0];

    for (const actualDay of sortedUnique) {
      if (actualDay === expectedDay) {
        streakCount++;
        expectedDay = getPrevDay(expectedDay); // Step expected day back
      } else {
        break; // Gap detected
      }
    }
    return streakCount;
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
      setSelectedRun(null);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // 🔥 CORE FIX: FILTER OUT ANY RUNS WITHOUT A PHOTO URI
  const photoRuns = history.filter(run => run.reward?.photoUri && run.reward.photoUri !== '');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.viewLabel}>View 02: Verification</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TOTAL RUNS</Text>
          <Text style={styles.statValue}>{history.length}</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#f97316' }]}>
          {/* 🔥 GRAMMAR FIX: 1 Day vs X Days */}
          <Text style={[styles.statLabel, { color: '#f97316' }]}>{streak === 1 ? 'DAY STREAK' : 'DAYS STREAK'}</Text>
          <Text style={[styles.statValue, { color: '#f97316' }]}>{streak}</Text>
        </View>
      </View>
      
      <View style={styles.reelCard}>
        <Text style={styles.reelTitle}>MOMENT REEL</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reelScroll}>
          {photoRuns.length === 0 ? (
            <Text style={styles.emptyText}>No victory photos captured yet!</Text>
          ) : (
            photoRuns.map((run, i) => (
              <TouchableOpacity key={i} onPress={() => setSelectedRun(run)} style={styles.snapshot}>
                <Image source={{ uri: run.reward?.photoUri }} style={styles.image} />
                <Text style={styles.dateLabel}>{new Date(run.date).toLocaleDateString()}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
      
      <Modal visible={!!selectedRun} transparent animationType="fade">
        <View style={styles.fullOverlay}>
          <View style={styles.viewerBox}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedRun(null)}>
              <Text style={{ fontWeight: 'bold', color: '#94a3b8' }}>CLOSE</Text>
            </TouchableOpacity>
            {selectedRun?.reward?.photoUri && <Image source={{ uri: selectedRun.reward.photoUri }} style={styles.fullImage} />}
            <View style={styles.details}>
              <Text style={styles.detailTitle}>RUN SUMMARY</Text>
              <Text style={styles.detailText}>Time: {formatDuration(selectedRun?.stats.duration || 0)}</Text>
              <Text style={styles.detailText}>Distance: {selectedRun?.stats.distance} KM</Text>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={() => alert('Sharing logic coming soon!')}>
              <Text style={styles.shareBtnText}>📤 SHARE MOMENT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 25, paddingTop: 60 },
  viewLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 2, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statCard: { flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 25, borderWidth: 1, borderColor: '#e2e8f0' },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 5 },
  statValue: { fontSize: 32, fontWeight: '900' },
  reelCard: { backgroundColor: '#0f172a', borderRadius: 30, padding: 25 },
  reelTitle: { color: 'white', fontSize: 18, fontWeight: '900', marginBottom: 20 },
  reelScroll: { gap: 15 },
  emptyText: { color: 'white', opacity: 0.3, fontStyle: 'italic' },
  snapshot: { width: 120, alignItems: 'center' },
  image: { width: 120, height: 160, borderRadius: 15, backgroundColor: '#1e293b' },
  dateLabel: { color: 'white', fontSize: 10, marginTop: 8, opacity: 0.5 },
  fullOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  viewerBox: { width: '100%', backgroundColor: 'white', borderRadius: 35, padding: 20, alignItems: 'center' },
  closeBtn: { alignSelf: 'flex-end', padding: 10 },
  fullImage: { width: '100%', height: 350, borderRadius: 25, marginBottom: 20 },
  details: { width: '100%', marginBottom: 25, alignItems: 'center' },
  detailTitle: { fontSize: 12, fontWeight: '900', color: '#94a3b8', marginBottom: 5 },
  detailText: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  shareBtn: { backgroundColor: '#0f172a', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  shareBtnText: { color: 'white', fontWeight: '900' }
});