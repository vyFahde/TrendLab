import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
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
import { TermsModal } from '../../components/TermsModal';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import Colors from '../../theme/colors';
import { ArrowLeft, UserPlus, Check } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

// Validação do formulário com Yup (nome, e-mail, senha e confirmação).
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
    .max(256, 'A senha deve conter até 256 caracteres.')
    .required('Defina uma senha segura.'),
  confirmarSenha: Yup.string()
    .oneOf([Yup.ref('senha')], 'As senhas digitadas não coincidem.')
    .required('Confirme sua senha.'),
  // LGPD: sem marcar o aceite do termo, o cadastro não é enviado
  aceite: Yup.boolean().oneOf([true], 'É necessário aceitar os termos para criar a conta.'),
});

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { registerUser } = useAuth();
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [termsVisible, setTermsVisible] = useState(false);
  const { palette, highContrast } = useAccessibility();

  // Envia o cadastro ao back-end via AuthContext -> api.register (POST /auth/local/register).
  const handleRegisterSubmit = async (values: {
    nome: string;
    email: string;
    senha: string;
    aceite: boolean;
  }) => {
    setRegisterError(null);
    try {
      await registerUser(values.nome.trim(), values.email.trim(), values.senha, values.aceite);
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Não foi possível salvar o cadastro. Tente novamente.');
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
              initialValues={{ nome: '', email: '', senha: '', confirmarSenha: '', aceite: false }}
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
                setFieldValue,
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
                    placeholder="Mínimo 6 caracteres"
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

                  {/* LGPD: aceite obrigatório do termo; o valor segue ao servidor, que grava a data do aceite */}
                  <View style={styles.termsRow}>
                    <TouchableOpacity
                      onPress={() => setFieldValue('aceite', !values.aceite)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={[
                        styles.checkbox,
                        {
                          borderColor: touched.aceite && errors.aceite ? palette.danger : palette.borderStrong,
                          backgroundColor: values.aceite ? palette.primary : 'transparent',
                        },
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: values.aceite }}
                      accessibilityLabel="Li e aceito os Termos de Uso e a Política de Privacidade"
                    >
                      {values.aceite && <Check size={16} color={palette.primaryContent} />}
                    </TouchableOpacity>
                    <View style={styles.termsText}>
                      <AccessibleText size="sm" color={palette.textPrimary}>
                        Li e aceito os Termos de Uso e a Política de Privacidade (LGPD).
                      </AccessibleText>
                      <TouchableOpacity
                        onPress={() => setTermsVisible(true)}
                        accessibilityRole="link"
                        accessibilityLabel="Ler os termos de uso e a política de privacidade"
                      >
                        <AccessibleText size="sm" weight="bold" color={Colors.electricIris}>
                          Ler os termos
                        </AccessibleText>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {touched.aceite && errors.aceite && (
                    <View style={{ marginBottom: 12 }} accessibilityLiveRegion="assertive" accessibilityRole="alert">
                      <AccessibleText size="xs" weight="bold" color={palette.danger}>
                        {errors.aceite}
                      </AccessibleText>
                    </View>
                  )}

                  {registerError && (
                    <View style={{ marginBottom: 12 }} accessibilityLiveRegion="assertive" accessibilityRole="alert">
                      <AccessibleText size="sm" weight="bold" color={palette.danger}>
                        {registerError}
                      </AccessibleText>
                    </View>
                  )}
                  {isSubmitting && (
                    <AccessibleText size="xs" color={palette.textSecondary} accessibilityLiveRegion="polite">
                      Enviando cadastro. Se o servidor estiver iniciando, isso pode levar até um minuto.
                    </AccessibleText>
                  )}
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
            <TermsModal visible={termsVisible} onClose={() => setTermsVisible(false)} />
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    gap: 4,
  },
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
