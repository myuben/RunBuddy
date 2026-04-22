import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const resetData = () => {
    Alert.alert(
      "Reset All Data?",
      "Buddy will lose all history and streaks! This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset Everything", 
          style: "destructive",
          onPress: async () => {
            // 🔥 DEEP WIPE: Clear everything from storage
            await AsyncStorage.clear(); 
            Alert.alert("Success", "Buddy is fresh! Go to the home tab to start over.");
          }
        }
      ]
    );
  };

  const sections = [
    { title: 'PROFILE', items: ['Edit Name', 'Link Strava'] },
    { title: 'NOTIFICATIONS', items: ['Run celebration', 'Streak reminders'] },
    { title: 'APP', items: ['About Run Buddy', 'Reset Data'] }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.viewLabel}>View 03: Profile</Text>

      {sections.map((section, i) => (
        <View key={i} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.items.map((item, j) => (
              <TouchableOpacity 
                key={j} 
                disabled={item !== 'Reset Data'}
                onPress={item === 'Reset Data' ? resetData : undefined}
                style={[styles.item, j < section.items.length - 1 && styles.border]}
              >
                <Text style={[styles.itemText, item === 'Reset Data' && { color: '#ef4444' }]}>{item}</Text>
                {item === 'Reset Data' ? (
                   <Text style={{fontSize: 12, color: '#ef4444', fontWeight: 'bold'}}>WIPE ⚠️</Text>
                ) : (
                  <View style={styles.togglePlaceholder} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.buildLabel}>RUN BUDDY MVP v0.1.0-ALPHA</Text>
        <Text style={styles.subBuildLabel}>Logical Skeleton Only — [UI_LAYER_IDLE]</Text>
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