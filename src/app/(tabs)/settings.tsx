import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { documentDirectory, writeAsStringAsync, readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { format } from 'date-fns';
import { exportData, importData } from '../../db/backup';
import { useCardsStore } from '../../store/useCardsStore';

export default function SettingsScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const loadCards = useCardsStore(state => state.loadCards);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const data = await exportData();
      const jsonString = JSON.stringify(data, null, 2);
      
      const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const fileName = `tarjetas_backup_${dateStr}.json`;
      const fileUri = `${documentDirectory}${fileName}`;
      
      await writeAsStringAsync(fileUri, jsonString, {
        encoding: EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'No se pudo exportar la información');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const fileUri = result.assets[0].uri;
      const fileContent = await readAsStringAsync(fileUri, {
        encoding: EncodingType.UTF8,
      });

      const data = JSON.parse(fileContent);

      if (!data.cards || !data.transactions) {
        Alert.alert('Error', 'El archivo no tiene el formato correcto');
        return;
      }

      Alert.alert(
        'Importar Datos',
        'Esto reemplazará todas tus tarjetas y movimientos actuales. ¿Deseas continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Reemplazar',
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              try {
                await importData(data);
                await loadCards();
                Alert.alert('Éxito', 'Los datos han sido restaurados correctamente');
              } catch (error) {
                console.error('Import error:', error);
                Alert.alert('Error', 'Hubo un problema al restaurar los datos');
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Read file error:', error);
      Alert.alert('Error', 'No se pudo leer el archivo seleccionado');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Copia de Seguridad</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleExport} disabled={isLoading}>
        <View style={styles.btnContent}>
          <Ionicons name="cloud-upload" size={24} color="#007AFF" />
          <View style={styles.btnTexts}>
            <Text style={styles.btnTitle}>Exportar datos</Text>
            <Text style={styles.btnDesc}>Guarda un respaldo de todas tus tarjetas y movimientos</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleImport} disabled={isLoading}>
        <View style={styles.btnContent}>
          <Ionicons name="cloud-download" size={24} color="#34c759" />
          <View style={styles.btnTexts}>
            <Text style={styles.btnTitle}>Importar datos</Text>
            <Text style={styles.btnDesc}>Restaura un archivo de respaldo anterior (.json)</Text>
          </View>
        </View>
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Procesando...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f6',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    color: '#1c1c1e',
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnTexts: {
    marginLeft: 16,
    flex: 1,
  },
  btnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  btnDesc: {
    fontSize: 13,
    color: '#8e8e93',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
