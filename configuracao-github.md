# Configuração GitHub + Claude Code
> Conversa do dia 19/03/2026

---

## 👤 Gabriel
"Quero acessar tudo do Claude Code em outro computador. Tenho Git instalado."

## 🤖 Claude
Para isso você precisa de duas coisas:
1. Instalar o Claude Code no outro PC
2. Sincronizar seus arquivos via GitHub

---

## 👤 Gabriel
"O que eu preciso fazer para deixar tudo conectado? Quero o passo a passo."

## 🤖 Claude
Antes de tudo, configure o Git com seus dados:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

Depois crie 2 repositórios no GitHub (privados, sem README):
- `claude-config` → para as configurações do Claude Code
- `meus-projetos` → para seus arquivos de trabalho

---

## 👤 Gabriel
"Meu usuário é GabrielSABR e meu email é gsa181204@gmail.com."
"Os dois repositórios foram criados."

## 🤖 Claude
Configurei o Git com seus dados e conectei as duas pastas ao GitHub:

| Repositório | Conteúdo |
|-------------|----------|
| `claude-config` | Memória e configurações do Claude Code |
| `meus-projetos` | Pasta Documentos completa |

---

## 👤 Gabriel
"Quero passar todos os novos arquivos daqui para frente em uma nova pasta chamada Claude Code."
"Vou criar ela em: C:\Users\alves\OneDrive\Documentos\Claude Code"
"Criei o repositório no GitHub."

## 🤖 Claude
Criei a pasta e conectei ao repositório `claude-code` no GitHub.

Para usar essa pasta no Claude Code, sempre navegue até ela antes de abrir:

```bash
cd "C:/Users/alves/OneDrive/Documentos/Claude Code"
claude
```

---

## 👤 Gabriel
"No meu outro computador não vou ter acesso a essa pasta. Como faço?"

## 🤖 Claude
No outro PC você clona o repositório do GitHub:

```bash
git clone https://github.com/GabrielSABR/claude-code.git "C:/Users/NOME-DO-PC/Documents/Claude Code"
```

O GitHub funciona como uma ponte entre os dois computadores.

---

## 👤 Gabriel
"Monte um passo a passo do que eu sempre tenho que fazer em ordem."

## 🤖 Claude

### Primeira vez no outro PC (só faz uma vez)
```bash
git config --global user.name "GabrielSABR"
git config --global user.email "gsa181204@gmail.com"
npm install -g @anthropic-ai/claude-code
git clone https://github.com/GabrielSABR/claude-code.git "C:/Users/NOME-DO-PC/Documents/Claude Code"
```

### Todo dia — Antes de começar
```bash
git pull
claude
```

### Todo dia — Ao terminar
```bash
git add .
git commit -m "descricao do que fiz hoje"
git push
```

---

## 👤 Gabriel
"O `git commit -m` eu preciso digitar tudo que fiz ou é só enviar assim mesmo?"

## 🤖 Claude
É só um resumo curto para você se lembrar depois. Exemplos:

```bash
git commit -m "criei campanha de trafego pago"
git commit -m "ajustei planilha de metricas"
git commit -m "atualizacoes do dia"   ← pode usar esse sempre
```
