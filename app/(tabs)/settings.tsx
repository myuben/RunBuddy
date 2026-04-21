import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
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
              <View
                key={j}
                style={[
                  styles.item,
                  j < section.items.length - 1 && styles.border
                ]}
              >
                <Text style={styles.itemText}>{item}</Text>
                <View style={styles.togglePlaceholder} />
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.buildLabel}>
          RUN BUDDY MVP v0.1.0-ALPHA
        </Text>
        <Text style={styles.subBuildLabel}>
          Logical Skeleton Only — [UI_LAYER_IDLE]
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  content: { padding: 25 },

  viewLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 2,
    marginBottom: 20
  },

  section: {
    marginBottom: 30
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 2,
    marginBottom: 10,
    marginLeft: 5
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderColor: '#f1f5f9',
    borderWidth: 1,
    overflow: 'hidden'
  },

  item: {
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  border: {
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc'
  },

  itemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155'
  },

  togglePlaceholder: {
    width: 35,
    height: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 10
  },

  footer: {
    marginTop: 20,
    alignItems: 'center',
    opacity: 0.5
  },

  buildLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 2
  },

  subBuildLabel: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 5
  }
});