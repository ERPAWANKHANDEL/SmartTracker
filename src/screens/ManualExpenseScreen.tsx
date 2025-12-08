import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch } from '../store/hooks';
import { addManualTransaction } from '../store/transactionsSlice';

import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { Toast } from '../components/Toast';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';

const categories = [
  'Food & Dining',
  'Transport',
  'Bills & Utilities',
  'Shopping',
  'Health',
  'Entertainment',
  'Travel',
  'Other',
];

interface FormValues {
  category: string;
  amount: string;
  date: string;
  notes: string;
}

const validationSchema = Yup.object().shape({
  category: Yup.string().required('Select a category'),
  amount: Yup.number()
    .typeError('Enter a valid amount')
    .positive('Amount must be positive')
    .required('Amount is required'),
  date: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/u, 'Use YYYY-MM-DD format')
    .required('Date is required'),
  notes: Yup.string().max(120, 'Keep notes under 120 characters'),
});

const ManualExpenseScreen: React.FC<any> = ({ navigation }) => {
  const today = new Date().toISOString().slice(0, 10);
  const dispatch = useAppDispatch();
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const initialValues: FormValues = {
    category: '',
    amount: '',
    date: today,
    notes: '',
  };

  const handleSave = async (values: FormValues) => {
    try {
      const newTransaction = {
        id: `manual-${Date.now()}`,
        category: values.category,
        amount: Number(values.amount),
        date: values.date,
        notes: values.notes,
        type: 'debit' as const,
      };

      // Dispatch to Redux store
      dispatch(addManualTransaction(newTransaction));

      // Also save to AsyncStorage for persistence
      const existingData = await AsyncStorage.getItem('@manual_transactions');
      const existingTransactions = existingData ? JSON.parse(existingData) : [];
      const updatedTransactions = [...existingTransactions, newTransaction];
      await AsyncStorage.setItem('@manual_transactions', JSON.stringify(updatedTransactions));

      showToast('✓ Expense saved successfully', 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      showToast('Failed to save expense. Please try again.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Manual Add Expense</Text>
        <Text style={styles.subtitle}>Log a new expense with category, amount, date, and notes.</Text>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSave}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            setFieldValue,
            isSubmitting,
          }: FormikProps<FormValues>) => (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={values.category}
                    onValueChange={(itemValue: string) => setFieldValue('category', itemValue)}
                    dropdownIconColor={colors.textTertiary}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a category" value="" color={colors.textQuaternary} />
                    {categories.map((category) => (
                      <Picker.Item key={category} label={category} value={category} />
                    ))}
                  </Picker>
                </View>
                {touched.category && errors.category ? (
                  <Text style={styles.errorText}>{errors.category}</Text>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Amount</Text>
                <TextInput
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  value={values.amount}
                  onChangeText={handleChange('amount')}
                  onBlur={handleBlur('amount')}
                  style={styles.input}
                />
                {touched.amount && errors.amount ? (
                  <Text style={styles.errorText}>{errors.amount}</Text>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  placeholder="YYYY-MM-DD"
                  value={values.date}
                  onChangeText={handleChange('date')}
                  onBlur={handleBlur('date')}
                  style={styles.input}
                />
                {touched.date && errors.date ? (
                  <Text style={styles.errorText}>{errors.date}</Text>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  placeholder="Optional notes"
                  value={values.notes}
                  onChangeText={handleChange('notes')}
                  onBlur={handleBlur('notes')}
                  style={[styles.input, styles.notesInput]}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {touched.notes && errors.notes ? (
                  <Text style={styles.errorText}>{errors.notes}</Text>
                ) : null}
              </View>

              <View style={styles.actions}>
                <PrimaryButton
                  label="Save Expense"
                  onPress={() => handleSubmit()}
                  disabled={isSubmitting}
                />
                <SecondaryButton
                  label="Cancel"
                  onPress={() => navigation.goBack()}
                  style={styles.cancelButton}
                />
              </View>
            </>
          )}
        </Formik>
      </ScrollView>
      
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
    backgroundColor: colors.surface,
  },
  container: {
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    marginBottom: spacing.xl,
  },
  fieldGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSizes.md,
    color: colors.text,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.sm,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  picker: {
    height: 52,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSizes.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  notesInput: {
    minHeight: 120,
  },
  errorText: {
    marginTop: spacing.xs,
    color: colors.warning,
    fontSize: fontSizes.sm,
  },
  actions: {
    marginTop: spacing.lg,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
});

export default ManualExpenseScreen;
