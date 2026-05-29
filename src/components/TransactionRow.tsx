import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import { format, parseISO } from 'date-fns';
import { COLORS } from '../constants/theme';

interface TransactionRowProps {
  transaction: Transaction;
  currentCardId: number;
}

const TransactionRow = ({ transaction, currentCardId }: TransactionRowProps) => {
  // Determinar si el monto suma o resta a esta tarjeta en particular
  let isPositive = false;
  
  if (transaction.type === 'adjustment') {
    isPositive = transaction.amount > 0;
  } else if (transaction.type === 'payment') {
    // Si la tarjeta actual es el origen (de donde sale el dinero), resta.
    // Si es el destino (la de crédito que se paga), es positivo (reduce la deuda).
    isPositive = transaction.target_card_id === currentCardId;
  } else if (transaction.type === 'transfer') {
    isPositive = transaction.target_card_id === currentCardId;
  }

  const formatMXN = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const getIcon = () => {
    switch (transaction.type) {
      case 'payment': return 'cash';
      case 'adjustment': return 'options';
      case 'transfer': return 'swap-horizontal';
      default: return 'list';
    }
  };

  const formattedDate = format(parseISO(transaction.created_at.replace(' ', 'T')), 'dd MMM yyyy, HH:mm');

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={getIcon()} size={24} color="#555" />
      </View>
      
      <View style={styles.details}>
        <Text style={styles.description}>{transaction.description}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <Text style={[styles.amount, { color: isPositive ? COLORS.debit : '#1c1c1e' }]}>
        {isPositive ? '+' : ''}{formatMXN(transaction.amount)}
      </Text>
    </View>
  );
};

export default React.memo(TransactionRow);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#8e8e93',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
