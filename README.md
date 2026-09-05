# 🛍️ TrendLab - E-Commerce Mobile Acessível & Inclusivo

> **Desenvolvido por:** João Teixeira Duarte Neto  
> **Instituição:** Centro Universitário CESMAC  

---

## 📖 1. Sobre a Aplicação
O **TrendLab** é uma plataforma mobile de e-commerce de moda desenvolvida com foco em **Acessibilidade Digital (WCAG AAA)** e **Calm UI**. O projeto foi desenhado para eliminar barreiras de acesso e proporcionar autonomia para usuários com diferentes necessidades:
- **Baixa Visão, Miopia Severa e Astigmatismo:** Interface com tipografia de alto contraste, ampliação dinâmica de fontes e modo de super zoom para análise de tecidos.
- **TDAH e Dislexia:** Navegação objetiva em tópicos curtos (bullet points), ausência de anúncios distrativos e **Modo Foco** para redução de sobrecarga sensorial.
- **Daltonismo e Baixa Literacia Digital:** Identificação nominal explícita de cores, botões com alvos táteis ampliados e feedbacks com ícones universais associados a cores.

---

## 🎨 2. Paleta de Cores Oficial

| Cor | Código Hex | Aplicação na Interface | Relação de Contraste |
| :--- | :--- | :--- | :--- |
| **Deep Space Navy** | `#1E1B4B` | Cabeçalhos, Barra Inferior e Destaques | Contraste **16.5:1 (AAA)** |
| **Electric Iris** | `#4338CA` | Botões Principais de Ação (CTA) | Contraste **7.2:1 (AAA)** |
| **Warm Coral** | `#E0533C` | Badges de Foco e Destaques Importantes | Contraste **4.8:1 (AA)** |
| **Clean Canvas** | `#F8FAFC` | Fundo Principal das Telas (Anti-fadiga) | Descanso Visual |
| **High-Ink Slate** | `#0F172A` | Títulos, Textos Primários e Preços | Contraste **17.8:1 (AAA)** |
| **Charcoal Slate** | `#334155` | Legendas, Descrições e Subtítulos | Contraste **8.5:1 (AAA)** |
| **Success Emerald** | `#15803D` | Sucesso, Tamanho Ideal no Provador | Acessível com ícone **✓** |
| **Alert Crimson** | `#B91C1C` | Alertas e Erros de Preenchimento | Acessível com ícone **⚠️** |

---

## 📱 3. Estrutura e Telas do Aplicativo

### Fluxo de Autenticação
- **Login (`src/screens/Auth/LoginScreen.tsx`):** Acesso à plataforma com validação completa de e-mail (expressão regular) e senha mínima, além de atalhos rápidos de teste de personas.
- **Cadastro (`src/screens/Auth/RegisterScreen.tsx`):** Criação de conta com validação simultânea de nome completo, e-mail, senha e conferência de repetição de senha.

### Catálogo e Descoberta
- **Catálogo Inicial (`src/screens/Home/HomeScreen.tsx`):** Feed visual com filtro por categorias, busca instantânea e atalho de busca por voz acessível.

### Detalhes e Provador Virtual
- **Detalhes da Peça (`src/screens/ProductDetail/ProductDetailScreen.tsx`):** 
  - **Super Zoom:** Permite ampliar a imagem da peça para analisar a textura do tecido e costuras.
  - **Provador Virtual:** Recomendador de tamanho baseado em perfis anatômicos.
  - **Ficha em Tópicos:** Bullet points claros para rápida compreensão sem cansaço visual.
  - **Áudio Descrição:** Leitura do resumo da peça via sintetizador acessível.

### Sacola e Compra
- **Sacola & Checkout (`src/screens/Cart/CartScreen.tsx`):** Gerenciamento de itens, ajuste de quantidades e fluxo de finalização com validação de dados de destinatário, CEP e endereço.

### Ajustes do Sistema
- **Configurações (`src/screens/Profile/ProfileScreen.tsx`):** Painel de controle de acessibilidade com ajuste de escala de fonte em tempo real, alternador de Modo Foco e Alto Contraste AAA.

---

## 🏗️ 4. Arquitetura do Projeto

```
TrendLab/
├── App.tsx                     # Ponto de entrada com Providers
├── app.json                    # Configurações do Expo
├── eas.json                    # Canais de deploy do EAS
└── src/
    ├── components/             # Componentes modulares e reutilizáveis
    ├── context/                # Context API (Acessibilidade e Sacola)
    ├── data/                   # Base de dados de produtos inclusivos
    ├── navigation/             # Navegação Stack e Bottom Tabs
    ├── screens/                # Telas da aplicação
    ├── theme/                  # Paleta oficial de cores
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
