import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCardsStore } from '../../store/useCardsStore';
import { Card } from '../../types';
import { deleteCard } from '../../db/cards';
import CardFormModal from '../../components/CardFormModal';
import BalanceSummary from '../../components/BalanceSummary';
import CardItem from '../../components/CardItem';
import AdjustmentModal from '../../components/AdjustmentModal';
import PaymentModal from '../../components/PaymentModal';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { cards, loadCards } = useCardsStore();
  const [filter, setFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'amount_asc' | 'amount_desc' | 'due_date' | 'recency_asc' | 'recency_desc'>('default');
  
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isAdjustModalVisible, setIsAdjustModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const router = useRouter();

  const getDaysToCutoff = (dueDateNum: number | null | undefined) => {
    if (!dueDateNum) return 999999;
    const today = new Date();
    let cutoffDate = new Date(today.getFullYear(), today.getMonth(), dueDateNum);
    if (today > cutoffDate) {
      cutoffDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDateNum);
    }
    const diff = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth(), cutoffDate.getDate()).getTime() - 
                 new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleCardPress = (card: Card) => {
    router.push(`/card/${card.id}` as any);
  };

  const handleAdjust = (card: Card) => {
    setSelectedCard(card);
    setIsAdjustModalVisible(true);
  };

  const handlePay = (card: Card) => {
    setSelectedCard(card);
    setIsPaymentModalVisible(true);
  };

  const handleAmountSort = () => {
    if (sortBy === 'amount_desc') {
      setSortBy('amount_asc');
    } else {
      setSortBy('amount_desc');
    }
  };

  const handleDueDateSort = () => {
    if (sortBy === 'due_date') {
      setSortBy('default');
    } else {
      setSortBy('due_date');
    }
  };

  const handleRecencySort = () => {
    if (sortBy === 'recency_desc') {
      setSortBy('recency_asc');
    } else {
      setSortBy('recency_desc');
    }
  };

  const handleDelete = (card: Card) => {
    Alert.alert(
      'Eliminar tarjeta',
      `¿Estás seguro de eliminar la tarjeta ${card.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCard(card.id);
              await loadCards();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la tarjeta');
            }
          }
        }
      ]
    );
  };

  const filteredCards = cards.filter(c => {
    if (filter === 'all') return true;
    return c.type === filter;
  });

  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === 'amount_desc') {
      return Math.abs(b.balance) - Math.abs(a.balance);
    }
    if (sortBy === 'amount_asc') {
      return Math.abs(a.balance) - Math.abs(b.balance);
    }
    if (sortBy === 'due_date') {
      return getDaysToCutoff(a.due_date) - getDaysToCutoff(b.due_date);
    }
    if (sortBy === 'recency_desc') {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
    if (sortBy === 'recency_asc') {
      return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    }
    return 0;
  });

  const renderCard = ({ item }: { item: Card }) => (
    <CardItem 
      card={item} 
      onPress={() => handleCardPress(item)} 
      onAdjust={() => handleAdjust(item)}
      onPay={() => handlePay(item)}
      onDelete={() => handleDelete(item)}
    />
  );

  return (
    <View style={styles.container}>
      <BalanceSummary onAddCard={() => setIsFormModalVisible(true)} />
      
      <View style={styles.filtersRow}>
        <View style={styles.filtersContainer}>
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'all' && styles.filterPillActive]} 
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'debit' && styles.filterPillActive]} 
            onPress={() => setFilter('debit')}
          >
            <Text style={[styles.filterText, filter === 'debit' && styles.filterTextActive]}>Débito</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'credit' && styles.filterPillActive]} 
            onPress={() => setFilter('credit')}
          >
            <Text style={[styles.filterText, filter === 'credit' && styles.filterTextActive]}>Crédito</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sortContainer}>
          {/* Botón de Ordenar por Monto */}
          <TouchableOpacity 
            style={[
              styles.sortBtn, 
              (sortBy === 'amount_desc' || sortBy === 'amount_asc') && styles.sortBtnActive
            ]}
            onPress={handleAmountSort}
          >
            <Ionicons 
              name={
                sortBy === 'amount_desc' 
                  ? 'trending-down-outline' 
                  : sortBy === 'amount_asc' 
                    ? 'trending-up-outline' 
                    : 'cash-outline'
              } 
              size={18} 
              color={(sortBy === 'amount_desc' || sortBy === 'amount_asc') ? '#00695c' : '#8e8e93'} 
            />
          </TouchableOpacity>

          {/* Botón de Ordenar por Calendario (Fecha de Pago/Corte) */}
          <TouchableOpacity 
            style={[
              styles.sortBtn, 
              sortBy === 'due_date' && styles.sortBtnActive
            ]}
            onPress={handleDueDateSort}
          >
            <Ionicons 
              name="calendar-outline" 
              size={18} 
              color={sortBy === 'due_date' ? '#00695c' : '#8e8e93'} 
            />
          </TouchableOpacity>

          {/* Botón de Ordenar por Recientes */}
          <TouchableOpacity 
            style={[
              styles.sortBtn, 
              (sortBy === 'recency_desc' || sortBy === 'recency_asc') && styles.sortBtnActive
            ]}
            onPress={handleRecencySort}
          >
            <Ionicons 
              name="time-outline" 
              size={18} 
              color={(sortBy === 'recency_desc' || sortBy === 'recency_asc') ? '#00695c' : '#8e8e93'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={sortedCards}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay tarjetas en esta categoría o criterio de orden.</Text>}
      />

      <CardFormModal 
        visible={isFormModalVisible} 
        onClose={() => setIsFormModalVisible(false)} 
      />

      {selectedCard && (
        <>
          <AdjustmentModal
            visible={isAdjustModalVisible}
            card={selectedCard}
            onClose={() => {
              setIsAdjustModalVisible(false);
              setSelectedCard(null);
            }}
            onSuccess={() => {}} // Store reloads inside the modal
          />
          {selectedCard.type === 'credit' && (
            <PaymentModal
              visible={isPaymentModalVisible}
              creditCard={selectedCard}
              onClose={() => {
                setIsPaymentModalVisible(false);
                setSelectedCard(null);
              }}
              onSuccess={() => {}}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  sortBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f2f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sortBtnActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#00695c',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f6',
  },
  filterPillActive: {
    backgroundColor: '#00695c',
  },
  filterText: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#8e8e93',
  },
});
