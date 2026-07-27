# Printer Tracker — Project README

Ferramenta pessoal para registrar, fotografar e acompanhar o estado técnico de impressoras usadas em estoque.

## Estrutura do projeto

```
appimpressoras/
├── backend/          # API Node.js + Express + SQLite
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

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Verificação de saúde |
| GET | `/api/printers?status=&q=` | Listar impressoras (filtros opcionais) |
| GET | `/api/printers/stats` | Contagens por status |
| POST | `/api/printers` | Criar impressora |
| GET | `/api/printers/:id` | Detalhes + fotos |
| PUT | `/api/printers/:id` | Atualizar campos |
| DELETE | `/api/printers/:id` | Excluir impressora |
| GET | `/api/printers/:id/logs` | Histórico de manutenção |
| POST | `/api/printers/:id/logs` | Adicionar entrada ao histórico (multipart) |
| DELETE | `/api/logs/:logId` | Remover entrada do histórico |
| POST | `/api/photos` | Upload de foto (multipart) |
| DELETE | `/api/photos/:id` | Remover foto |

### Dados
- Banco: `backend/printers.db` (criado automaticamente)
- Fotos: `backend/uploads/` (criado automaticamente)

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
   Abra o app → `+` → preencha marca/modelo → tire foto → selecione status → salve

2. **Do notebook:**  
   Acesse `http://localhost:3000/api/printers` ou use um cliente REST (Insomnia, Postman) para consultar/editar registros

3. **Manutenção concluída:**  
   Abra a impressora → aba "Histórico" → adicione entrada com descrição + foto → atualize o status para "In maintenance" ou "Ready for sale"

---

## Status disponíveis

| Status | Cor | Significado |
|--------|-----|-------------|
| Functional | 🟢 Verde | Funcionando, sem pendências |
| Needs maintenance | 🟡 Amarelo | Aguardando peça ou serviço |
| In maintenance | 🔵 Azul | Em processo de manutenção |
| Ready for sale | 🔵 Teal | Pronta para venda |
| Sold | ⚫ Cinza | Vendida |
