import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';

const SettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saveMedia, setSaveMedia] = useState(true);
  
  // Temizleme işlemi
  const handleClearCache = () => {
    Alert.alert(
      'Önbelleği Temizle',
      'Uygulamanın önbelleğini temizlemek istediğinize emin misiniz? Bu işlem, kaydedilmiş dosyaları ve önbelleğe alınmış verileri silecektir.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: () => {
            // Simüle edilmiş temizleme işlemi
            setTimeout(() => {
              Alert.alert('Başarılı', 'Önbellek başarıyla temizlendi.');
            }, 800);
          },
        },
      ]
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bildirimler</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Bildirimleri Etkinleştir</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#ddd', true: '#aed6f1' }}
            thumbColor={notifications ? '#1E88E5' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Ses Bildirimlerini Etkinleştir</Text>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: '#ddd', true: '#aed6f1' }}
            thumbColor={soundEnabled ? '#1E88E5' : '#f4f3f4'}
            disabled={!notifications}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Görünüm</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Karanlık Mod</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#ddd', true: '#aed6f1' }}
            thumbColor={darkMode ? '#1E88E5' : '#f4f3f4'}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Veri ve Depolama</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Medya Dosyalarını Otomatik Kaydet</Text>
          <Switch
            value={saveMedia}
            onValueChange={setSaveMedia}
            trackColor={{ false: '#ddd', true: '#aed6f1' }}
            thumbColor={saveMedia ? '#1E88E5' : '#f4f3f4'}
          />
        </View>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleClearCache}
        >
          <Text style={styles.actionButtonText}>Önbelleği Temizle</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hakkında</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Uygulama Sürümü</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => {
            // Simüle edilmiş gizlilik politikası linki
            Alert.alert('Gizlilik Politikası', 'Gizlilik politikası sayfası açılacak.');
          }}
        >
          <Text style={styles.linkButtonText}>Gizlilik Politikası</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => {
            // Simüle edilmiş hizmet şartları linki
            Alert.alert('Hizmet Şartları', 'Hizmet şartları sayfası açılacak.');
          }}
        >
          <Text style={styles.linkButtonText}>Hizmet Şartları</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  actionButton: {
    paddingVertical: 12,
    marginTop: 5,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1E88E5',
    fontWeight: '500',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#757575',
  },
  linkButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  linkButtonText: {
    fontSize: 16,
    color: '#1E88E5',
  },
});

export default SettingsScreen;
