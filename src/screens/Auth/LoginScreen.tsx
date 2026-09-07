import React, { useRef } from 'react';
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
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';
import { RootStackParamList } from '../../types';
import { AccessibleText } from '../../components/AccessibleText';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../theme/colors';
import { ShieldCheck, UserCheck, Sparkles, ArrowRight } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

interface LoginFormValues {
  email: string;
  senha: string;
}

// Esquema de validação com Yup para campos obrigatórios, formato de e-mail e tamanho mínimo de senha
const loginValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Digite um e-mail válido (exemplo: usuario@email.com)')
    .required('O e-mail é obrigatório para acessar.'),
  senha: Yup.string()
    .min(6, 'A senha precisa ter pelo menos 6 caracteres.')
    .required('A senha é obrigatória.'),
});

const DismissKeyboard: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  if (Platform.OS === 'web') {
    return children;
  }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </TouchableWithoutFeedback>
  );
};

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { loginUser } = useAuth();
  const formikRef = useRef<FormikProps<LoginFormValues>>(null);

  const handleLoginSubmit = async (values: LoginFormValues) => {
    try {
      await loginUser(values.email.trim(), values.senha);
      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível realizar o login.');
    }
  };

  // Atalho para apresentação rápida de personas (Teresa ou Gabriel)
  const handleQuickLoginPersona = (persona: 'Teresa' | 'Gabriel') => {
    if (formikRef.current) {
      if (persona === 'Teresa') {
        formikRef.current.setFieldValue('email', 'teresa.tavares@trendlab.com');
        formikRef.current.setFieldValue('senha', '123456');
      } else {
        formikRef.current.setFieldValue('email', 'gabriel.gomes@trendlab.com');
        formikRef.current.setFieldValue('senha', '123456');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <DismissKeyboard>
            <View>
          {/* Cabeçalho da Marca */}
          <View style={styles.brandSection}>
            <View style={styles.logoBadge}>
              <AccessibleText size="xl" weight="bold" color={Colors.white}>
                TL
              </AccessibleText>
            </View>
            <AccessibleText size="3xl" weight="bold" color={Colors.highInkSlate}>
              TrendLab
            </AccessibleText>
            <AccessibleText
              size="sm"
              color={Colors.charcoalSlate}
              style={styles.brandSubtitle}
            >
              Moda Inclusiva com Acessibilidade Digital
            </AccessibleText>
          </View>

          {/* Card do Formulário com Formik e Yup */}
          <View style={styles.formCard}>
            <AccessibleText
              size="xl"
              weight="bold"
              color={Colors.deepSpaceNavy}
              style={styles.formTitle}
            >
              Entrar na sua conta
            </AccessibleText>
            <AccessibleText
              size="sm"
              color={Colors.charcoalSlate}
              style={styles.formInstruction}
            >
              Preencha seus dados para continuar suas compras seguras.
            </AccessibleText>

            <Formik
              innerRef={formikRef}
              initialValues={{ email: '', senha: '' }}
              validationSchema={loginValidationSchema}
              onSubmit={handleLoginSubmit}
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
                  {/* Campo E-mail */}
                  <CustomInput
                    label="E-mail"
                    required
                    placeholder="seu.email@exemplo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    errorMessage={touched.email && errors.email ? errors.email : undefined}
                    isValid={Boolean(touched.email && !errors.email && values.email)}
                    helperText="Usaremos seu e-mail para confirmação dos pedidos."
                  />

                  {/* Campo Senha */}
                  <CustomInput
                    label="Senha de Acesso"
                    required
                    placeholder="Mínimo 6 caracteres"
                    isPassword
                    value={values.senha}
                    onChangeText={handleChange('senha')}
                    onBlur={handleBlur('senha')}
                    errorMessage={touched.senha && errors.senha ? errors.senha : undefined}
                    isValid={Boolean(touched.senha && !errors.senha && values.senha)}
                    helperText="Nunca compartilhe sua senha com ninguém."
                  />

                  {/* Botão Principal de Login */}
                  <CustomButton
                    title="Entrar na Plataforma"
                    onPress={() => handleSubmit()}
                    loading={isSubmitting}
                    variant="primary"
                    icon={<ArrowRight size={20} color={Colors.white} />}
                    style={styles.submitButton}
                    accessibilityHint="Valida o formulário com Formik e entra na loja"
                  />
                </View>
              )}
            </Formik>

            {/* Atalhos Rápidos para Demonstração de Personas na Apresentação */}
            <View style={styles.personaSection}>
              <AccessibleText size="xs" weight="semiBold" color={Colors.charcoalSlate} style={styles.personaTitle}>
                DEMO DE APRESENTAÇÃO (PREENCHIMENTO RÁPIDO):
              </AccessibleText>
              <View style={styles.personaButtonsRow}>
                <TouchableOpacity
                  style={styles.personaChip}
                  onPress={() => handleQuickLoginPersona('Teresa')}
                  accessibilityLabel="Preencher como persona Teresa - Baixa Visão"
                >
                  <UserCheck size={16} color={Colors.electricIris} />
                  <AccessibleText size="xs" weight="bold" color={Colors.electricIris}>
                    Teresa (Baixa Visão)
                  </AccessibleText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.personaChip}
                  onPress={() => handleQuickLoginPersona('Gabriel')}
                  accessibilityLabel="Preencher como persona Gabriel - TDAH"
                >
                  <Sparkles size={16} color={Colors.electricIris} />
                  <AccessibleText size="xs" weight="bold" color={Colors.electricIris}>
                    Gabriel (TDAH)
                  </AccessibleText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Link para Criar Conta */}
            <View style={styles.footerRow}>
              <AccessibleText size="sm" color={Colors.charcoalSlate}>
                Ainda não tem conta?
              </AccessibleText>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                accessibilityRole="button"
                accessibilityLabel="Ir para tela de cadastro de nova conta"
              >
                <AccessibleText
                  size="sm"
                  weight="bold"
                  color={Colors.electricIris}
                  style={styles.registerLink}
                >
                  Cadastre-se agora
                </AccessibleText>
              </TouchableOpacity>
            </View>
          </View>
          </View>
          </DismissKeyboard>
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
    paddingVertical: 24,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.deepSpaceNavy,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Colors.electricIris,
  },
  brandSubtitle: {
    marginTop: 4,
    textAlign: 'center',
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
  formTitle: {
    marginBottom: 4,
  },
  formInstruction: {
    marginBottom: 20,
  },
  submitButton: {
    marginTop: 8,
  },
  personaSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  personaTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  personaButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  personaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: Colors.electricIris,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  registerLink: {
    textDecorationLine: 'underline',
  },
});
