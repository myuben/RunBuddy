import { Tabs } from 'expo-router';
import { Home, Settings as SettingsIcon, TrendingUp } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#2563eb', 
      tabBarInactiveTintColor: '#94a3b8',
      headerStyle: { backgroundColor: '#f8fafc' },
      headerTitleStyle: { fontWeight: '900', fontStyle: 'italic', fontSize: 22 }
    }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'RUN BUDDY', tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'PROGRESS', tabBarLabel: 'Progress',
          tabBarIcon: ({ color }) => <TrendingUp color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'SETTINGS', tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <SettingsIcon color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}