import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/theme";
import { addAdjustment } from "../db/transactions";
import { useCardsStore } from "../store/useCardsStore";
import { Card } from "../types";

interface AdjustmentModalProps {
  visible: boolean;
  card: Card;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdjustmentModal({
  visible,
  card,
  onClose,
  onSuccess,
}: AdjustmentModalProps) {
  const [description, setDescription] = useState("Ajuste manual");
  const [initialBalance, setInitialBalance] = useState(0);
  const [editableBalance, setEditableBalance] = useState(0);
  const [balanceText, setBalanceText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCards = useCardsStore((state) => state.loadCards);

  useEffect(() => {
    if (visible && card) {
      setInitialBalance(card.balance);
      setEditableBalance(card.balance);
      setBalanceText(card.balance.toString());
    }
  }, [visible, card]);

  const isCredit = card?.type === "credit";

  const handleAdjust = (value: number) => {
    let newBalance = editableBalance + value;
    if (isCredit) {
      if (newBalance > 0) {
        newBalance = 0; // Tope en 0 para tarjetas de crédito
      }
    }
    setEditableBalance(newBalance);
    setBalanceText(newBalance.toString());
  };

  const handleBalanceTextChange = (text: string) => {
    // Limpiar caracteres no numéricos excepto punto y menos
    let cleaned = text.replace(/[^0-9.-]/g, "");

    // Si es crédito, forzamos signo menos al inicio si no está vacío o solo es un signo menos
    if (isCredit) {
      if (cleaned && cleaned !== "-" && !cleaned.startsWith("-")) {
        cleaned = "-" + cleaned;
      }
    }

    setBalanceText(cleaned);

    let parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      if (isCredit) {
        parsed = parsed > 0 ? -parsed : parsed;
        if (parsed > 0) parsed = 0; // Capped at 0
      }
      setEditableBalance(parsed);
    } else {
      setEditableBalance(0);
    }
  };

  const handleRollback = () => {
    setEditableBalance(initialBalance);
    setBalanceText(initialBalance.toString());
  };

  const handleSave = async () => {
    if (!description.trim())
      return Alert.alert("Error", "La descripción es obligatoria");

    const parsedAmount = editableBalance - initialBalance;
    if (parsedAmount === 0)
      return Alert.alert("Error", "No se ha realizado ningún ajuste de saldo");

    setIsSubmitting(true);
    try {
      await addAdjustment(
        card.id,
        description.trim(),
        parsedAmount,
        editableBalance,
      );
      await loadCards(); // Actualizar estado global

      handleClose();
      onSuccess(); // Recargar historial local
    } catch (error) {
      console.error("Error saving adjustment:", error);
      Alert.alert("Error", "No se pudo guardar el ajuste");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDescription("Ajuste manual");
    setBalanceText("");
    onClose();
  };

  const themeColor = isCredit ? COLORS.credit : COLORS.debit;
  const themeBgColor = isCredit
    ? COLORS.creditBackground
    : COLORS.debitBackground;
  const hasChanges = editableBalance !== initialBalance;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Ajuste Manual</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción del Ajuste</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Ej. Corrección de saldo"
              />
            </View>

            <Text style={styles.label}>Monto / Saldo Nuevo</Text>

            <View style={styles.adjustRow}>
              {/* Botones de Resta (Izquierda) */}
              <View style={styles.sideButtonsCol}>
                <TouchableOpacity
                  onPress={() => handleAdjust(-50)}
                  style={[
                    styles.adjustBtn,
                    { backgroundColor: themeBgColor, borderColor: themeColor },
                  ]}
                >
                  <Text style={[styles.adjustBtnText, { color: themeColor }]}>
                    -50
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAdjust(-100)}
                  style={[
                    styles.adjustBtn,
                    { backgroundColor: themeBgColor, borderColor: themeColor },
                  ]}
                >
                  <Text style={[styles.adjustBtnText, { color: themeColor }]}>
                    -100
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAdjust(-1000)}
                  style={[
                    styles.adjustBtn,
                    { backgroundColor: themeBgColor, borderColor: themeColor },
                  ]}
                >
                  <Text style={[styles.adjustBtnText, { color: themeColor }]}>
                    -1000
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Saldo Central Editable (diseñado como tarjeta premium gris claro) */}
              <View style={styles.centerBalanceContainer}>
                <View style={styles.centerBalanceCard}>
                  <View style={styles.balanceInputWrapper}>
                    <Text
                      style={[styles.currencySymbol, { color: themeColor }]}
                    >
                      $
                    </Text>
                    <TextInput
                      style={[styles.balanceInput, { color: themeColor }]}
                      value={balanceText}
                      onChangeText={handleBalanceTextChange}
                      keyboardType="numeric"
                      selectTextOnFocus
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.editableIndicator}>
                    <Ionicons
                      name="pencil"
                      size={10}
                      color="#8e8e93"
                      style={{ marginRight: 3 }}
                    />
                    <Text style={styles.editableText}>EDITABLE</Text>
                  </View>
                </View>
                <Text style={styles.balanceHelper}>
                  Saldo actual: ${initialBalance.toFixed(2)}
                </Text>
              </View>

              {/* Botones de Suma (Derecha) */}
              <View style={styles.sideButtonsCol}>
                <TouchableOpacity
                  onPress={() => handleAdjust(1000)}
                  style={[
                    styles.adjustBtn,
                    { backgroundColor: themeBgColor, borderColor: themeColor },
                  ]}
                >
                  <Text style={[styles.adjustBtnText, { color: themeColor }]}>
                    +1000
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAdjust(100)}
                  style={[
                    styles.adjustBtn,
                    { backgroundColor: themeBgColor, borderColor: themeColor },
                  ]}
                >
                  <Text style={[styles.adjustBtnText, { color: themeColor }]}>
                    +100
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAdjust(50)}
                  style={[
                    styles.adjustBtn,
                    { backgroundColor: themeBgColor, borderColor: themeColor },
                  ]}
                >
                  <Text style={[styles.adjustBtnText, { color: themeColor }]}>
                    +50
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón Rollback */}
            <TouchableOpacity
              style={[
                styles.rollbackBtn,
                hasChanges && {
                  backgroundColor: themeBgColor,
                  borderColor: themeColor,
                },
              ]}
              onPress={handleRollback}
              disabled={!hasChanges}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color={hasChanges ? themeColor : "#c7c7cc"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.rollbackText,
                  { color: hasChanges ? "#333" : "#c7c7cc" },
                ]}
              >
                Restaurar saldo inicial
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: themeColor },
                (isSubmitting || !hasChanges) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isSubmitting || !hasChanges}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? "Guardando..." : "Aplicar Ajuste"}
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
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
    fontSize: 20,
    fontWeight: "bold",
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: "#8e8e93",
    marginBottom: 8,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#f2f2f6",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  adjustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  sideButtonsCol: {
    flexDirection: "column",
    gap: 10,
    width: "24%",
  },
  adjustBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  adjustBtnText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  centerBalanceContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  centerBalanceCard: {
    backgroundColor: "#f2f2f6",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e5ea",
    width: "75%",
  },
  balanceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 2,
  },
  balanceInput: {
    fontSize: 24,
    fontWeight: "bold",
    minWidth: 80,
    maxWidth: 140,
    paddingVertical: 5,
    textAlign: "center",
  },
  editableIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  editableText: {
    fontSize: 9,
    color: "#8e8e93",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  balanceHelper: {
    fontSize: 12,
    color: "#8e8e93",
    marginTop: 6,
    textAlign: "center",
  },
  rollbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e5ea",
    borderRadius: 10,
    paddingVertical: 12,
    marginVertical: 15,
    backgroundColor: "#f9f9fb",
  },
  rollbackText: {
    fontSize: 14,
    fontWeight: "500",
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
