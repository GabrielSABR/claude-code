# Configuração GitHub + Claude Code

## Repositórios criados
- `claude-config` → configurações e memória do Claude Code
- `meus-projetos` → pasta Documentos completa
- `claude-code` → projetos novos daqui para frente

## Dados do Git configurados
- Usuário: GabrielSABR
- Email: gsa181204@gmail.com

---

## Primeira vez no outro PC (só faz uma vez)

1. Instalar o Git: https://git-scm.com
2. Instalar o Node.js: https://nodejs.org
3. Abrir o CMD e rodar:

```bash
git config --global user.name "GabrielSABR"
git config --global user.email "gsa181204@gmail.com"
npm install -g @anthropic-ai/claude-code
git clone https://github.com/GabrielSABR/claude-code.git "C:/Users/NOME-DO-PC/Documents/Claude Code"
```

---

## Todo dia — Antes de começar a trabalhar

1. Abrir o CMD na pasta do projeto
2. Puxar as atualizações do GitHub:

```bash
git pull
```

3. Abrir o Claude Code:

```bash
claude
```

---

## Todo dia — Ao terminar de trabalhar

Salvar e enviar para o GitHub:

```bash
git add .
git commit -m "descricao do que fiz hoje"
git push
```

---

## Resumo visual

```
Antes de trabalhar        Durante          Ao terminar
     git pull      →    claude (trabalha)  →   git add .
                                               git commit -m "msg"
                                               git push
```

---

## Como abrir o terminal já na pasta certa

1. Abrir a pasta pelo Explorador de Arquivos
2. Clicar na barra de endereço
3. Digitar `cmd` e apertar Enter

---

## Observações
- O GitHub funciona como ponte entre os dois PCs
- A mensagem do commit é só um resumo curto do que foi feito
- Exemplo: `git commit -m "atualizacoes do dia"`
