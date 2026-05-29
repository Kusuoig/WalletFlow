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

export default function HomeScreen() {
  const { cards, loadCards } = useCardsStore();
  const [filter, setFilter] = useState<'all' | 'debit' | 'credit'>('all');
  
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isAdjustModalVisible, setIsAdjustModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const router = useRouter();

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

      <FlatList
        data={filteredCards}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay tarjetas en esta categoría.</Text>}
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
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
