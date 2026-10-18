# 🛍️ TrendLab - E-Commerce Mobile Acessível & Inclusivo

> **Desenvolvido por:** João Teixeira Duarte Neto  
> **Instituição:** Centro Universitário CESMAC  

---

## 📖 1. Sobre a Aplicação
O **TrendLab** é uma plataforma mobile de e-commerce de moda desenvolvida com foco em **Acessibilidade Digital (WCAG AAA)** e **Calm UI**. O projeto foi desenhado para eliminar barreiras de acesso e proporcionar autonomia para usuários com diferentes necessidades:
- **Baixa Visão, Miopia Severa e Astigmatismo:** Interface com tipografia de alto contraste, ampliação dinâmica de fontes, sintetizador de voz nativo (`expo-speech`) e modo de super zoom para análise de tecidos.
- **TDAH e Dislexia:** Navegação objetiva em tópicos curtos (bullet points), ausência de anúncios distrativos e **Modo Foco** para redução de sobrecarga sensorial.
- **Daltonismo e Baixa Literacia Digital:** Identificação nominal explícita de cores, botões com alvos táteis ampliados (mínimo 44x44px / 52px) e feedbacks com ícones universais associados a cores.

---

## 🎨 2. Paleta de Cores Oficial

| Cor | Código Hex | Aplicação na Interface | Relação de Contraste |
| :--- | :--- | :--- | :--- |
| **Deep Space Navy** | `#1E1B4B` | Cabeçalhos, Barra Inferior e Destaques | Contraste **16.5:1 (AAA)** |
| **Electric Iris** | `#4338CA` | Botões Principais de Ação (CTA) | Contraste **7.2:1 (AAA)** |
| **Warm Coral** | `#C43D27` | Badges de Foco e Destaques Importantes | Contraste **5.2:1 (AA com branco) / 4.96:1 (Clean Canvas)** |
| **Clean Canvas** | `#F8FAFC` | Fundo Principal das Telas (Anti-fadiga) | Descanso Visual |
| **High-Ink Slate** | `#0F172A` | Títulos, Textos Primários e Preços | Contraste **17.8:1 (AAA)** |
| **Charcoal Slate** | `#334155` | Legendas, Descrições e Subtítulos | Contraste **8.5:1 (AAA)** |
| **Success Emerald** | `#15803D` | Sucesso, Tamanho Ideal no Provador | Acessível com ícone **✓** |
| **Alert Crimson** | `#B91C1C` | Alertas e Erros de Preenchimento | Acessível com ícone **⚠️** |

---

## 📱 3. Estrutura, Telas e Recursos Nativos Implementados

### Barra Superior de Acessibilidade (`src/components/AccessibilityBar.tsx`)
Presente em todas as telas do aplicativo, oferecendo:
- **Escala de Fonte em Tempo Real (`A-` / `A+`)**
- **Modo Foco (Calm UI)** e **Alto Contraste AAA**
- **Leitor de Áudio Nativo (`expo-speech`):** Síntese de voz em português (`pt-BR`) com leitura do resumo de acessibilidade e tamanho recomendado.
- **Identificação de Rede / Wi-Fi (`expo-network`):** Indicador em tempo real do estado de conexão (`Wi-Fi`, `Online` ou `Offline`) e endereço IP do dispositivo.

### Fluxo de Autenticação
- **Login (`src/screens/Auth/LoginScreen.tsx`):** Validação com Formik + Yup e sincronização global de sessão com **Zustand** (`useUsuarioStore`).
- **Cadastro (`src/screens/Auth/RegisterScreen.tsx`):** Criação de conta com validação simultânea de nome completo, e-mail, senha e confirmação de senha.

### Catálogo e Descoberta (Listagem Otimizada com `FlatList`)
- **Catálogo Inicial (`src/screens/Home/HomeScreen.tsx`):**
  - **Listagem Otimizada (`FlatList` - PM-10):** Carregamento preguiçoso (*Lazy Loading*) de cards de produtos com `ListHeaderComponent` e `ListEmptyComponent`.
  - **Modal de Filtros Rápidos e Busca por Voz (PM-11):** Filtro por categoria, tamanho e ordenação de preço com notificações `Toast` (`ToastAndroid` + `AccessibleToast`).

### Provador Virtual Interativo & Câmera Nativa
- **Provador Virtual (`src/screens/FittingRoom/FittingRoomScreen.tsx`):**
  - **Calculadora Anatômica:** Calcula automaticamente o tamanho ideal em letras (`P` a `XG`) e numérico (`38` a `46`) com base em altura, peso e preferência sensorial de caimento.
  - **Espelho Virtual com Câmera e Galeria (`expo-image-picker` - PM-12):** Captura foto pela câmera nativa (`launchCameraAsync`) ou seleciona da galeria (`launchImageLibraryAsync`) em Base64/URI.
  - **Recomendação Falada (`expo-speech`):** Leitura em voz alta do tamanho ideal sugerido.
  - **Catálogo Compatível (`FlatList`):** Lista peças disponíveis no tamanho calculado do usuário.

### Detalhes da Peça
- **Detalhes do Produto (`src/screens/ProductDetail/ProductDetailScreen.tsx`):**
  - **Super Zoom:** Ampliação da peça para inspeção de textura e acabamento da costura.
  - **Audiodescrição Completa (`expo-speech`):** Leitura em voz alta do nome, preço, tecido, cores e tópicos da peça.
  - **Integração com Provador Virtual:** Destaca com estrela (`★`) o tamanho calculado no perfil do usuário.

### Sacola, Compra Expressa e Localização GPS
- **Sacola & Checkout (`src/screens/Cart/CartScreen.tsx`):**
  - **Confirmação com `Alert` e `Toast` (PM-11):** Confirmação segura antes de remover itens e aviso instantâneo via Toast.
  - **Localização e Endereço via GPS (`expo-location`):** Botão *"Usar Minha Localização Atual (GPS)"* que obtém coordenadas (`getCurrentPositionAsync`) e geocodificação reversa (`reverseGeocodeAsync`) para preencher CEP e endereço sem digitação.
  - **Modal de Compra Expressa (PM-11):** Opção de compra em 1-clique com seleção direta entre **Pix**, **Cartão** e **Boleto**.
- **Pedido Confirmado (`src/screens/Cart/OrderSuccessScreen.tsx`):** Confirmação visual e sonora (`expo-speech`) do pedido registrado.

### Minha Conta & Configurações
- **Minha Conta (`src/screens/Profile/ProfileScreen.tsx`):**
  - **Foto de Perfil com Câmera / Galeria (`expo-image-picker` - PM-12):** Atualização de foto do usuário persistida globalmente.
  - **Diagnóstico de Conectividade (`expo-network`):** Exibe tipo de rede ativa (`Wi-Fi` / `Dados Móveis`) e IP local.
  - **Histórico de Pedidos (Zustand):** Lista de pedidos concluídos com modal de recibo detalhado.
  - **Painel de Acessibilidade:** Controles completos de escala tipográfica, Modo Foco e Alto Contraste.

---

## 🏗️ 4. Arquitetura do Projeto

```
TrendLab/
├── App.tsx                     # Ponto de entrada com Providers e AccessibleToast
├── app.json                    # Configurações e plugins nativos do Expo
├── eas.json                    # Canais de deploy do EAS
└── src/
    ├── components/             # Componentes modulares (AccessibilityBar, AccessibleToast, ProductCard...)
    ├── context/                # Context API (Acessibilidade, Autenticação e Sacola)
    ├── data/                   # Base de dados de produtos inclusivos
    ├── navigation/             # Navegação híbrida: Native Stack + Bottom Tabs (4 abas)
    ├── screens/                # 8 Telas completas da aplicação
    ├── store/                  # Gerenciamento de Estado Global com Zustand (usuario-store, useToastStore)
    ├── theme/                  # Tokens de cores (colors.ts) e espaçamento/raios (spacing.ts)
    └── types/                  # Tipagem estrita com TypeScript
```

---

## 🚀 5. Como Executar o Projeto Localmente

1. Abra o terminal na pasta raiz do projeto:
   ```bash
   cd "C:\Users\Joao\Documents\TrendLab"
   ```
2. Inicie o servidor do Expo:
   ```bash
   npx expo start
   ```
3. Para executar:
   - **No Celular:** Abra o app **Expo Go** e escaneie o QR Code exibido.
   - **No Navegador Web:** Pressione `w` no terminal.
