import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';
import { getStoredSmsTransactions } from '../services/smsStorage';
import { SecondaryButton } from '../components/Buttons';
import { Toast } from '../components/Toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSmsTransactions, setManualTransactions, deleteManualTransaction } from '../store/transactionsSlice';
import { selectAllTransactions } from '../store/selectors';

interface FilterState {
  month: string; // YYYY-MM or ''
  category: string;
  bank: string;
  source: string; // 'sms', 'manual', or ''
}

const formatAmount = (value: number) => {
  const prefix = value < 0 ? '-' : '';
  const abs = Math.abs(value).toFixed(2);
  return `${prefix}₹${abs}`;
};

const formatDate = (iso: string) => iso;

const TransactionHistoryScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const allTransactions = useAppSelector(selectAllTransactions);
  const [filters, setFilters] = useState<FilterState>({ month: '', category: '', bank: '', source: '' });
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const loadTransactions = async () => {
    try {
      // Load SMS transactions
      const sms = await getStoredSmsTransactions();
      dispatch(setSmsTransactions(sms));

      // Load manual transactions
      const manualData = await AsyncStorage.getItem('@manual_transactions');
      const manual = manualData ? JSON.parse(manualData) : [];
      dispatch(setManualTransactions(manual));
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const months = useMemo(() => {
    const unique = new Set<string>();
    allTransactions.forEach((t) => unique.add(t.date.slice(0, 7)));
    return Array.from(unique).sort().reverse();
  }, [allTransactions]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    allTransactions.forEach((t) => unique.add(t.category));
    return Array.from(unique).sort();
  }, [allTransactions]);

  const banks = useMemo(() => {
    const unique = new Set<string>();
    allTransactions.forEach((t) => {
      if (t.bank) unique.add(t.bank);
    });
    return Array.from(unique).sort();
  }, [allTransactions]);

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      const matchesMonth = filters.month ? t.date.startsWith(filters.month) : true;
      const matchesCategory = filters.category ? t.category === filters.category : true;
      const matchesBank = filters.bank ? (t.bank && t.bank === filters.bank) : true;
      const matchesSource = filters.source ? t.source === filters.source : true;
      return matchesMonth && matchesCategory && matchesBank && matchesSource;
    });
  }, [filters, allTransactions]);

  const handleDelete = async (item: any) => {
    if (item.source === 'manual') {
      // Direct delete without confirmation dialog
      try {
        // Delete from Redux
        dispatch(deleteManualTransaction(item.id));
        
        // Delete from AsyncStorage
        const existingData = await AsyncStorage.getItem('@manual_transactions');
        if (existingData) {
          const transactions = JSON.parse(existingData);
          const updated = transactions.filter((t: any) => t.id !== item.id);
          await AsyncStorage.setItem('@manual_transactions', JSON.stringify(updated));
        }
        
        showToast('✓ Transaction deleted', 'success');
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        showToast('Failed to delete transaction', 'error');
      }
    } else {
      showToast('SMS transactions cannot be deleted', 'info');
    }
  };

  const handleEdit = (item: any) => {
    if (item.source === 'manual') {
      showToast('Edit feature coming soon', 'info');
    } else {
      showToast('SMS transactions cannot be edited', 'info');
    }
  };

  const renderActions = (item: any) => (
    <View style={styles.actionsRow}>
      <RectButton style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item)}>
        <Text style={styles.actionText}>Delete</Text>
      </RectButton>
      <RectButton style={[styles.actionButton, styles.editButton]} onPress={() => handleEdit(item)}>
        <Text style={styles.actionText}>Edit</Text>
      </RectButton>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <Swipeable renderRightActions={() => renderActions(item)}>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardTextGroup}>
            <Text style={styles.title}>{item.description}</Text>
            <Text style={styles.meta}>
              {item.category}{item.bank ? ` · ${item.bank}` : ''} · {formatDate(item.date)}
            </Text>
            <Text style={styles.source}>{item.source === 'sms' ? 'From SMS' : 'Manual entry'}</Text>
          </View>
          <Text style={[styles.amount, item.amount < 0 ? styles.amountNegative : styles.amountPositive]}>
            {formatAmount(item.amount)}
          </Text>
        </View>
      </View>
    </Swipeable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.filters}>
            <Text style={styles.screenTitle}>Transaction History</Text>
            <Text style={styles.subtitle}>Filter by month, category, bank, or source. Swipe items to edit or delete.</Text>

            <View style={styles.filterRow}>
              <View style={styles.filterColumn}>
                <Text style={styles.filterLabel}>Month</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={filters.month}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, month: value }))}
                    dropdownIconColor={colors.textTertiary}
                  >
                    <Picker.Item label="All" value="" />
                    {months.map((m) => (
                      <Picker.Item key={m} label={m} value={m} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.filterColumn}>
                <Text style={styles.filterLabel}>Category</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={filters.category}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                    dropdownIconColor={colors.textTertiary}
                  >
                    <Picker.Item label="All" value="" />
                    {categories.map((c) => (
                      <Picker.Item key={c} label={c} value={c} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.filterColumn}>
                <Text style={styles.filterLabel}>Bank</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={filters.bank}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, bank: value }))}
                    dropdownIconColor={colors.textTertiary}
                  >
                    <Picker.Item label="All" value="" />
                    {banks.map((b) => (
                      <Picker.Item key={b} label={b} value={b} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterColumn}>
                <Text style={styles.filterLabel}>Source</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={filters.source}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, source: value }))}
                    dropdownIconColor={colors.textTertiary}
                  >
                    <Picker.Item label="All" value="" />
                    <Picker.Item label="From SMS" value="sms" />
                    <Picker.Item label="Manual Entry" value="manual" />
                  </Picker>
                </View>
              </View>
            </View>

            <SecondaryButton
              label="Clear Filters"
              onPress={() => setFilters({ month: '', category: '', bank: '', source: '' })}
              style={styles.clearButton}
            />
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={renderItem}
      />
      
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  filters: {
    marginBottom: spacing.xl,
  },
  screenTitle: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    marginBottom: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterColumn: {
    flex: 1,
    marginRight: spacing.md,
  },
  filterLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  clearButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  separator: {
    height: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTextGroup: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  meta: {
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  source: {
    fontSize: fontSizes.xs,
    color: colors.textQuaternary,
  },
  amount: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
  },
  amountNegative: {
    color: '#EF4444',
  },
  amountPositive: {
    color: '#10B981',
  },
  notes: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  actionText: {
    color: colors.surface,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
  },
});

export default TransactionHistoryScreen;
