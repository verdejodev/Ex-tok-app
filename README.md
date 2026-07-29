# Controle de Equipamentos de TI — Project README

Ferramenta pessoal para registrar, fotografar e acompanhar o estado técnico de equipamentos de TI usados em estoque (impressoras, computadores, notebooks, etiquetadoras, equipamentos de rede).

## Estrutura do projeto

```
appimpressoras/
├── backend/          # API Node.js + Express + SQLite (better-sqlite3)
└── mobile/           # App Expo React Native
```

---

## Backend (notebook)

### Pré-requisitos
- Node.js 18+

### Iniciar

```bash
cd backend
npm install       # só na primeira vez
npm run dev       # desenvolvimento (nodemon, reinicia automaticamente)
# ou
npm start         # produção
```

A API roda em `http://0.0.0.0:3000` — acessível pelo celular na mesma rede WiFi.

Uma página web (painel de controle) também é servida em `http://localhost:3000/` — útil para consultar, filtrar e editar equipamentos direto do notebook, com exportação para Excel.

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Verificação de saúde |
| GET | `/api/equipments?status=&type=&q=` | Listar equipamentos (filtros opcionais) |
| GET | `/api/equipments/stats` | Contagens por status |
| POST | `/api/equipments` | Criar equipamento |
| GET | `/api/equipments/:id` | Detalhes + fotos |
| PUT | `/api/equipments/:id` | Atualizar campos |
| DELETE | `/api/equipments/:id` | Excluir equipamento |
| GET | `/api/equipments/:id/logs` | Histórico de manutenção |
| POST | `/api/equipments/:id/logs` | Adicionar entrada ao histórico (multipart) |
| DELETE | `/api/logs/:logId` | Remover entrada do histórico |
| POST | `/api/photos` | Upload de foto (multipart) |
| DELETE | `/api/photos/:id` | Remover foto |

> As rotas `/api/printers/*` continuam funcionando como alias de compatibilidade para `/api/equipments/*`.

### Filtros da listagem
- `status` — filtra por status exato (ex: `Functional`, `Needs maintenance`)
- `type` — filtra por tipo (ex: `Printer`, `Computer`, `Notebook`, `Label Maker`, `Network`, `Other`)
- `q` — busca textual em marca, modelo, número de série, código interno e specs

### Campos do equipamento
- `type` — tipo do equipamento (padrão: `Printer`)
- `brand` (obrigatório), `model` (obrigatório)
- `serial_number` — número de série (opcional, se não visível)
- `internal_code` — código interno gerado automaticamente (ex: `EQP-001`)
- `status` — status atual (ver tabela abaixo)
- `page_count` — contador de páginas (entrada manual, lido do display/relatório)
- `part_needed` — peça necessária (texto livre: toner, fuser, rolo, cabeça de impressão, etc.)
- `location` — localização física (opcional, texto livre)
- `estimated_value` — valor estimado de venda (opcional)
- `notes` — notas técnicas em texto livre
- `specs` — especificações em texto livre (processador, RAM, armazenamento, etc.)

### Dados
- Banco: `backend/printers.db` (SQLite, criado automaticamente)
- Fotos: `backend/uploads/` (criado automaticamente)
- Migração automática: se existir banco antigo com tabela `printers`, é migrada para `equipments` na primeira inicialização.

### Painel web
Acesse `http://localhost:3000/` no navegador do notebook. Funcionalidades:
- Lista de equipamentos com busca e filtros por status/tipo
- Cards de estatísticas por status
- Detalhes do equipamento com galeria de fotos e histórico de manutenção
- Exportação para Excel (.xlsx) na listagem e no detalhe

---

## App Mobile (celular Android)

### Pré-requisitos
- App **Expo Go** instalado no celular ([Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Celular e notebook na mesma rede WiFi

### Iniciar

```bash
cd mobile
npm install       # só na primeira vez
npx expo start    # exibe QR code no terminal
```

Escaneie o QR code com o Expo Go no celular.

### Configuração inicial no app
1. Toque em ⚙️ (canto inferior esquerdo da tela principal)
2. Digite o IP do notebook (ex: `192.168.1.42`)
3. Toque em **Testar conexão** — deve aparecer ✅
4. Salve e volte para a tela principal

Para saber o IP do notebook:
```bash
ip addr show | grep 'inet ' | grep -v 127.0.0.1
```

---

## Fluxo de uso típico

1. **Durante o levantamento físico:**  
   Abra o app → `+` → preencha tipo/marca/modelo → tire foto → informe page count → selecione status → marque part_needed se aplicável → salve

2. **Do notebook:**  
   Acesse `http://localhost:3000/` no navegador, ou use um cliente REST (Insomnia, Postman) para consultar/editar registros via `/api/equipments`

3. **Manutenção concluída:**  
   Abra o equipamento → aba "Histórico" → adicione entrada com descrição + foto → atualize o status para "In maintenance" ou "Ready for sale"

---

## Status disponíveis

| Status | Cor | Significado |
|--------|-----|-------------|
| Functional | 🟢 Verde | Funcionando, sem pendências |
| Needs maintenance | 🟠 Laranja | Aguardando peça ou serviço |
| In maintenance | 🔵 Azul | Em processo de manutenção |
| Ready for sale | 🟣 Roxo | Pronta para venda |
| Sold | ⚫ Cinza | Vendida |

---

## Tipos de equipamento

| Tipo | Descrição |
|------|-----------|
| Printer | Impressora |
| Computer | Computador desktop |
| Notebook | Notebook |
| Label Maker | Etiquetadora |
| Network | Equipamento de rede |
| Other | Outro |
