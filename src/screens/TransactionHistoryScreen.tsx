import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Swipeable, RectButton } from 'react-native-gesture-handler';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';
import { sampleTransactions, TransactionItem } from '../data/transactions';
import { SecondaryButton } from '../components/Buttons';

interface FilterState {
  month: string; // YYYY-MM or ''
  category: string;
  bank: string;
}

const formatAmount = (value: number) => {
  const prefix = value < 0 ? '-' : '';
  const abs = Math.abs(value).toFixed(2);
  return `${prefix}₹${abs}`;
};

const formatDate = (iso: string) => iso;

const TransactionHistoryScreen: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({ month: '', category: '', bank: '' });

  const months = useMemo(() => {
    const unique = new Set<string>();
    sampleTransactions.forEach((t) => unique.add(t.date.slice(0, 7)));
    return Array.from(unique).sort().reverse();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    sampleTransactions.forEach((t) => unique.add(t.category));
    return Array.from(unique).sort();
  }, []);

  const banks = useMemo(() => {
    const unique = new Set<string>();
    sampleTransactions.forEach((t) => unique.add(t.bank));
    return Array.from(unique).sort();
  }, []);

  const filtered = useMemo(() => {
    return sampleTransactions.filter((t) => {
      const matchesMonth = filters.month ? t.date.startsWith(filters.month) : true;
      const matchesCategory = filters.category ? t.category === filters.category : true;
      const matchesBank = filters.bank ? t.bank === filters.bank : true;
      return matchesMonth && matchesCategory && matchesBank;
    });
  }, [filters]);

  const handleDelete = (item: TransactionItem) => {
    Alert.alert('Delete transaction', `Delete ${item.title}?`, [{ text: 'OK' }]);
  };

  const handleEdit = (item: TransactionItem) => {
    Alert.alert('Edit transaction', `Edit ${item.title} (wire up form)`, [{ text: 'OK' }]);
  };

  const renderActions = (item: TransactionItem) => (
    <View style={styles.actionsRow}>
      <RectButton style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item)}>
        <Text style={styles.actionText}>Delete</Text>
      </RectButton>
      <RectButton style={[styles.actionButton, styles.editButton]} onPress={() => handleEdit(item)}>
        <Text style={styles.actionText}>Edit</Text>
      </RectButton>
    </View>
  );

  const renderItem = ({ item }: { item: TransactionItem }) => (
    <Swipeable renderRightActions={() => renderActions(item)}>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardTextGroup}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{item.category} · {item.bank} · {formatDate(item.date)}</Text>
            <Text style={styles.source}>{item.source === 'sms' ? 'From SMS' : 'Manual entry'}</Text>
          </View>
          <Text style={[styles.amount, item.amount < 0 ? styles.amountNegative : styles.amountPositive]}>
            {formatAmount(item.amount)}
          </Text>
        </View>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
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
            <Text style={styles.subtitle}>Filter by month, category, or bank. Swipe items to edit or delete.</Text>

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

            <SecondaryButton
              label="Clear Filters"
              onPress={() => setFilters({ month: '', category: '', bank: '' })}
              style={styles.clearButton}
            />
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={renderItem}
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
