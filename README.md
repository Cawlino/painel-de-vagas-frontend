# 💼 Painel de Vagas - Automated Job Tracking Dashboard

![Painel de Vagas Preview](https://painel-de-vagas-frontend.vercel.app/og-image.png) *(Substitua por um screenshot real caso deseje)*

Um dashboard moderno e interativo desenvolvido para rastrear e gerenciar processos seletivos e candidaturas de emprego de forma 100% automatizada. O sistema lê dados em tempo real de uma planilha do Google Sheets (alimentada via Inteligência Artificial) e apresenta métricas dinâmicas para análise do fluxo de recrutamento.

## 🚀 Funcionalidades

- **Sincronização em Tempo Real:** Consome uma API serverless construída no Google Apps Script para espelhar os dados da planilha instantaneamente.
- **Métricas e KPIs Dinâmicos:** Contagem de aplicações totais, processos ativos (filtrando rejeições) e registro de última atualização.
- **Filtros e Ordenação Inteligente:** Filtre por vagas, empresas ou status. Ordene a tabela de forma ascendente ou descendente em qualquer coluna.
- **UI/UX Premium:** Design moderno utilizando *Glassmorphism*, gradientes, *dark mode* nativo e ícones interativos.
- **Totalmente Responsivo:** Layout adaptável para visualização perfeita em Desktop, Tablets e Mobile.
- **Ações Rápidas:** Redirecionamento direto para a página original da vaga ou para a thread do e-mail no Gmail.

## 🛠️ Tecnologias Utilizadas

**Front-end:**
- [React 18](https://reactjs.org/)
- [Vite](https://vitejs.dev/) (Build tool ultrarrápida)
- [Tailwind CSS v4](https://tailwindcss.com/) (Estilização utilitária)
- [Lucide React](https://lucide.dev/) (Iconografia moderna)

**Back-end & Banco de Dados:**
- [Google Apps Script](https://developers.google.com/apps-script) (RESTful API Serverless)
- Google Sheets (Database)

**DevOps & Hosting:**
- [Vercel](https://vercel.com/) (Deploy contínuo via GitHub)
- Git & GitHub (Controle de versão)

## 🏗️ Arquitetura do Sistema

1. **Agente IA (Gemini Spark):** Lê os e-mails recebidos, extrai o contexto da vaga e insere na planilha automaticamente.
2. **Google Apps Script (Backend):** Atua como uma API REST, capturando os dados da planilha, localizando o cabeçalho correto e expondo um endpoint em formato JSON.
3. **React App (Frontend):** Faz o fetch desse endpoint via Web API, mapeia as colunas dinamicamente, renderiza a interface e hospeda o filtro de dados no lado do cliente (client-side).

## 💻 Como rodar localmente

1. Clone o repositório:
```bash
git clone https://github.com/Cawlino/painel-de-vagas-frontend.git
```
2. Acesse a pasta do projeto:
```bash
cd painel-de-vagas-frontend
```
3. Instale as dependências:
```bash
npm install
```
4. Rode o servidor de desenvolvimento:
```bash
npm run dev
```

---

Desenvolvido para automatizar o processo de hunting e centralizar as oportunidades de carreira. 
Sinta-se livre para explorar o código fonte e as lógicas de consumo de API Serverless!
