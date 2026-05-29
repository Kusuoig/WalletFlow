import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addAdjustment } from '../db/transactions';
import { useCardsStore } from '../store/useCardsStore';
import { Card } from '../types';

interface AdjustmentModalProps {
  visible: boolean;
  card: Card;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdjustmentModal({ visible, card, onClose, onSuccess }: AdjustmentModalProps) {
  const [description, setDescription] = useState('Ajuste manual');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCards = useCardsStore((state) => state.loadCards);

  const handleSave = async () => {
    if (!description.trim()) return Alert.alert('Error', 'La descripción es obligatoria');
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return Alert.alert('Error', 'Ingresa un monto válido');
    if (parsedAmount === 0) return Alert.alert('Error', 'El monto no puede ser cero');

    setIsSubmitting(true);
    try {
      const newBalance = card.balance + parsedAmount;
      
      await addAdjustment(card.id, description.trim(), parsedAmount, newBalance);
      await loadCards(); // Actualizar estado global
      
      handleClose();
      onSuccess(); // Recargar historial local
    } catch (error) {
      console.error('Error saving adjustment:', error);
      Alert.alert('Error', 'No se pudo guardar el ajuste');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDescription('Ajuste manual');
    setAmount('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView 
        style={styles.modalOverlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Ajuste Manual</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.infoText}>
              El monto ingresado se sumará directamente al balance de la tarjeta (usa números negativos para restar).
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Ej. Corrección de saldo"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monto (+ / -)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numbers-and-punctuation"
                placeholder="-50.00 o 100.00"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? 'Guardando...' : 'Aplicar Ajuste'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f2f2f6',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#99c7ff',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
