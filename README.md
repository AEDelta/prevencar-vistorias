# Prevencar Vistorias

Sistema eletrônico para substituir totalmente as fichas de papel por um sistema que registre vistorias, controle informações financeiras e gerencie funcionários. Ele permitirá cadastrar, consultar, alterar e excluir fichas de forma organizada. Todo o sistema poderá ser acessado tanto pelo site quanto pelo aplicativo.

## Tecnologias Utilizadas

- **Frontend:** React com TypeScript
- **Build Tool:** Vite
- **Backend:** Firebase (Firestore, Authentication)
- **Bibliotecas:** html2canvas, jspdf, xlsx, lucide-react

## Como Executar Localmente

**Pré-requisitos:** Node.js

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente:  
   Copie `.env.example` para `.env.local` e configure as chaves necessárias (Firebase, etc.)

3. Execute a aplicação:
   ```bash
   npm run dev
   ```

## Funcionalidades

- Cadastro e gerenciamento de vistorias
- Controle financeiro
- Gerenciamento de funcionários
- Exportação de relatórios (PDF, Excel)
- Interface responsiva para web e mobile
