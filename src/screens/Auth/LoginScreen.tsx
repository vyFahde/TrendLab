import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { RootStackParamList } from '../../types';
import { AccessibleText } from '../../components/AccessibleText';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../theme/colors';
import { ShieldCheck, ArrowRight } from 'lucide-react-native';

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

  const handleLoginSubmit = async (values: LoginFormValues) => {
    try {
      const success = await loginUser(values.email.trim(), values.senha);
      if (success) {
        navigation.replace('MainTabs');
      } else {
        Alert.alert(
          'Falha no Login',
          'E-mail não cadastrado ou senha incorreta. Verifique suas credenciais ou crie uma nova conta.'
        );
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível realizar o login.');
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
