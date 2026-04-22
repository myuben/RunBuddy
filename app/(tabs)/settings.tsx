import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const [offset, setOffset] = useState(0);
  const navigation = useNavigation();

  const loadOffset = async () => {
    const val = await AsyncStorage.getItem('DEV_OFFSET');
    setOffset(val ? parseInt(val) : 0);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadOffset);
    return unsubscribe;
  }, [navigation]);

  // 1. RESET ALL DATA
  const resetData = async () => {
    Alert.alert("RESET EVERYTHING?", "This wipes your runs, streak, and simulation.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Reset", 
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          setOffset(0);
          Alert.alert("Success", "Buddy is fresh.");
        }
      }
    ]);
  };

  // 2. ADD FAKE RUN
  const addFakeRun = async () => {
    const saved = await AsyncStorage.getItem('RUN_HISTORY');
    const history = saved ? JSON.parse(saved) : [];
    
    // 🔥 We use the SIMULATED DATE for the fake run
    const d = new Date();
    d.setDate(d.getDate() + offset);
    
    const run = {
      id: Math.random().toString(36).substring(2),
      date: d.toISOString(),
      stats: { duration: 300, distance: "1.20" },
      reward: { photoUri: '' }
    };

    const updated = [...history, run];
    await AsyncStorage.setItem('RUN_HISTORY', JSON.stringify(updated));
    Alert.alert("Success", `Fake run added for: ${d.toISOString().split('T')[0]}`);
  };

  // 3. SIMULATE NEXT DAY
  const simulateNextDay = async () => {
    const newOffset = offset + 1;
    await AsyncStorage.setItem('DEV_OFFSET', newOffset.toString());
    setOffset(newOffset);
    Alert.alert("Simulation Moved", `Date jumped +1 day. Total offset: ${newOffset}d`);
  };

  const sections = [
    { title: 'PROFILE', items: ['Edit Name', 'Link Strava'] },
    { title: 'TESTING (DEV ONLY)', items: ['➕ Add Fake Run', '⏳ Simulate Next Day', '⚠️ Reset Data'] }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.viewLabel}>View 03: Profile</Text>

      {sections.map((section, i) => (
        <View key={i} style={styles.section}>
          <Text style={[styles.sectionTitle, section.title === 'TESTING (DEV ONLY)' && {color: '#ef4444'}]}>
            {section.title} {section.title === 'TESTING (DEV ONLY)' && `(+${offset}d)`}
          </Text>
          <View style={styles.card}>
            {section.items.map((item, j) => {
              const isReset = item === '⚠️ Reset Data';
              const isSim = item === '⏳ Simulate Next Day';
              const isFake = item === '➕ Add Fake Run';

              return (
                <TouchableOpacity 
                  key={j} 
                  onPress={() => {
                    if (isReset) resetData();
                    if (isSim) simulateNextDay();
                    if (isFake) addFakeRun();
                  }}
                  style={[styles.item, j < section.items.length - 1 && styles.border]}
                >
                  <Text style={[styles.itemText, isReset && { color: '#ef4444' }]}>{item}</Text>
                  {!isReset && !isSim && !isFake && <View style={styles.togglePlaceholder} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.buildLabel}>RUN BUDDY MVP v0.1.0-ALPHA</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 25, paddingTop: 60 },
  viewLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 2, marginBottom: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 2, marginBottom: 10, marginLeft: 5 },
  card: { backgroundColor: 'white', borderRadius: 20, borderColor: '#f1f5f9', borderWidth: 1, overflow: 'hidden' },
  item: { padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  border: { borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  itemText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  togglePlaceholder: { width: 35, height: 20, backgroundColor: '#f1f5f9', borderRadius: 10 },
  footer: { marginTop: 20, alignItems: 'center', opacity: 0.5 },
  buildLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 2 },
  subBuildLabel: { fontSize: 8, color: '#94a3b8', marginTop: 5 }
});