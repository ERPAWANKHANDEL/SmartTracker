import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';
import { SecondaryButton } from '../components/Buttons';
import { Toast } from '../components/Toast';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Icon } from '../components/Icon';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteManualTransaction, deleteSmsTransaction } from '../store/transactionsSlice';
import { selectAllTransactions } from '../store/selectors';

interface FilterState {
  month: string; // YYYY-MM or ''
  category: string;
  bank: string;
  source: string; // 'sms', 'manual', or ''
  type: string; // 'debit', 'credit', or ''
}

const formatAmount = (value: number) => {
  const prefix = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return `${prefix}₹${abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-IN', options);
};

const TransactionHistoryScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const allTransactions = useAppSelector(selectAllTransactions);
  const [filters, setFilters] = useState<FilterState>({ month: '', category: '', bank: '', source: '', type: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Just toggle refreshing state - data is already in Redux from HomeScreen
    setTimeout(() => {
      setRefreshing(false);
      showToast('Transactions refreshed', 'success');
    }, 500);
  }, []);

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
      const matchesType = filters.type ? t.type === filters.type : true;
      return matchesMonth && matchesCategory && matchesBank && matchesSource && matchesType;
    });
  }, [filters, allTransactions]);

  const stats = useMemo(() => {
    const totalDebit = filtered.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalCredit = filtered.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalCredit - totalDebit;
    return { totalDebit, totalCredit, netBalance, count: filtered.length };
  }, [filtered]);

  const handleDelete = (item: any) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.source === 'manual') {
        // Delete manual transaction
        dispatch(deleteManualTransaction(itemToDelete.id));
        
        // Delete from AsyncStorage
        const existingData = await AsyncStorage.getItem('@manual_transactions');
        if (existingData) {
          const transactions = JSON.parse(existingData);
          const updated = transactions.filter((t: any) => t.id !== itemToDelete.id);
          await AsyncStorage.setItem('@manual_transactions', JSON.stringify(updated));
        }
      } else {
        // Delete SMS transaction using date and amount
        const absAmount = Math.abs(itemToDelete.amount);
        dispatch(deleteSmsTransaction({ date: itemToDelete.date, amount: absAmount }));
        
        // Delete from AsyncStorage
        const existingData = await AsyncStorage.getItem('@smarttracker_sms_transactions');
        if (existingData) {
          const transactions = JSON.parse(existingData);
          const updated = transactions.filter((t: any) => 
            !(t.date === itemToDelete.date && t.amount === absAmount)
          );
          await AsyncStorage.setItem('@smarttracker_sms_transactions', JSON.stringify(updated));
        }
      }
      
      showToast('Transaction deleted', 'success');
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      showToast('Failed to delete transaction', 'error');
    } finally {
      setDeleteModalVisible(false);
      setItemToDelete(null);
    }
  };

  const handleEdit = (item: any) => {
    if (item.source === 'manual') {
      navigation.navigate('ManualExpense', { transaction: item });
    } else {
      showToast('SMS transactions cannot be edited', 'info');
    }
  };

  const renderActions = (item: any) => (
    <View style={styles.actionsRow}>
      {item.source === 'manual' && (
        <RectButton style={[styles.actionButton, styles.editButton]} onPress={() => handleEdit(item)}>
          <Text style={styles.actionIcon}>Edit</Text>
        </RectButton>
      )}
      <RectButton 
        style={[styles.actionButton, styles.deleteButton, item.source === 'sms' && styles.fullWidthButton]} 
        onPress={() => handleDelete(item)}
      >
        <Text style={styles.actionText}>Delete</Text>
      </RectButton>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <Swipeable renderRightActions={() => renderActions(item)}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, item.amount < 0 ? styles.debitBadge : styles.creditBadge]}>
            <Text style={styles.badgeText}>{item.amount < 0 ? '↓ Debit' : '↑ Credit'}</Text>
          </View>
          <View style={[styles.sourceBadge, item.source === 'sms' ? styles.smsBadge : styles.manualBadge]}>
            <View style={styles.sourceBadgeContent}>
              {item.source === 'sms' ? (
                <Icon name="transaction" size={10} tintColor={colors.primary} style={{ marginRight: 4 }} />
              ) : (
                <Icon name="checklist" size={10} tintColor={colors.textSecondary} style={{ marginRight: 4 }} />
              )}
              <Text style={styles.sourceBadgeText}>{item.source === 'sms' ? 'SMS' : 'Manual'}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.cardRow}>
          <View style={styles.cardTextGroup}>
            <Text style={styles.title} numberOfLines={2}>{item.description}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{item.category}</Text>
              {item.bank && <Text style={styles.meta}> • {item.bank}</Text>}
            </View>
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, item.amount < 0 ? styles.amountNegative : styles.amountPositive]}>
              {formatAmount(item.amount)}
            </Text>
          </View>
        </View>
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.safeArea}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <View>
            {/* Header with title and filter toggle */}
            <View style={styles.header}>
              <View>
                <Text style={styles.screenTitle}>Transactions</Text>
                <Text style={styles.subtitle}>{stats.count} transaction{stats.count !== 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity 
                style={styles.filterToggle} 
                onPress={() => setShowFilters(!showFilters)}
              >
                <Icon 
                  name="filter" 
                  size={16} 
                  tintColor={colors.primary} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={styles.filterToggleText}>{showFilters ? 'Hide' : 'Show'} Filters</Text>
              </TouchableOpacity>
            </View>

            {/* Summary Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Spent</Text>
                <Text style={[styles.statValue, styles.statDebit]}>₹{stats.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Received</Text>
                <Text style={[styles.statValue, styles.statCredit]}>₹{stats.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Net Balance</Text>
                <Text style={[styles.statValue, stats.netBalance >= 0 ? styles.statCredit : styles.statDebit]}>
                  {stats.netBalance >= 0 ? '+' : ''}₹{stats.netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {/* Filters */}
            {showFilters && (
              <View style={styles.filters}>
                <View style={styles.filterRow}>
                  <View style={styles.filterColumn}>
                    <Text style={styles.filterLabel}>Month</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={filters.month}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, month: value }))}
                        dropdownIconColor={colors.textTertiary}
                      >
                        <Picker.Item label="All Months" value="" />
                        {months.map((m) => (
                          <Picker.Item key={m} label={m} value={m} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.filterColumn}>
                    <Text style={styles.filterLabel}>Type</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={filters.type}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
                        dropdownIconColor={colors.textTertiary}
                      >
                        <Picker.Item label="All Types" value="" />
                        <Picker.Item label="Debit" value="debit" />
                        <Picker.Item label="Credit" value="credit" />
                      </Picker>
                    </View>
                  </View>
                </View>

                <View style={styles.filterRow}>
                  <View style={styles.filterColumn}>
                    <Text style={styles.filterLabel}>Category</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={filters.category}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                        dropdownIconColor={colors.textTertiary}
                      >
                        <Picker.Item label="All Categories" value="" />
                        {categories.map((c) => (
                          <Picker.Item key={c} label={c} value={c} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.filterColumn}>
                    <Text style={styles.filterLabel}>Source</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={filters.source}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, source: value }))}
                        dropdownIconColor={colors.textTertiary}
                      >
                        <Picker.Item label="All Sources" value="" />
                        <Picker.Item label="SMS" value="sms" />
                        <Picker.Item label="Manual" value="manual" />
                      </Picker>
                    </View>
                  </View>
                </View>

                {banks.length > 0 && (
                  <View style={styles.filterRow}>
                    <View style={styles.filterColumn}>
                      <Text style={styles.filterLabel}>Bank</Text>
                      <View style={styles.pickerWrapper}>
                        <Picker
                          selectedValue={filters.bank}
                          onValueChange={(value) => setFilters((prev) => ({ ...prev, bank: value }))}
                          dropdownIconColor={colors.textTertiary}
                        >
                          <Picker.Item label="All Banks" value="" />
                          {banks.map((b) => (
                            <Picker.Item key={b} label={b} value={b} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  </View>
                )}

                <SecondaryButton
                  label="Clear All Filters"
                  onPress={() => setFilters({ month: '', category: '', bank: '', source: '', type: '' })}
                  style={styles.clearButton}
                />
              </View>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or add some transactions</Text>
          </View>
        }
      />
      
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        transactionSource={itemToDelete?.source || 'manual'}
        description={itemToDelete?.description || ''}
      />

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  listContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  screenTitle: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  filterToggle: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterToggleText: {
    color: colors.surface,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
  },
  statDebit: {
    color: '#EF4444',
  },
  statCredit: {
    color: '#10B981',
  },
  filters: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  filterColumn: {
    flex: 1,
  },
  filterLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  clearButton: {
    marginTop: spacing.xs,
  },
  separator: {
    height: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  debitBadge: {
    backgroundColor: '#FEE2E2',
  },
  creditBadge: {
    backgroundColor: '#D1FAE5',
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.text,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sourceBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smsBadge: {
    backgroundColor: '#DBEAFE',
  },
  manualBadge: {
    backgroundColor: '#E0E7FF',
  },
  sourceBadgeText: {
    fontSize: fontSizes.xs,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTextGroup: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  meta: {
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
  },
  dateText: {
    fontSize: fontSizes.xs,
    color: colors.textQuaternary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
  },
  amountNegative: {
    color: '#EF4444',
  },
  amountPositive: {
    color: '#10B981',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.textQuaternary,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: '100%',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    paddingHorizontal: spacing.sm,
  },
  fullWidthButton: {
    width: 120,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  editButton: {
    backgroundColor: '#3B82F6',
    marginRight: 2,
  },
  actionIcon: {
    fontSize: fontSizes.xl,
    marginBottom: spacing.xs,
  },
  actionText: {
    color: colors.surface,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
});

export default TransactionHistoryScreen;
