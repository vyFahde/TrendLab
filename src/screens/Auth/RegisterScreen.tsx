import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { RootStackParamList } from '../../types';
import { AccessibleText } from '../../components/AccessibleText';
import { AccessibilityBar } from '../../components/AccessibilityBar';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import Colors from '../../theme/colors';
import { ArrowLeft, UserPlus } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const registerValidationSchema = Yup.object().shape({
  nome: Yup.string()
    .trim()
    .min(3, 'O nome deve ter no mínimo 3 caracteres.')
    .required('Informe seu nome completo.'),
  email: Yup.string()
    .trim()
    .email('Digite um e-mail válido (ex: joao@email.com).')
    .required('O e-mail é obrigatório.'),
  senha: Yup.string()
    .min(6, 'A senha deve conter ao menos 6 caracteres.')
    .required('Defina uma senha segura.'),
  confirmarSenha: Yup.string()
    .oneOf([Yup.ref('senha')], 'As senhas digitadas não coincidem.')
    .required('Confirme sua senha.'),
});

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { registerUser } = useAuth();
  const { palette, highContrast } = useAccessibility();

  const handleRegisterSubmit = async (values: {
    nome: string;
    email: string;
    senha: string;
  }) => {
    try {
      await registerUser(values.nome.trim(), values.email.trim(), values.senha);
      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar o cadastro.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <AccessibilityBar />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: palette.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela anterior"
          >
            <ArrowLeft size={20} color={palette.iconPrimary} />
            <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy}>
              Voltar para o Login
            </AccessibleText>
          </TouchableOpacity>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                borderWidth: highContrast ? 2 : 1,
              },
            ]}
          >
            <AccessibleText size="2xl" weight="bold" color={Colors.deepSpaceNavy} style={styles.title}>
              Criar Nova Conta
            </AccessibleText>
            <AccessibleText size="sm" color={Colors.charcoalSlate} style={styles.subtitle}>
              Cadastre-se para ter acesso a provador virtual adaptativo e navegação inclusiva.
            </AccessibleText>

            <Formik
              initialValues={{ nome: '', email: '', senha: '', confirmarSenha: '' }}
              validationSchema={registerValidationSchema}
              onSubmit={handleRegisterSubmit}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isSubmitting,
              }) => (
                <View>
                  <CustomInput
                    label="Nome Completo"
                    required
                    placeholder="Ex: Maria Silva"
                    value={values.nome}
                    onChangeText={handleChange('nome')}
                    onBlur={handleBlur('nome')}
                    errorMessage={touched.nome && errors.nome ? errors.nome : undefined}
                    isValid={Boolean(touched.nome && !errors.nome && values.nome)}
                  />

                  <CustomInput
                    label="E-mail"
                    required
                    placeholder="Ex: maria@exemplo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    errorMessage={touched.email && errors.email ? errors.email : undefined}
                    isValid={Boolean(touched.email && !errors.email && values.email)}
                  />

                  <CustomInput
                    label="Senha"
                    required
                    placeholder="Mínimo 6 dígitos"
                    isPassword
                    value={values.senha}
                    onChangeText={handleChange('senha')}
                    onBlur={handleBlur('senha')}
                    errorMessage={touched.senha && errors.senha ? errors.senha : undefined}
                    isValid={Boolean(touched.senha && !errors.senha && values.senha)}
                  />

                  <CustomInput
                    label="Confirmar Senha"
                    required
                    placeholder="Repita sua senha"
                    isPassword
                    value={values.confirmarSenha}
                    onChangeText={handleChange('confirmarSenha')}
                    onBlur={handleBlur('confirmarSenha')}
                    errorMessage={
                      touched.confirmarSenha && errors.confirmarSenha
                        ? errors.confirmarSenha
                        : undefined
                    }
                    isValid={Boolean(
                      touched.confirmarSenha && !errors.confirmarSenha && values.confirmarSenha
                    )}
                  />

                  <CustomButton
                    title="Concluir Cadastro"
                    onPress={() => handleSubmit()}
                    loading={isSubmitting}
                    variant="primary"
                    icon={<UserPlus size={20} color={palette.primaryContent} />}
                    style={styles.submitButton}
                  />
                </View>
              )}
            </Formik>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cleanCanvas,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.cleanCanvas,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.deepSpaceNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    marginBottom: 6,
  },
  subtitle: {
    marginBottom: 20,
  },
  submitButton: {
    marginTop: 10,
  },
});
