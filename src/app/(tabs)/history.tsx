import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { getAllTransactions } from '../../db/transactions';
import { Transaction } from '../../types';
import TransactionRow from '../../components/TransactionRow';
import { useCardsStore } from '../../store/useCardsStore';

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { cards } = useCardsStore(); // Escuchar cambios globales (pagos/ajustes)

  useEffect(() => {
    loadHistory();
  }, [cards]); // Recargar el historial cuando las tarjetas cambien en el store global

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getAllTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading global history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay movimientos registrados.</Text>}
          renderItem={({ item }) => {
            // Pasamos un currentCardId de -1 o el source principal para que muestre 
            // el color correcto desde una perspectiva global. En el historial global, 
            // un ajuste positivo es verde, un pago desde origen resta (negro), etc.
            return <TransactionRow transaction={item} currentCardId={item.source_card_id || -1} />;
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#8e8e93',
    fontStyle: 'italic',
  },
});
