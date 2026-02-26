import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import api from '@/lib/api/client';
import { storeSessionFromToken } from '@/lib/auth/session';
import { parseApiError } from '@/lib/api/errors';
import { useTheme } from '@/src/mobile/theme';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        container: {
          flex: 1,
          padding: 20,
          justifyContent: 'center',
        },
        title: {
          fontSize: 24,
          fontWeight: '700',
          marginBottom: 24,
          textAlign: 'center',
          color: theme.colors.text,
        },
        label: {
          fontSize: 14,
          marginBottom: 8,
          color: theme.colors.text,
        },
        input: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          marginBottom: 16,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
        },
        button: {
          backgroundColor: theme.colors.primary,
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
          marginTop: 8,
        },
        buttonText: {
          color: theme.colors.surface,
          fontSize: 16,
          fontWeight: '600',
        },
        footer: {
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 16,
        },
        footerText: {
          color: theme.colors.mutedText,
        },
        link: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  const onLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Қате', 'Email немесе телефон және құпиясөз қажет.');
      return;
    }
    setLoading(true);
    try {
      const payload =
        identifier.includes('@')
          ? { email: identifier, password }
          : { phone: identifier, password };
      console.log('[Auth Login] payload', { ...payload, password: '***' });
      const response = await api.post('/auth/login', payload);
      const token = response.data?.accessToken;
      const refreshToken = response.data?.refreshToken;
      if (!token) {
        throw new Error('Token missing');
      }
      await storeSessionFromToken(token, refreshToken);
      router.replace('/(tabs)');
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
      if (info.kind === 'auth') {
        router.replace('/(auth)/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Кіру</Text>
      <Text style={styles.label}>Email немесе телефон</Text>
      <TextInput
        style={styles.input}
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="example@mail.com немесе 7700..."
        placeholderTextColor={theme.colors.placeholder}
        autoCapitalize="none"
      />
      <Text style={styles.label}>Құпиясөз</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Құпиясөз"
        placeholderTextColor={theme.colors.placeholder}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Кіру...' : 'Кіру'}</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Аккаунт жоқ па? </Text>
        <Link href="/(auth)/register" style={styles.link}>
          Тіркелу
        </Link>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
