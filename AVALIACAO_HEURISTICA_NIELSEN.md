# 📋 Avaliação Heurística de Usabilidade & Matriz de Iteração UX/UI
## Projeto: TrendLab — E-Commerce Mobile Acessível & Inclusivo

> **Autor:** João Teixeira Duarte Neto  
> **Instituição:** Centro Universitário CESMAC  
> **Disciplina:** Tecnologias para Web / Programação Mobile  
> **Metodologia:** Inspeção Heurística baseada nas 10 Heurísticas de Jakob Nielsen (1994) e Diretrizes de Acessibilidade WCAG 2.0 / 2.1  
> **Data:** Outubro de 2026  

---

## 1. Contexto e Objetivos da Inspeção

O **TrendLab** é uma aplicação mobile de comércio eletrônico desenvolvida em React Native e Expo com foco prioritário em **Acessibilidade Digital** e **Calm UI**. O projeto foi concebido para atender usuários com diversidade funcional, representados por duas personas de design centrais:
- **Teresa Tavares (52 anos):** Consumidora com baixa visão, miopia severa e astigmatismo, necessitando de fontes ampliadas, alvos de toque generosos e alto contraste visual.
- **Gabriel Gomes (20 anos):** Estudante com TDAH e dislexia, demandando interfaces limpas, redução de sobrecarga sensorial (Modo Foco), textos escaneáveis em tópicos e feedback operacional imediato.

Esta avaliação documental tem por objetivo identificar falhas de usabilidade e atritos de interação no protótipo funcional, mensurar a severidade de cada violação segundo o padrão Nielsen Norman Group e documentar as correções técnicas aplicadas na **Matriz de Iteração**.

---

## 2. Escala de Severidade de Problemas (Nielsen, 1995)

Para priorização dos problemas encontrados, utilizou-se a escala clássica de severidade:

| Grau | Nível de Severidade | Impacto no Usuário |
| :---: | :--- | :--- |
| **0** | **Falso Positivo** | Não afeta a conclusão da tarefa nem causa confusão perceptível. |
| **1** | **Cosmético** | Problema superficial que não impede a tarefa. Deve ser resolvido se houver tempo. |
| **2** | **Menor (Leve)** | Causa pequeno atraso ou frustração leve, mas o usuário recupera-se facilmente. |
| **3** | **Maior (Grave)** | Dificulta substancialmente a tarefa, gera perda de tempo ou confusão. Alta prioridade. |
| **4** | **Catastrófico** | Impede totalmente a conclusão da tarefa (beco sem saída, crash ou perda de dados). Bloqueante. |

---

## 3. Avaliação Detalhada segundo as 10 Leis de Nielsen

### H1. Visibilidade do Status do Sistema
> *O sistema deve sempre manter os usuários informados sobre o que está acontecendo, por meio de feedback apropriado e em tempo razoável.*

- **Inspeção Inicial:**
  - O botão "Finalizar Compra Segura" realizava a transição instantânea sem apresentar indicador de carregamento (`ActivityIndicator`), gerando dúvida momentânea no usuário sobre a aceitação do clique.
  - Ao errar credenciais de login no ambiente Web (`react-native-web`), o método `Alert.alert` nativo do mobile não disparava alerta algum, deixando a interface estática com os campos em verde e sem justificativa da recusa de acesso.
- **Severidade:** **Grau 3 (Maior)**.
- **Resolução:** 
  - Implementado feedback de carregamento dinâmico (`isFinishing`) com alteração textual para *"Processando Pedido..."* e `ActivityIndicator` no `CustomButton`.
  - Criado banner visual inline de alerta com `AlertTriangle` e cor `Alert Crimson (#B91C1C)` sobre fundo avermelhado suave (`#FEF2F2`) com atributo acessível `accessibilityRole="alert"`.

---

### H2. Correspondência entre o Sistema e o Mundo Real
> *O sistema deve falar a linguagem do usuário, com palavras, frases e conceitos familiares, e seguir as convenções do mundo real.*

- **Inspeção Inicial:**
  - As peças de vestuário contam com descrição tátil de tecidos (ex: *"98% Algodão Premium, 2% Elastano"*), seleção de cores nominais explícitas (ex: *"Preto Profundo"*, *"Azul Denim Escuro"*) com amostra visual cromática e recomendação do provador virtual em tamanhos convencionais (P, M, G, GG).
- **Severidade:** **Grau 0 (Atendido)**.
- **Conformidade:** Excelente aderência ao modelo mental de compras de moda.

---

### H3. Controle e Liberdade do Usuário
> *Usuários frequentemente escolhem funções por engano e precisam de uma "saída de emergência" claramente marcada para cancelar a ação.*

- **Inspeção Inicial:**
  - Ao acionar o botão *"Comprar Agora (1 Clique)"* na tela de detalhes do produto, o usuário era direcionado para a rota `Checkout` na stack raiz. Nesta tela, a barra inferior de abas era oculta e **não existia botão de voltar**, criando um beco sem saída onde o usuário não conseguia retornar à vitrine caso desistisse da compra imediata.
  - Na tela de sacola vazia quando acessada via `Checkout`, o botão *"Ver Produtos da Loja"* invocava `navigate('HomeTab')`, que não pertencia ao navegador ativo, resultando em erro silencioso no console e mantendo o usuário preso na tela vazia.
- **Severidade:** **Grau 4 (Catastrófico)**.
- **Resolução:**
  - Adicionado botão de retorno com ícone e texto (`← Voltar`) no topo do `CartScreen`, condicionado a `navigation.canGoBack()`.
  - Refatorada a navegação de retorno à loja no CTA da sacola vazia (`handleGoToCatalog`), despachando navegação resiliente para `MainTabs > HomeTab > HomeScreen`.

---

### H4. Consistência e Padrões
> *Os usuários não devem ter que adivinhar se palavras, situações ou ações diferentes significam a mesma coisa.*

- **Inspeção Inicial:**
  - Os botões utilizavam `TouchableOpacity` simples com opacidade estática, sem feedback tátil de escala ou anel de foco em navegação assistiva.
  - A paleta de cores centralizava tokens de cores (`colors.ts`), porém os espaçamentos e raios estavam declarados como literais arbitrários no código.
- **Severidade:** **Grau 2 (Menor)**.
- **Resolução:**
  - Migrado `CustomButton` para a API `Pressable`, padronizando estados **Default**, **Pressed** (`transform: scale(0.985)` + escurecimento) e **Focus** (`borderColor: Colors.focusRing`).
  - Criado arquivo de tokens formais `src/theme/spacing.ts` com grade padronizada de 4pt (`Spacing`) e raios de borda (`Radius`).

---

### H5. Prevenção de Erros
> *Melhor do que boas mensagens de erro é um design cuidadoso que evita que os problemas ocorram.*

- **Inspeção Inicial:**
  - O sistema aplica máscaras automáticas no campo de CEP (`XXXXX-XXX`) e formatação em tempo real. No entanto, os alvos de clique dos controles de incremento/decremento de quantidade (`+` e `-`) e o botão de exclusão de item na sacola possuíam dimensões de toque reduzidas (~36x24px e ~30x30px), propiciando cliques acidentais em dispositivos de tela compacta.
- **Severidade:** **Grau 3 (Maior)**.
- **Resolução:**
  - Reestruturados todos os alvos de toque para garantir o mínimo estrito de **44x44px** (recomendação WCAG 2.5.5 / Apple HIG), incluindo `qtyButton`, `deleteButton`, `clearSearch`, `clearFilterButton`, `backButton` e botão de visibilidade de senha (`eyeButton`).

---

### H6. Reconhecimento em vez de Memorização
> *Minimize a carga de memória do usuário tornando objetos, ações e opções visíveis.*

- **Inspeção Inicial:**
  - O aplicativo adota identificadores visuais persistentes: badge numérico de itens pendentes na aba Sacola (`tabBarBadge`), indicação de tamanho sugerido pelo Provador Virtual com estrela destacada (★), e rótulos explícitos com indicador de obrigatoriedade (`*`) visíveis o tempo todo em todos os campos de formulário.
- **Severidade:** **Grau 0 (Atendido)**.
- **Conformidade:** Padrão plenamente cumprido.

---

### H7. Flexibilidade e Eficiência de Uso
> *Atalhos e aceleradores de uso devem permitir que usuários experientes naveguem com agilidade.*

- **Inspeção Inicial:**
  - Disponibilização do botão *"Comprar Agora (1 Clique)"* para pular etapas de adição e seguir direto ao fechamento.
  - Atalho de simulação de busca por voz com termos pré-definidos para usuários com dificuldade motora ou digitação lenta.
- **Severidade:** **Grau 0 (Atendido)**.
- **Conformidade:** Boa eficiência de fluxos para diferentes perfis.

---

### H8. Estética e Design Minimalista (Calm UI)
> *Os diálogos não devem conter informações irrelevantes ou raramente necessárias.*

- **Inspeção Inicial:**
  - Implementação do **Modo Foco (Calm UI)** que oculta banners promocionais, tags de desconto e elementos cintilantes a fim de evitar dispersão e fadiga mental de usuários neurodivergentes (TDAH).
  - A relação de contraste da cor de destaque **Warm Coral** (`#E0533C`) sobre fundos claros era de apenas 3.84:1, violando o mínimo exigido de 4.5:1 para textos pequenos em conformidade WCAG AA.
- **Severidade:** **Grau 3 (Maior)**.
- **Resolução:**
  - Cor Warm Coral calibrada de `#E0533C` para `#C43D27`, elevando o contraste medido para **5.19:1 (sobre branco)** e **4.96:1 (sobre Clean Canvas)**, superando com folga o limiar mínimo de 4.5:1 da WCAG 2.0 (Critério 1.4.3).

---

### H9. Ajudar Usuários a Reconhecer, Diagnosticar e Recuperar-se de Erros
> *Mensagens de erro devem ser expressas em linguagem clara, sem códigos, indicar precisamente o problema e sugerir uma solução construtiva.*

- **Inspeção Inicial:**
  - Validação síncrona com Formik + Yup no Login e Cadastro, exibindo alertas visuais em vermelho com emoji/ícone e texto construtivo (ex: *"A senha precisa ter pelo menos 6 caracteres"*).
  - No Checkout, validação de campos obrigatórios com mensagens precisas sob cada input.
  - Correção aplicada: inclusão do feedback inline de falha de credenciais no login para cobrir plataformas web onde o modal nativo não respondia.
- **Severidade:** **Grau 2 (Menor)**.
- **Resolução:** Alertas visuais unificados com suporte a leitores de tela (`accessibilityLiveRegion="assertive"`).

---

### H10. Ajuda e Documentação
> *Mesmo que seja melhor se o sistema puder ser usado sem documentação, pode ser necessário fornecer ajuda e documentação.*

- **Inspeção Inicial:**
  - Cada campo de formulário possui `helperText` contextual (ex: *"Usaremos seu e-mail para confirmação dos pedidos"*).
  - O provador virtual contextualiza de forma didática o porquê do tamanho recomendado.
- **Severidade:** **Grau 0 (Atendido)**.
- **Conformidade:** Textos de apoio claros e objetivos.

---

## 4. Matriz de Iteração UX/UI (Antes × Depois)

A tabela abaixo sintetiza o ciclo completo de auditoria, diagnóstico de usabilidade e refatoração técnica aplicada no repositório:

| ID | Heurística Violada | Problema Identificado no Protótipo Inicial | Severidade Inicial | Correção de UX/UI Aplicada | Arquivos Modificados | Estado Pós-Iteração |
| :---: | :--- | :--- | :---: | :--- | :--- | :---: |
| **IT-01** | **H1: Status do Sistema** | Login com credenciais incorretas não apresentava feedback na Web (`Alert.alert` mudo). | **Grau 3** | Implementado banner inline com `AlertTriangle` em `Alert Crimson (#B91C1C)` e fundo `#FEF2F2`. | `src/screens/Auth/LoginScreen.tsx` | ✅ **Resolvido** (Feedback imediato e acessível) |
| **IT-02** | **H1: Status do Sistema** | Botão "Finalizar Compra" concluía a ação sem feedback de carregamento. | **Grau 2** | Adicionado estado `isFinishing` com spinner `ActivityIndicator` e texto *"Processando Pedido..."*. | `src/screens/Cart/CartScreen.tsx` | ✅ **Resolvido** (Status operacional claro) |
| **IT-03** | **H3: Controle do Usuário** | Rota `Checkout` acionada por "Comprar Agora" não possuía botão de retorno (beco sem saída). | **Grau 4** | Adicionado botão `topBackButton` com ícone `ArrowLeft` condicionado a `navigation.canGoBack()`. | `src/screens/Cart/CartScreen.tsx` | ✅ **Resolvido** (Liberdade total de navegação) |
| **IT-04** | **H3: Controle do Usuário** | Botão "Ver Produtos da Loja" na sacola vazia disparava erro de rota não registrada (`HomeTab`). | **Grau 4** | Implementada função `handleGoToCatalog` com fallback seguro para `MainTabs > HomeTab > HomeScreen`. | `src/screens/Cart/CartScreen.tsx` | ✅ **Resolvido** (Navegação funcional sem erros) |
| **IT-05** | **H5: Prevenção de Erros** | Botões de quantidade (`+` e `-`), lixeira e olho de senha com alvos < 36px, causando toques acidentais. | **Grau 3** | Redimensionados todos os controles interativos para o alvo mínimo de **44x44px** (WCAG 2.5.5). | `CustomInput.tsx`, `CartScreen.tsx`, `HomeScreen.tsx`, `ProductDetailScreen.tsx` | ✅ **Resolvido** (Toque confortável e seguro) |
| **IT-06** | **H4: Consistência** | Botões não possuíam estado de foco visual para acessibilidade por teclado/Switch Control e toque háptico fraco. | **Grau 2** | Migração para `Pressable` com estados **Pressed** (escala/escurecimento) e **Focus** (anel com alto contraste). | `src/components/CustomButton.tsx` | ✅ **Resolvido** (Conformidade WCAG 2.4.7) |
| **IT-07** | **H8: Estética e Minimalismo** | Cor Warm Coral (`#E0533C`) apresentava contraste de 3.84:1, reprovando no critério de 4.5:1. | **Grau 3** | Calibração cromática para `#C43D27`, atingindo **5.19:1** sobre branco e **4.96:1** sobre Clean Canvas. | `src/theme/colors.ts`, `README.md` | ✅ **Resolvido** (Aprovado em WCAG AA) |
| **IT-08** | **H4: Consistência** | Falta de tokens estruturados de espaçamento e ritmo vertical. | **Grau 1** | Criação do arquivo `src/theme/spacing.ts` baseado em grid de 4pt e constantes de área de toque. | `src/theme/spacing.ts` | ✅ **Resolvido** (Design System padronizado) |

---

## 5. Resumo de Conformidade com a Rubrica da Disciplina

1. **Telas & Navegabilidade (Peso 30%):**
   - 8 telas e fluxos interativos completos (Login, Registro, Home/Catálogo, Detalhes, Provador Virtual, Sacola Etapa 1, Checkout Etapa 2, Pedido Sucesso e Configurações).
   - Ausência comprovada de becos sem saída após a introdução de rotas resilientes e botão de retorno no Checkout.
   - Todos os 4 estados essenciais (carregando, sucesso, erro e tela vazia) plenamente contemplados e sinalizados.

2. **Design System & Acessibilidade WCAG 2.0 (Peso 20%):**
   - Mini Design System com paleta contrastada validada numericamente (todos acima de 4.5:1 no nível AA e a maioria acima de 7:1 no nível AAA).
   - Componentes padronizados com área de toque mínima de **44x44px** garantida em todos os seletores e botões.
   - Formulários com rótulos semânticos visíveis, obrigatoriedade expressa e textos de ajuda.

3. **Avaliação Heurística & Matriz de Iteração (Peso 25%):**
   - Diagnóstico rigoroso das 10 leis de Nielsen com classificação de severidade (0 a 4).
   - Matriz de Iteração documentando 8 intervenções de melhoria de UX/UI aplicadas diretamente no código-fonte final.

4. **Arquitetura da Informação (Peso 15%):**
   - Hierarquia rasa estruturada em 3 abas inferiores com ícones acessíveis e rótulos explícitos.
   - Checkout progressivo dividido em 2 passos claros com barra de progresso visual.
