import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { getNotebookIp, setNotebookIp } from '../lib/storage';
import { apiFetch } from '../lib/api';
import { COLORS } from '../lib/colors';

export default function SettingsScreen() {
  const [ip, setIp] = useState('');
  const headerHeight = useHeaderHeight();
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | 'ok' | 'fail'>(null);

  useEffect(() => {
    getNotebookIp().then(setIp);
  }, []);

  async function save() {
    await setNotebookIp(ip.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      await apiFetch('/health');
      setTestResult('ok');
    } catch {
      setTestResult('fail');
    } finally {
      setTesting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <Text style={styles.hint}>
        IP do notebook na rede local. Exemplo: 192.168.1.42
      </Text>

      <TextInput
        style={styles.input}
        value={ip}
        onChangeText={setIp}
        placeholder="192.168.1.42"
        placeholderTextColor={COLORS.textMuted}
        keyboardType="decimal-pad"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnOutline]}
          onPress={testConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color={COLORS.textSub} size="small" />
          ) : (
            <Text style={styles.btnOutlineText}>Testar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={save}>
          <Text style={styles.btnText}>{saved ? 'Salvo' : 'Salvar'}</Text>
        </TouchableOpacity>
      </View>

      {testResult === 'ok' && (
        <Text style={styles.ok}>Conexão OK</Text>
      )}
      {testResult === 'fail' && (
        <Text style={styles.fail}>Sem conexão — verifique o IP e o backend</Text>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20, paddingTop: 24 },

  hint: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },

  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    fontVariant: ['tabular-nums'],
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
  },

  btn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#0a0a0a',
    fontWeight: '600',
    fontSize: 14,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnOutlineText: {
    color: COLORS.textSub,
    fontWeight: '500',
    fontSize: 14,
  },

  ok: { color: '#4ade80', fontSize: 13, marginTop: 14 },
  fail: { color: '#f87171', fontSize: 13, marginTop: 14 },
});
