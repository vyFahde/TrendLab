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
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../theme/colors';
import { ArrowLeft, UserPlus } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

// Esquema de validação com Yup para cadastro: nome mínimo, formato de e-mail e conferência de senhas idênticas
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

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { registerUser } = useAuth();

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela anterior"
          >
            <ArrowLeft size={20} color={Colors.deepSpaceNavy} />
            <AccessibleText size="sm" weight="bold" color={Colors.deepSpaceNavy}>
              Voltar para o Login
            </AccessibleText>
          </TouchableOpacity>

          <View style={styles.formCard}>
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
                  {/* Nome */}
                  <CustomInput
                    label="Nome Completo"
                    required
                    placeholder="Ex: Teresa Tavares"
                    value={values.nome}
                    onChangeText={handleChange('nome')}
                    onBlur={handleBlur('nome')}
                    errorMessage={touched.nome && errors.nome ? errors.nome : undefined}
                    isValid={Boolean(touched.nome && !errors.nome && values.nome)}
                  />

                  {/* E-mail */}
                  <CustomInput
                    label="E-mail"
                    required
                    placeholder="Ex: teresa@exemplo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    errorMessage={touched.email && errors.email ? errors.email : undefined}
                    isValid={Boolean(touched.email && !errors.email && values.email)}
                  />

                  {/* Senha */}
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

                  {/* Confirmar Senha */}
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

                  {/* Botão Cadastrar */}
                  <CustomButton
                    title="Concluir Cadastro"
                    onPress={() => handleSubmit()}
                    loading={isSubmitting}
                    variant="primary"
                    icon={<UserPlus size={20} color={Colors.white} />}
                    style={styles.submitButton}
                  />
                </View>
              )}
            </Formik>
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
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
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
