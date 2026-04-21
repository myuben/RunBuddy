import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProgressScreen() {
  const stats = [
    { label: 'TOTAL RUNS', value: '12' },
    { label: 'DAY STREAK', value: '5', accent: '#f97316' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Header Info */}
      <View style={styles.viewHeader}>
        <Text style={styles.viewLabel}>View 02: Verification</Text>
        <View style={styles.systemBadge}>
          <Text style={styles.systemBadgeText}>SYSTEM: LOGS</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsRow}>
        {stats.map((stat, i) => (
          <View
            key={i}
            style={[
              styles.statCard,
              stat.accent
                ? { borderColor: `${stat.accent}33`, borderWidth: 2 }
                : null
            ]}
          >
            <Text
              style={[
                styles.statLabel,
                stat.accent ? { color: stat.accent } : null
              ]}
            >
              {stat.label}
            </Text>

            <View style={styles.statValueContainer}>
              <Text
                style={[
                  styles.statValue,
                  stat.accent ? { color: stat.accent } : null
                ]}
              >
                {stat.value}
              </Text>
              {stat.accent && <Text style={styles.statUnit}>DAYS</Text>}
            </View>
          </View>
        ))}
      </View>

      {/* MOMENT REEL */}
      <View style={styles.reelCard}>
        <View style={styles.reelHeader}>
          <Text style={styles.reelTitle}>MOMENT REEL</Text>
          <Text style={styles.reelSubLabel}>Data: Local_Snapshots</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reelScroll}
        >
          {[1, 2, 3].map((item, i) => (
            <View
              key={item}
              style={[
                styles.snapshot,
                {
                  transform: [
                    { rotate: i % 2 === 0 ? '2deg' : '-2deg' }
                  ]
                }
              ]}
            >
              <View style={styles.snapshotInner}>
                <Text style={styles.snapshotText}>
                  Snapshot_0{item}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.glow} />
      </View>

      {/* Footer */}
      <View style={styles.footerNote}>
        <Text style={styles.footerNoteText}>
          Protocol: Phase_1_Verification_Only
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 25 },

  viewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  viewLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 2,
  },

  systemBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },

  systemBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '900',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },

  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  statLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginBottom: 15,
  },

  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },

  statValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0f172a',
  },

  statUnit: {
    fontSize: 10,
    fontWeight: '900',
    opacity: 0.3,
  },

  reelCard: {
    backgroundColor: '#0f172a',
    borderRadius: 40,
    padding: 30,
    overflow: 'hidden',
  },

  reelHeader: {
    marginBottom: 30,
  },

  reelTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },

  reelSubLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 5,
  },

  reelScroll: {
    gap: 15,
  },

  snapshot: {
    width: 110,
    height: 160,
  },

  snapshotInner: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  snapshotText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 8,
    fontWeight: 'bold',
  },

  glow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderRadius: 75,
  },

  footerNote: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#f1f5f9',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  footerNoteText: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
});