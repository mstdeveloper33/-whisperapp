import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { loginUser, clearError } from '../../redux/slices/authSlice';
import { testUrl, getApiBaseUrl, getSocketBaseUrl } from '../../utils/deviceUtils';

// Doğrulama şeması
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Geçerli bir e-posta adresi giriniz')
    .required('E-posta adresi zorunludur'),
  password: Yup.string()
    .min(6, 'Şifre en az 6 karakter olmalıdır')
    .required('Şifre zorunludur'),
});

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);

  // Form gönderildiğinde çağrılacak fonksiyon
  const handleSubmit = async (values) => {
    dispatch(clearError());
    await dispatch(loginUser(values));
  };

  // Bağlantı testi yapan fonksiyon (sadece DEV modunda)
  const testConnection = async () => {
    try {
      setTestingConnection(true);
      
      const apiUrl = getApiBaseUrl();
      const socketUrl = getSocketBaseUrl();
      const serverUrl = apiUrl.replace('/api', '');
      
      console.log('Testing connections:');
      console.log('- Server URL:', serverUrl);
      console.log('- API URL:', apiUrl);
      console.log('- Socket URL:', socketUrl);
      
      // Test server root URL
      const serverReachable = await testUrl(serverUrl);
      
      // Test API URL
      const apiReachable = await testUrl(apiUrl);
      
      // Sonuçları göster
      Alert.alert(
        'Bağlantı Testi Sonuçları',
        `Server URL (${serverUrl}): ${serverReachable ? '✅ Bağlantı Başarılı' : '❌ Bağlantı Hatası'}\n\nAPI URL (${apiUrl}): ${apiReachable ? '✅ Bağlantı Başarılı' : '❌ Bağlantı Hatası'}`,
        [{ text: 'Tamam' }]
      );
    } catch (error) {
      Alert.alert(
        'Bağlantı Testi Hatası',
        error.message,
        [{ text: 'Tamam' }]
      );
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.appName}>Whisper App</Text>
          <Text style={styles.slogan}>Güvenli Mesajlaşma Uygulaması</Text>
        </View>

        {__DEV__ && (
          <TouchableOpacity
            style={styles.debugButton}
            onPress={testConnection}
            disabled={testingConnection}
          >
            {testingConnection ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.debugButtonText}>Bağlantı Testi (DEV)</Text>
            )}
          </TouchableOpacity>
        )}

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-posta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="E-posta adresinizi giriniz"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  value={values.email}
                />
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Şifre</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Şifrenizi giriniz"
                    secureTextEntry={secureTextEntry}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    value={values.password}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  >
                    <Text>{secureTextEntry ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>
                  Şifremi unuttum
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Giriş Yap</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Hesabınız yok mu?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 10,
  },
  slogan: {
    fontSize: 16,
    color: '#757575',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginTop: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#1E88E5',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#1E88E5',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#757575',
    marginRight: 5,
  },
  registerText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  debugButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
