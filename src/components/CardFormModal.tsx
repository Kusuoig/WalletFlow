import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { COLORS as APP_COLORS } from "../constants/theme";
import { addCard, updateCard } from "../db/cards";
import { useCardsStore } from "../store/useCardsStore";
import { Card } from "../types";

interface CardFormModalProps {
  visible: boolean;
  onClose: () => void;
  cardToEdit?: Card;
}

const PREDEFINED_BANKS = [
  { id: "bbva", name: "BBVA", logo: "https://www.google.com/s2/favicons?domain=bbva.mx&sz=128", supportedTypes: ["debit", "credit"], defaultColor: "#004481" },
  { id: "santander", name: "Santander", logo: "https://www.google.com/s2/favicons?domain=santander.com.mx&sz=128", supportedTypes: ["debit", "credit"], defaultColor: "#EC0000" },
  { id: "revolut", name: "Revolut", logo: "https://www.google.com/s2/favicons?domain=revolut.com&sz=128", supportedTypes: ["debit"], defaultColor: "#191C1F" },
  { id: "openbank", name: "Openbank", logo: "https://www.google.com/s2/favicons?domain=openbank.es&sz=128", supportedTypes: ["debit", "credit"], defaultColor: "#FF007A" },
  { id: "uala", name: "Ualá", logo: "https://www.google.com/s2/favicons?domain=uala.com.mx&sz=128", supportedTypes: ["debit", "credit"], defaultColor: "#6300E6" },
  { id: "plata", name: "Plata", logo: "https://www.google.com/s2/favicons?domain=platacard.mx&sz=128", supportedTypes: ["credit"], defaultColor: "#1A1A1A" },
];

export default function CardFormModal({
  visible,
  onClose,
  cardToEdit,
}: CardFormModalProps) {
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [customBankName, setCustomBankName] = useState("");
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [balance, setBalance] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentDueDay, setPaymentDueDay] = useState("");
  const [selectedColor, setSelectedColor] = useState(APP_COLORS.debit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCards = useCardsStore((state) => state.loadCards);

  useEffect(() => {
    if (visible && cardToEdit) {
      setName(cardToEdit.name);
      setType(cardToEdit.type);
      setBalance(Math.abs(cardToEdit.balance).toString());
      setCreditLimit(cardToEdit.credit_limit ? cardToEdit.credit_limit.toString() : "");
      setDueDate(cardToEdit.due_date ? cardToEdit.due_date.toString() : "");
      setPaymentDueDay(cardToEdit.payment_due_day ? cardToEdit.payment_due_day.toString() : "");
      setSelectedColor(cardToEdit.color || (cardToEdit.type === "debit" ? APP_COLORS.debit : APP_COLORS.credit));
      
      const matched = PREDEFINED_BANKS.find(b => b.name.toLowerCase() === cardToEdit.bank.toLowerCase());
      if (matched) {
        setSelectedBank(matched.id);
      } else {
        setSelectedBank("custom");
        setCustomBankName(cardToEdit.bank);
        setBank(cardToEdit.bank);
      }
    } else if (visible) {
      // Agregar tarjeta nuevo estado
      setName("");
      setBank("");
      setSelectedBank(null);
      setCustomBankName("");
      setType("debit");
      setBalance("");
      setCreditLimit("");
      setDueDate("");
      setPaymentDueDay("");
      setSelectedColor(APP_COLORS.debit);
    }
  }, [visible, cardToEdit]);

  const filteredBanks = PREDEFINED_BANKS.filter((b) =>
    b.supportedTypes.includes(type)
  );

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Error", "El nombre es obligatorio");
    if (!bank.trim()) return Alert.alert("Error", "El banco es obligatorio");

    const parsedBalance = parseFloat(balance) || 0;
    if (parsedBalance < 0)
      return Alert.alert(
        "Error",
        "El balance inicial debe ser positivo (la app aplica el signo internamente).",
      );

    let parsedLimit = 0;
    let parsedDueDate = 0;
    let parsedPaymentDueDay = 0;

    if (type === "credit") {
      parsedLimit = parseFloat(creditLimit) || 0;
      parsedDueDate = parseInt(dueDate, 10) || 0;
      parsedPaymentDueDay = parseInt(paymentDueDay, 10) || 0;

      if (parsedLimit <= 0)
        return Alert.alert("Error", "El límite de crédito debe ser mayor a 0");
      if (parsedDueDate < 1 || parsedDueDate > 31)
        return Alert.alert("Error", "El día de corte debe estar entre 1 y 31");
      if (parsedPaymentDueDay < 1 || parsedPaymentDueDay > 31)
        return Alert.alert("Error", "El día de pago debe estar entre 1 y 31");
    }

    setIsSubmitting(true);
    try {
      if (cardToEdit) {
        await updateCard(
          cardToEdit.id,
          name.trim(),
          bank.trim(),
          type,
          parsedBalance,
          type === "credit" ? parsedLimit : null,
          type === "credit" ? parsedDueDate : null,
          selectedColor,
          type === "credit" ? parsedPaymentDueDay : null
        );
      } else {
        await addCard(
          name.trim(),
          bank.trim(),
          type,
          parsedBalance,
          type === "credit" ? parsedLimit : undefined,
          type === "credit" ? parsedDueDate : undefined,
          selectedColor,
          type === "credit" ? parsedPaymentDueDay : undefined
        );
      }

      await loadCards(); // Actualizar estado global
      handleClose();
    } catch (error) {
      console.error("Error saving card:", error);
      Alert.alert("Error", "No se pudo guardar la tarjeta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectBank = (bankId: string) => {
    setSelectedBank(bankId);
    if (bankId === "custom") {
      setBank(customBankName);
      setSelectedColor(type === "debit" ? APP_COLORS.debit : APP_COLORS.credit);
    } else {
      const selectedInfo = PREDEFINED_BANKS.find((b) => b.id === bankId);
      if (selectedInfo) {
        setBank(selectedInfo.name);
        setSelectedColor(selectedInfo.defaultColor);
      }
    }
  };

  const handleTypeChange = (newType: "debit" | "credit") => {
    setType(newType);
    if (selectedBank && selectedBank !== "custom") {
      const bankData = PREDEFINED_BANKS.find(b => b.id === selectedBank);
      if (bankData && !bankData.supportedTypes.includes(newType)) {
        setSelectedBank(null);
        setBank("");
        setSelectedColor(newType === "debit" ? APP_COLORS.debit : APP_COLORS.credit);
      }
    } else {
      setSelectedColor(newType === "debit" ? APP_COLORS.debit : APP_COLORS.credit);
    }
  };

  const handleClose = () => {
    setName("");
    setBank("");
    setSelectedBank(null);
    setCustomBankName("");
    setType("debit");
    setBalance("");
    setCreditLimit("");
    setDueDate("");
    setPaymentDueDay("");
    setSelectedColor(APP_COLORS.debit);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{cardToEdit ? "Editar Tarjeta" : "Agregar Tarjeta"}</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.formContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === "debit" && styles.typeButtonActive,
              ]}
              onPress={() => handleTypeChange("debit")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === "debit" && styles.typeButtonTextActive,
                ]}
              >
                Débito
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === "credit" && styles.typeButtonActive,
              ]}
              onPress={() => handleTypeChange("credit")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === "credit" && styles.typeButtonTextActive,
                ]}
              >
                Crédito
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Banco</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.bankListContainer}
            >
              {filteredBanks.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.bankSelectorCard,
                    selectedBank === b.id && styles.bankSelectorCardActive,
                  ]}
                  onPress={() => handleSelectBank(b.id)}
                >
                  <Image source={{ uri: b.logo }} style={styles.bankSelectorLogo} resizeMode="contain" />
                  <Text style={[styles.bankSelectorName, selectedBank === b.id && styles.bankSelectorNameActive]}>{b.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.bankSelectorCard,
                  selectedBank === "custom" && styles.bankSelectorCardActive,
                ]}
                onPress={() => handleSelectBank("custom")}
              >
                <View style={styles.bankSelectorLogoPlaceholder}>
                  <Ionicons name="apps-outline" size={20} color="#8e8e93" />
                </View>
                <Text style={[styles.bankSelectorName, selectedBank === "custom" && styles.bankSelectorNameActive]}>Otro</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {selectedBank === "custom" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Banco</Text>
              <TextInput
                style={styles.input}
                value={customBankName}
                onChangeText={(text) => {
                  setCustomBankName(text);
                  setBank(text);
                  setSelectedColor(type === "debit" ? APP_COLORS.debit : APP_COLORS.credit);
                }}
                placeholder="Ingresa el nombre del banco..."
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de Tarjeta (ej. Visa Gold)</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Mi tarjeta..."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {type === "debit" ? "Saldo Inicial" : "Deuda Actual (positivo)"}
            </Text>
            <TextInput
              style={styles.input}
              value={balance}
              onChangeText={setBalance}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>

          {type === "credit" && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Límite de Crédito</Text>
                <TextInput
                  style={styles.input}
                  value={creditLimit}
                  onChangeText={setCreditLimit}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Día de Corte (1-31)</Text>
                <TextInput
                  style={styles.input}
                  value={dueDate}
                  onChangeText={setDueDate}
                  keyboardType="number-pad"
                  placeholder="15"
                  maxLength={2}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Día de Pago (1-31)</Text>
                <TextInput
                  style={styles.input}
                  value={paymentDueDay}
                  onChangeText={setPaymentDueDay}
                  keyboardType="number-pad"
                  placeholder="5"
                  maxLength={2}
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.saveButton,
              isSubmitting && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? "Guardando..." : cardToEdit ? "Guardar Cambios" : "Guardar Tarjeta"}
            </Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f6",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  formContainer: {
    padding: 20,
  },
  typeSelector: {
    flexDirection: "row",
    backgroundColor: "#f2f2f6",
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonText: {
    fontSize: 16,
    color: "#8e8e93",
    fontWeight: "500",
  },
  typeButtonTextActive: {
    color: "#000",
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#f2f2f6",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "#99c7ff",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  typeButtonDisabled: {
    opacity: 0.35,
  },
  typeButtonTextDisabled: {
    color: '#c7c7cc',
    textDecorationLine: 'line-through',
  },
  bankListContainer: {
    paddingVertical: 4,
    gap: 12,
  },
  bankSelectorCard: {
    width: 80,
    height: 84,
    borderRadius: 12,
    backgroundColor: '#f2f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 6,
    marginRight: 8,
  },
  bankSelectorCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bankSelectorLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  bankSelectorLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e5ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  bankSelectorName: {
    fontSize: 11,
    color: '#8e8e93',
    fontWeight: '500',
    textAlign: 'center',
  },
  bankSelectorNameActive: {
    color: '#000',
    fontWeight: '600',
  },
});
