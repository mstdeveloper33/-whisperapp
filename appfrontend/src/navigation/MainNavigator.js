import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

// Gerçek ekranları import ediyoruz
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ChatsScreen from '../screens/chat/ChatsScreen';
import ChatDetailScreen from '../screens/chat/ChatDetailScreen';

// Geçici olarak burada boş bileşenler tanımlıyoruz
// Daha sonra gerçek ekranları oluşturup bunları değiştireceğiz
const GroupsScreen = () => <Text>Groups Screen</Text>;
const GroupDetailScreen = () => <Text>Group Detail Screen</Text>;

// Stack navigatorlar
const ChatsStack = createStackNavigator();
const GroupsStack = createStackNavigator();
const ProfileStack = createStackNavigator();

// Tab navigator
const Tab = createBottomTabNavigator();

// Mesajlar için stack navigator
const ChatsStackNavigator = () => (
  <ChatsStack.Navigator>
    <ChatsStack.Screen 
      name="ChatsList" 
      component={ChatsScreen} 
      options={{ title: 'Mesajlar' }}
    />
    <ChatsStack.Screen 
      name="ChatDetail" 
      component={ChatDetailScreen} 
      options={({ route }) => ({ title: route.params?.userName || 'Sohbet' })}
    />
  </ChatsStack.Navigator>
);

// Gruplar için stack navigator
const GroupsStackNavigator = () => (
  <GroupsStack.Navigator>
    <GroupsStack.Screen 
      name="GroupsList" 
      component={GroupsScreen} 
      options={{ title: 'Gruplar' }}
    />
    <GroupsStack.Screen 
      name="GroupDetail" 
      component={GroupDetailScreen} 
      options={({ route }) => ({ title: route.params?.groupName || 'Grup' })}
    />
  </GroupsStack.Navigator>
);

// Profil için stack navigator
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen 
      name="ProfileMain" 
      component={ProfileScreen} 
      options={{ title: 'Profil' }}
    />
    <ProfileStack.Screen 
      name="Settings" 
      component={SettingsScreen} 
      options={{ title: 'Ayarlar' }}
    />
  </ProfileStack.Navigator>
);

// Ana tab navigator
const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1E88E5',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
      }}
    >
      <Tab.Screen 
        name="Chats" 
        component={ChatsStackNavigator}
        options={{
          tabBarLabel: 'Mesajlar',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>💬</Text>
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsStackNavigator}
        options={{
          tabBarLabel: 'Gruplar',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👥</Text>
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
