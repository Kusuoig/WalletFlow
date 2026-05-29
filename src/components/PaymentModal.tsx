import React, { useState, useMemo } from 'react';
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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { processPayment } from '../db/transactions';
import { useCardsStore } from '../store/useCardsStore';
import { Card } from '../types';
import { COLORS } from '../constants/theme';

interface PaymentModalProps {
  visible: boolean;
  creditCard: Card;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ visible, creditCard, onClose, onSuccess }: PaymentModalProps) {
  const [amountStr, setAmountStr] = useState('');
  const [selectedDebitIds, setSelectedDebitIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { cards, loadCards, totalBalance } = useCardsStore();
  const debitCards = cards.filter((c) => c.type === 'debit' && c.balance > 0);
  
  const debtAmount = Math.abs(creditCard.balance);
  const amountToPay = parseFloat(amountStr) || 0;

  const toggleDebitSelection = (id: number) => {
    setSelectedDebitIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // CU-12: Simulator "What if I pay X?" (Auto-distribution)
  const simulation = useMemo(() => {
    let remainingToPay = amountToPay;
    const payments: { sourceId: number; amount: number; newSourceBalance: number; name: string }[] = [];
    
    // Distribute greedily among selected cards
    for (const dCard of debitCards) {
      if (selectedDebitIds.includes(dCard.id) && remainingToPay > 0) {
        const canPay = Math.min(dCard.balance, remainingToPay);
        payments.push({
          sourceId: dCard.id,
          name: dCard.name,
          amount: canPay,
          newSourceBalance: dCard.balance - canPay,
        });
        remainingToPay -= canPay;
      }
    }

    const totalDistributed = amountToPay - remainingToPay;
    const isSufficient = remainingToPay <= 0.001; // float precision safe

    const newCreditBalance = creditCard.balance + totalDistributed;

    return {
      payments,
      totalDistributed,
      newCreditBalance,
      isSufficient,
      simulatedTotalBalance: totalBalance, // Paying credit with debit doesn't change overall real balance
    };
  }, [amountToPay, selectedDebitIds, debitCards, creditCard.balance, totalBalance]);

  const handleSave = async () => {
    if (amountToPay <= 0) return Alert.alert('Error', 'Ingresa un monto válido a pagar');
    if (amountToPay > debtAmount) return Alert.alert('Error', 'El monto supera la deuda actual');
    if (selectedDebitIds.length === 0) return Alert.alert('Error', 'Selecciona al menos una tarjeta de débito');
    if (!simulation.isSufficient) return Alert.alert('Error', 'Las tarjetas seleccionadas no tienen saldo suficiente para cubrir el monto');

    setIsSubmitting(true);
    try {
      await processPayment(
        creditCard.id,
        simulation.newCreditBalance,
        simulation.payments,
        `Pago a tarjeta ${creditCard.name}`
      );
      await loadCards(); // Actualizar estado global
      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'No se pudo procesar el pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmountStr('');
    setSelectedDebitIds([]);
    onClose();
  };

  const formatMXN = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Pagar Tarjeta</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Deuda actual de {creditCard.name}</Text>
            <Text style={styles.infoValue}>{formatMXN(debtAmount)}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>¿Cuánto deseas pagar?</Text>
            <TextInput
              style={styles.input}
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            <TouchableOpacity onPress={() => setAmountStr(debtAmount.toString())} style={styles.maxBtn}>
              <Text style={styles.maxBtnText}>Pagar total</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Pagar desde (Débito)</Text>
          {debitCards.length === 0 && (
            <Text style={styles.emptyText}>No tienes tarjetas de débito con saldo positivo.</Text>
          )}
          
          {debitCards.map(dCard => {
            const isSelected = selectedDebitIds.includes(dCard.id);
            const simPay = simulation.payments.find(p => p.sourceId === dCard.id);
            return (
              <TouchableOpacity
                key={dCard.id}
                style={[styles.debitRow, isSelected && styles.debitRowSelected]}
                onPress={() => toggleDebitSelection(dCard.id)}
              >
                <View style={styles.debitRowLeft}>
                  <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={24} color={isSelected ? '#007AFF' : '#ccc'} />
                  <View style={styles.debitRowInfo}>
                    <Text style={styles.debitName}>{dCard.name}</Text>
                    <Text style={styles.debitBalance}>Saldo: {formatMXN(dCard.balance)}</Text>
                  </View>
                </View>
                {simPay && (
                  <View style={styles.simPayBadge}>
                    <Text style={styles.simPayText}>-{formatMXN(simPay.amount)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {amountToPay > 0 && selectedDebitIds.length > 0 && (
            <View style={styles.simulatorBox}>
              <Text style={styles.simTitle}>Simulador (Después del pago)</Text>
              
              {simulation.payments.map(p => (
                <View key={p.sourceId} style={styles.simRow}>
                  <Text style={styles.simLabel}>{p.name}:</Text>
                  <Text style={styles.simValue}>{formatMXN(p.newSourceBalance)}</Text>
                </View>
              ))}

              <View style={[styles.simRow, { marginTop: 8, borderTopWidth: 1, borderColor: '#ccc', paddingTop: 8 }]}>
                <Text style={styles.simLabel}>Nueva deuda ({creditCard.name}):</Text>
                <Text style={[styles.simValue, { color: COLORS.credit }]}>
                  {formatMXN(Math.abs(simulation.newCreditBalance))}
                </Text>
              </View>

              {!simulation.isSufficient && (
                <Text style={styles.simError}>Saldo insuficiente en tarjetas seleccionadas.</Text>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={[
              styles.saveButton, 
              (isSubmitting || !simulation.isSufficient || amountToPay <= 0) && styles.saveButtonDisabled
            ]} 
            onPress={handleSave}
            disabled={isSubmitting || !simulation.isSufficient || amountToPay <= 0}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? 'Procesando...' : 'Confirmar Pago'}
            </Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#f2f2f6',
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  formContainer: { padding: 20 },
  infoBox: {
    backgroundColor: COLORS.creditBackground, padding: 16, borderRadius: 12, marginBottom: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#ffcccc'
  },
  infoLabel: { fontSize: 14, color: COLORS.credit, marginBottom: 4 },
  infoValue: { fontSize: 28, fontWeight: 'bold', color: COLORS.credit },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, color: '#333', marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#f2f2f6', borderRadius: 10, padding: 16, fontSize: 18, fontWeight: 'bold' },
  maxBtn: { position: 'absolute', right: 12, top: 40, backgroundColor: '#007AFF', padding: 6, borderRadius: 6 },
  maxBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 10 },
  emptyText: { color: '#8e8e93', fontStyle: 'italic', marginBottom: 10 },
  debitRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, backgroundColor: '#f9f9f9', borderRadius: 10, marginBottom: 10,
    borderWidth: 1, borderColor: 'transparent'
  },
  debitRowSelected: { borderColor: '#007AFF', backgroundColor: '#f0f7ff' },
  debitRowLeft: { flexDirection: 'row', alignItems: 'center' },
  debitRowInfo: { marginLeft: 12 },
  debitName: { fontSize: 16, fontWeight: '600' },
  debitBalance: { fontSize: 13, color: COLORS.debit, marginTop: 2 },
  simPayBadge: { backgroundColor: '#ffcc00', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  simPayText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  simulatorBox: {
    backgroundColor: '#f2f2f6', padding: 16, borderRadius: 12, marginTop: 10, marginBottom: 20
  },
  simTitle: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 10 },
  simRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  simLabel: { fontSize: 14, color: '#555' },
  simValue: { fontSize: 14, fontWeight: 'bold' },
  simError: { color: COLORS.credit, fontSize: 12, marginTop: 10, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#007AFF', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveButtonDisabled: { backgroundColor: '#99c7ff' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
