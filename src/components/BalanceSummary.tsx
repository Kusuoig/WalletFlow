import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCardsStore } from '../store/useCardsStore';
import { COLORS } from '../constants/theme';

interface BalanceSummaryProps {
  onAddCard: () => void;
}

export default function BalanceSummary({ onAddCard }: BalanceSummaryProps) {
  const { cards, totalBalance } = useCardsStore();

  const debitTotal = cards
    .filter((c) => c.type === 'debit')
    .reduce((acc, c) => acc + c.balance, 0);

  const creditTotal = Math.abs(cards
    .filter((c) => c.type === 'credit')
    .reduce((acc, c) => acc + c.balance, 0));

  const formatMXN = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>SALDO REAL</Text>
      <Text style={[styles.mainBalance, { color: totalBalance < 0 ? COLORS.credit : COLORS.debit }]}>
        {formatMXN(totalBalance)}
      </Text>

      <View style={styles.subtotalsContainer}>
        <View style={styles.subtotalItem}>
          <Text style={styles.subLabel}>Saldo Débito</Text>
          <Text style={[styles.debitAmount, { color: COLORS.debit }]}>{formatMXN(debitTotal)}</Text>
        </View>
        <View style={styles.subtotalItem}>
          <Text style={styles.subLabel}>Deuda Crédito</Text>
          <Text style={[styles.creditAmount, { color: COLORS.credit }]}>{formatMXN(creditTotal)}</Text>
        </View>
        <View style={styles.subtotalItem}>
          <Text style={styles.subLabel}>Tarjetas</Text>
          <Text style={styles.cardsCount}>{cards.length}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={onAddCard}>
        <Text style={styles.addButtonText}>+ Agregar tarjeta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAF9F6',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    color: '#666',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  mainBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtotalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  subtotalItem: {
    flex: 1,
  },
  subLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  debitAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  creditAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8a2b6e',
  },
  cardsCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#00695c',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
