# 🛍️ TrendLab - E-Commerce Mobile Acessível & Inclusivo

> **Desenvolvido por:** João Teixeira Duarte Neto  
> **Instituição:** Centro Universitário CESMAC  
> **Disciplinas:** Desenvolvimento Mobile & UI/UX  

---

## 📖 1. Sobre a Aplicação
O **TrendLab** é uma plataforma mobile completa de e-commerce de moda desenvolvida com foco em **Acessibilidade Digital (WCAG AAA)**, **Calm UI** e integração **Full-Stack REST + SQLite + JWT**. O projeto foi desenhado para eliminar barreiras sensoriais, visuais e motoras:
- **Baixa Visão, Miopia Severa e Fotofobia:** Interface com **Modo Escuro (`darkMode`)**, **Alto Contraste WCAG AAA (`highContrast`)**, ampliação dinâmica de fontes (`1.0x` a `1.6x`), descrições ampliadas em `+2px` sem emojis (leitura limpa para TalkBack/VoiceOver), sintetizador de voz nativo (`expo-speech`) e **Super Zoom com Lupa Móvel Interativa (`2.6x`)** para inspeção de costuras e tramas do tecido.
- **TDAH, TEA e Dislexia:** Navegação objetiva em tópicos curtos (*bullet points*), ausência de anúncios ou elementos piscantes e **Modo Foco Cognitivo (`focusMode`)** para redução de sobrecarga visual.
- **Acessibilidade Motora e Daltonismo:** Identificação nominal explícita de cores, preenchimento automático de endereço via **GPS (`expo-location`)**, botões direcionais para mover a lupa do Super Zoom com toques simples, alvos táteis ampliados (mínimo `48px` a `56px`) e feedbacks não bloqueantes via **Toast** (`AccessibleToast`).

---

## 🎨 2. Sistema de Paletas Visuais (4 Temas Dinâmicos)

O aplicativo conta com um motor dinâmico de temas (`src/theme/colors.ts` e `src/context/AccessibilityContext.tsx`) que combina **Modo Claro**, **Modo Escuro** e **Alto Contraste WCAG AAA**:

| Cor / Token | Código Hex | Aplicação na Interface | Relação de Contraste |
| :--- | :--- | :--- | :--- |
| **Deep Space Navy** | `#1E1B4B` | Cabeçalhos, Barra Inferior e Destaques | Contraste **16.5:1 (AAA)** |
| **Electric Iris** | `#4338CA` | Botões Principais de Ação (CTA) | Contraste **7.2:1 (AAA)** |
| **High-Visibility Yellow** | `#FACC15` | Destaques, Bordas e CTAs em Alto Contraste Escuro | Contraste **13.4:1 c/ Preto (AAA)** |
| **Warm Coral** | `#C43D27` | Badges de Promoção e Alertas de Sacola | Contraste **5.2:1 (AA)** |
| **Clean Canvas / Dark Slate** | `#F8FAFC` / `#0F172A` | Fundo Principal (Modo Claro / Modo Escuro) | Descanso Visual Anti-fadiga |
| **High-Ink Slate** | `#0F172A` | Títulos, Textos Primários e Preços | Contraste **17.8:1 (AAA)** |
| **Success Emerald** | `#15803D` | Sucesso, Tamanho Ideal no Provador | Acessível com ícone **✓** |
| **Alert Crimson** | `#B91C1C` | Alertas e Erros de Preenchimento | Acessível com ícone **⚠️** |

---

## 📱 3. Estrutura, Telas e Recursos Nativos Implementados

### Barra Superior Global de Acessibilidade (`src/components/AccessibilityBar.tsx`)
Presente no topo das telas principais, permitindo ajustar a qualquer momento:
- **Escala de Fonte em Tempo Real (`A-` / `A+`)** de `100%` até `160%`.
- **Modo Escuro (`darkMode`):** Alternância rápida entre tema claro e escuro (ícones Lua/Sol).
- **Alto Contraste (`highContrast`):** Reforça bordas (`2.5px`), pesos tipográficos, ícones e contraste absoluto (Preto/Branco/Amarelo `#FACC15`).
- **Modo Foco (`focusMode`):** Oculta badges secundários e simplifica os cards para foco na decisão de compra.

### Fluxo de Autenticação + JWT (`POST /api/auth/local`)
- **Login (`src/screens/Auth/LoginScreen.tsx`):** Validação com Formik + Yup, autenticação no Back-end SQL com retorno de **Token JWT** e sincronização global na store **Zustand** (`useUsuarioStore`).
- **Cadastro (`src/screens/Auth/RegisterScreen.tsx`):** Criação de conta persistida na tabela SQL `users` (`POST /api/auth/local/register`) com login automático.

### Catálogo e Descoberta (`FlatList`)
- **Catálogo Inicial (`src/screens/Home/HomeScreen.tsx`):**
  - **Listagem Virtualizada (`FlatList`):** Renderização otimizada do catálogo principal e da lista horizontal de categorias, com suporte a *Pull-to-Refresh* (`onRefresh`) conectado ao `GET /api/produtos`.
  - **Filtros Combinados e Modais (`Modal`):** Filtro por categoria, tamanho e ordenação de preço (`Menor Preço` / `Maior Preço`), além de busca por texto e simulação de busca por voz.
  - **Descrições Acessíveis (`+2px` sem emojis):** Textos de composição do tecido higienizados sem emojis e com fonte ampliada para leitura fluida em leitores de tela.

### Detalhes da Peça, Voz Nativa e Super Zoom com Lupa Móvel
- **Detalhes do Produto (`src/screens/ProductDetail/ProductDetailScreen.tsx`):**
  - **Super Zoom com Lupa Móvel (`2.6x`):** Lupa circular interativa que o usuário pode arrastar com o dedo ou mouse sobre qualquer parte da roupa para inspecionar a textura do tecido e o acabamento das costuras, acompanhada de botões direcionais (`← Esq`, `↑ Cima`, `↓ Baixo`, `Dir →`).
  - **Audiodescrição Completa (`expo-speech`):** Leitura em voz alta em português (`pt-BR`) do nome, categoria, preço, tamanho recomendado pelo provador, composição do tecido e diferenciais de acessibilidade.
  - **Descrições Ampliadas (`+2px`):** Textos de tecido e lista de diferenciais sem emojis e com tipografia ampliada.

### Provador Virtual Interativo
- **Provador Virtual (`src/screens/FittingRoom/FittingRoomScreen.tsx`):**
  - **Calculadora Anatômica (Zustand):** Calcula automaticamente o tamanho ideal em letras (`P` a `XG`) e numérico (`38` a `46`) com base em altura, peso e preferência de caimento (`justo`, `regular` ou `solto`), destacando o tamanho recomendado em todas as peças do catálogo.

### Sacola, Localização GPS e Checkout Integrado ao Banco SQL
- **Sacola & Checkout (`src/screens/Cart/CartScreen.tsx`):**
  - **Preenchimento de Endereço via GPS (`expo-location`):** Obtém as coordenadas de satélite (`getCurrentPositionAsync`) e realiza geocodificação reversa (`reverseGeocodeAsync`) para preencher automaticamente rua, número, bairro, cidade, UF e CEP.
  - **Registro de Pedido no Banco SQL (`POST /api/pedidos`):** Ao finalizar a compra (Pix, Cartão ou Boleto), o pedido é gravado na tabela SQL `pedidos` autenticado com o cabeçalho `Authorization: Bearer <jwt>`.
- **Pedido Confirmado (`src/screens/Cart/OrderSuccessScreen.tsx`):** Tela de recibo com resumo da compra.

### Minha Conta e Gestão de Pedidos
- **Minha Conta (`src/screens/Profile/ProfileScreen.tsx`):**
  - **Foto de Perfil com Câmera / Galeria (`expo-image-picker`):** Captura foto pela câmera nativa (`launchCameraAsync`) ou seleciona da galeria (`launchImageLibraryAsync`) com conversão Base64 e persistência global no perfil.
  - **Histórico e Cancelamento de Pedidos (`GET` e `DELETE /api/pedidos/:id`):** Consulta de pedidos realizados exclusivamente pelo usuário autenticado, com modal de detalhes e botão para cancelar/excluir o pedido diretamente no banco SQLite.

---

## 🗄️ 4. Back-end RESTful (Padrão Strapi) + Banco de Dados SQL (SQLite)

O projeto inclui um servidor Node.js na porta `1337` (`backend/server.js`) conectado ao banco de dados relacional SQL **`backend/trendlab.sqlite`** (definido em `backend/schema.sql`):

| Método | Rota HTTP | Query SQL Executada no SQLite | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/status` | `SELECT COUNT(*) FROM users, produtos, pedidos` | Verifica status do servidor e total de registros |
| `POST` | `/api/auth/local` | `SELECT id, username, email, password_hash FROM users ...` | Autentica usuário e retorna `{ jwt, user }` |
| `POST` | `/api/auth/local/register` | `INSERT INTO users (username, email, password_hash) VALUES (...)` | Cadastra novo usuário no banco SQL e retorna `{ jwt, user }` |
| `GET` | `/api/produtos` | `SELECT * FROM produtos WHERE category = ? ORDER BY id ASC` | Lista catálogo completo ou filtrado por categoria |
| `GET` | `/api/pedidos` | `SELECT * FROM pedidos WHERE user_email = ?` | Lista histórico de compras do usuário logado (`[JWT]`) |
| `POST` | `/api/pedidos` | `INSERT INTO pedidos (...) VALUES (...)` | Grava novo pedido finalizado na Sacola (`[JWT]`) |
| `PUT` | `/api/pedidos/:id` | `UPDATE pedidos SET address = ?, payment_method = ? WHERE id = ?` | Atualiza dados de um pedido existente (`[JWT]`) |
| `DELETE` | `/api/pedidos/:id` | `DELETE FROM pedidos WHERE id = ?` | Cancela e remove um pedido do banco SQL (`[JWT]`) |

---

## 🏗️ 5. Arquitetura de Pastas do Projeto

```text
TrendLab/
├── App.tsx                         # Ponto de entrada, Moldura Mobile Web (412x892) e AccessibleToast
├── app.json                        # Configurações do Expo SDK 57, permissões nativas e runtimeVersion
├── eas.json                        # Perfis de publicação OTA (EAS Update)
├── backend/
│   ├── schema.sql                  # Script DDL SQL (CREATE TABLE users, produtos, pedidos e INDEX)
│   ├── trendlab.sqlite             # Banco de dados relacional SQLite persistente
│   ├── server.js                   # Servidor WebService REST (porta 1337) + JWT + Logger HTTP/SQL
│   └── db.json                     # Carga inicial (seed) de produtos e pedidos
└── src/
    ├── components/                 # AccessibilityBar, AccessibleText, AccessibleToast, ProductCard, CustomButton, CustomInput
    ├── context/                    # Contextos de Acessibilidade (4 temas), Autenticação e Sacola
    ├── data/                       # Catálogo base de fallback (mockProducts.ts)
    ├── navigation/                 # Navegação híbrida: AppNavigator (Stack), TabNavigator (CustomTabBar) e HomeStackNavigator
    ├── screens/                    # 7 Telas completas (Login, Register, Home, ProductDetail, FittingRoom, Cart, OrderSuccess, Profile)
    ├── services/                   # Cliente HTTP REST (api.ts) com detecção automática de IP LAN no mobile
    ├── store/                      # Gerenciamento de Estado Global com Zustand (usuario-store.ts, useToastStore.ts)
    ├── theme/                      # Paletas de cores WCAG AAA (colors.ts) e espaçamentos (spacing.ts)
    └── types/                      # Interfaces TypeScript do domínio
```

---

## 🚀 6. Como Executar o Projeto (Front-end + Back-end SQL)

### 1. Iniciar o Servidor Back-end SQL (Terminal 1)
Use o Node.js 24. O servidor local carrega `JWT_SECRET` de `backend/.env`, que fica fora do Git. No PowerShell, execute os comandos abaixo na raiz do projeto. A chave é criada uma vez e reutilizada nos próximos reinícios.

```powershell
if (-not (Test-Path backend/.env)) {
  node -e "const fs = require('node:fs'); fs.writeFileSync('backend/.env', 'JWT_SECRET=' + require('node:crypto').randomBytes(32).toString('hex') + String.fromCharCode(10), { flag: 'wx' })"
}
npm run backend
```

Uma variável `JWT_SECRET` definida no ambiente do servidor tem preferência sobre o arquivo local. Trocar a chave invalida os tokens em circulação.

O servidor iniciará em `http://localhost:1337/api` conectado ao banco `backend/trendlab.sqlite` e registrará as requisições HTTP e as consultas SQL selecionadas.

### 2. Iniciar o Aplicativo no Expo (Terminal 2)
Em outro terminal na pasta raiz do projeto, execute:
```bash
npx expo start
```
- **No Celular (Expo Go):** Escaneie o QR Code exibido no terminal (o app detectará automaticamente o IP da sua máquina na rede Wi-Fi para conversar com o Back-end na porta `1337`).
- **No Navegador Web:** Pressione `w` no terminal (o app será exibido dentro de uma moldura interativa de smartphone de `412x892` centralizada na tela).

### Autenticação para avaliação
Crie uma conta pela tela de cadastro com a API em execução.

O login depende da API. O servidor guarda hashes scrypt com salt aleatório e emite JWTs válidos por uma hora. O app mantém a sessão em memória e pede login novamente ao ser reaberto.

O back-end migra as senhas legadas ao iniciar e desativa as contas de demonstração que usavam credenciais publicadas. Troque qualquer outra senha que já tenha passado por versões antigas do SQLite no Git.

## 7. Implantar a API e gerar o APK de avaliação

1. No painel do Render, crie um Blueprint a partir da branch do GitHub que contém `render.yaml`. O Blueprint configura o serviço em um plano pago com disco persistente, gera uma `JWT_SECRET` exclusiva para a hospedagem e inicializa um novo SQLite em `/var/data/trendlab.sqlite`.
2. Abra `/api/status` na URL HTTPS atribuída pelo Render e confirme que a resposta informa `online`.
3. Entre no Expo com uma conta que tenha acesso ao projeto TrendLab. No ambiente EAS `preview`, configure a variável pública `EXPO_PUBLIC_API_URL` com a URL HTTPS atribuída pelo Render, incluindo o sufixo `/api`. A chave de assinatura fica no servidor.
4. Na pasta do projeto, gere o APK com `npx eas-cli@latest build --platform android --profile preview`. Baixe o APK pela página do build e valide cadastro, login e um pedido pelo Android.
