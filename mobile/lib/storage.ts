import AsyncStorage from '@react-native-async-storage/async-storage';

const IP_KEY = 'notebookIp';
const DEFAULT_IP = '192.168.1.1';

export async function getNotebookIp(): Promise<string> {
  return (await AsyncStorage.getItem(IP_KEY)) ?? DEFAULT_IP;
}

export async function setNotebookIp(ip: string): Promise<void> {
  await AsyncStorage.setItem(IP_KEY, ip);
}
