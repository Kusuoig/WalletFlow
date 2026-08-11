import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCardsStore } from '../../store/useCardsStore';
import { getTransactionsByCard } from '../../db/transactions';
import { deleteCard } from '../../db/cards';
import { Transaction } from '../../types';
import TransactionRow from '../../components/TransactionRow';
import AdjustmentModal from '../../components/AdjustmentModal';
import PaymentModal from '../../components/PaymentModal';
import CardFormModal from '../../components/CardFormModal';
import { COLORS } from '../../constants/theme';

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { cards, loadCards } = useCardsStore();
  
  const cardId = Number(id);
  const card = cards.find(c => c.id === cardId);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isAdjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    if (card) {
      loadHistory();
    }
  }, [cardId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getTransactionsByCard(cardId);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar tarjeta',
      '¿Estás seguro de eliminar esta tarjeta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCard(cardId);
              await loadCards();
              router.back();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la tarjeta');
            }
          }
        }
      ]
    );
  };

  if (!card) {
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.errorText}>Tarjeta no encontrada</Text>
      </View>
    );
  }

  const isCredit = card.type === 'credit';
  const formatMXN = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderLeftColor: isCredit ? COLORS.credit : COLORS.debit }]}>
        <Text style={styles.cardName}>{card.name}</Text>
        <Text style={styles.cardBank}>{card.bank} - {isCredit ? 'Crédito' : 'Débito'}</Text>
        <Text style={[styles.cardBalance, { color: isCredit ? COLORS.credit : COLORS.debit }]}>
          {formatMXN(card.balance)}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setAdjustmentModalVisible(true)}>
          <Ionicons name="options" size={22} color="#007AFF" />
          <Text style={styles.actionText}>Ajuste</Text>
        </TouchableOpacity>
        
        {isCredit && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => setPaymentModalVisible(true)}>
            <Ionicons name="cash" size={22} color={COLORS.debit} />
            <Text style={styles.actionText}>Pagar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionBtn} onPress={() => setIsEditModalVisible(true)}>
          <Ionicons name="settings-outline" size={22} color="#5856D6" />
          <Text style={styles.actionText}>Configurar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
          <Ionicons name="trash" size={22} color={COLORS.credit} />
          <Text style={styles.actionText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Historial de Movimientos</Text>
        
        {loadingHistory ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={t => t.id.toString()}
            renderItem={({ item }) => <TransactionRow transaction={item} currentCardId={cardId} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay movimientos registrados.</Text>}
          />
        )}
      </View>

      <AdjustmentModal
        visible={isAdjustmentModalVisible}
        card={card}
        onClose={() => setAdjustmentModalVisible(false)}
        onSuccess={loadHistory}
      />

      {isCredit && (
        <PaymentModal
          visible={isPaymentModalVisible}
          creditCard={card}
          onClose={() => setPaymentModalVisible(false)}
          onSuccess={loadHistory}
        />
      )}

      <CardFormModal
        visible={isEditModalVisible}
        cardToEdit={card}
        onClose={() => setIsEditModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f6',
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#8e8e93',
  },
  headerCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  cardBank: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 4,
  },
  cardBalance: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flex: 1,
    minWidth: 70,
  },
  actionText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1c1c1e',
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8e8e93',
    marginTop: 30,
  },
});
