import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../types';
import { differenceInDays } from 'date-fns';
import { COLORS } from '../constants/theme';

interface CardItemProps {
  card: Card;
  onPress: () => void;
  onPay: () => void;
  onAdjust: () => void;
  onDelete: () => void;
}

const getBankLogo = (bankName: string) => {
  const b = bankName.toLowerCase().trim().replace(/\s+/g, '');
  if (!b) return null;
  if (b.includes('bbva')) return 'https://www.google.com/s2/favicons?domain=bbva.mx&sz=128';
  if (b.includes('santander')) return 'https://www.google.com/s2/favicons?domain=santander.com.mx&sz=128';
  if (b.includes('revolut')) return 'https://www.google.com/s2/favicons?domain=revolut.com&sz=128';
  if (b.includes('openbank')) return 'https://www.google.com/s2/favicons?domain=openbank.es&sz=128';
  if (b.includes('ualá') || b.includes('uala')) return 'https://www.google.com/s2/favicons?domain=uala.com.mx&sz=128';
  if (b.includes('plata')) return 'https://www.google.com/s2/favicons?domain=platacard.mx&sz=128';
  
  // Fallback dinámico para bancos personalizados
  return `https://www.google.com/s2/favicons?domain=${b}.com&sz=128`;
};

const formatLastModified = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split(' ')[0].split('-');
  if (parts.length === 3) {
    return `Último cambio: ${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return `Último cambio: ${dateStr}`;
};

const CardItem = ({ card, onPress, onPay, onAdjust, onDelete }: CardItemProps) => {
  const isCredit = card.type === 'credit';
  const formatMXN = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  
  const [imgError, setImgError] = useState(false);
  const logoUrl = getBankLogo(card.bank);

  let usageRatio = 0;
  let usageAlert = false;
  let usageCritical = false;

  if (isCredit && card.credit_limit) {
    usageRatio = Math.abs(card.balance) / card.credit_limit;
    if (usageRatio >= 0.9) usageCritical = true;
    else if (usageRatio >= 0.7) usageAlert = true;
  }

  const getDaysToCutoff = () => {
    if (!card.due_date) return null;
    const today = new Date();
    let cutoffDate = new Date(today.getFullYear(), today.getMonth(), card.due_date);
    
    if (today > cutoffDate) {
      cutoffDate = new Date(today.getFullYear(), today.getMonth() + 1, card.due_date);
    }
    
    return differenceInDays(cutoffDate, today);
  };

  const daysToCutoff = isCredit ? getDaysToCutoff() : null;

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: isCredit ? COLORS.credit : COLORS.debit }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.topMetaRow}>
        <Text style={styles.lastModifiedText}>{formatLastModified(card.updated_at)}</Text>
      </View>

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.logoContainer}>
            {logoUrl && !imgError ? (
              <Image 
                source={{ uri: logoUrl }} 
                style={styles.bankLogo} 
                onError={() => setImgError(true)}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.genericLogo, { backgroundColor: isCredit ? COLORS.creditBackground : COLORS.debitBackground }]}>
                <Ionicons 
                  name={isCredit ? 'card-outline' : 'wallet-outline'} 
                  size={20} 
                  color={isCredit ? COLORS.credit : COLORS.debit} 
                />
              </View>
            )}
          </View>
          <View>
            <Text style={styles.name}>{card.name}</Text>
            <Text style={styles.bank}>{card.bank}</Text>
          </View>
        </View>
        <View style={[styles.pill, { backgroundColor: isCredit ? COLORS.creditBackground : COLORS.debitBackground }]}>
          <Ionicons 
            name={isCredit ? 'card' : 'business'} 
            size={14} 
            color={isCredit ? COLORS.credit : COLORS.debit} 
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.pillText, { color: isCredit ? COLORS.credit : COLORS.debit }]}>
            {isCredit ? 'Crédito' : 'Débito'}
          </Text>
        </View>
      </View>

      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>{isCredit ? 'Saldo deudor' : 'Saldo disponible'}</Text>
        <Text style={[styles.balance, { color: isCredit ? COLORS.credit : COLORS.debit }]}>
          {formatMXN(Math.abs(card.balance))}
        </Text>
      </View>

      {isCredit && card.credit_limit && (
        <View style={styles.creditInfo}>
          <View style={styles.limitRow}>
            <Text style={styles.limitText}>Límite: {formatMXN(card.credit_limit)}</Text>
            {daysToCutoff !== null && (
              <Text style={styles.daysText}>Corte en {daysToCutoff} días</Text>
            )}
          </View>
          
          <View style={styles.datesRow}>
            <Text style={styles.dateText}>Corte: Día {card.due_date || 'N/A'}</Text>
            <Text style={[styles.dateText, { color: COLORS.credit }]}>Pago: Día {card.payment_due_day || 'N/A'}</Text>
          </View>
          
          <View style={[styles.progressBarContainer, { marginTop: 8 }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${Math.min(usageRatio * 100, 100)}%`,
                  backgroundColor: usageCritical ? COLORS.credit : usageAlert ? '#ff9500' : COLORS.credit
                }
              ]} 
            />
          </View>
        </View>
      )}

      <View style={styles.actionsRow}>
        {isCredit && (
          <TouchableOpacity style={[styles.actionBtn, styles.payBtn]} onPress={onPay}>
            <Ionicons name="cash-outline" size={16} color="#fff" />
            <Text style={[styles.actionText, { color: '#fff' }]}>Pagar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionBtn} onPress={onAdjust}>
          <Ionicons name="options-outline" size={16} color="#333" />
          <Text style={styles.actionText}>Ajustar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color={COLORS.credit} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(CardItem);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  topMetaRow: {
    marginBottom: 8,
  },
  lastModifiedText: {
    fontSize: 10,
    color: '#8e8e93',
    fontWeight: '500',
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#8e8e93',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f6',
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  bankLogo: {
    width: '100%',
    height: '100%',
  },
  genericLogo: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  bank: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  balanceContainer: {
    marginTop: 16,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  balance: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  creditInfo: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f6',
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  limitText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  daysText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#f2f2f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f6',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f2f2f6',
    flex: 1,
  },
  payBtn: {
    backgroundColor: '#00695c',
  },
  deleteBtn: {
    flex: 0,
    width: 40,
    backgroundColor: '#fff0f0',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
});
