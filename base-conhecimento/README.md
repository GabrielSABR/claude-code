# Base de Conhecimento da Agência

Site estático de documentação interna construído com [MkDocs Material](https://squidfunk.github.io/mkdocs-material/).

## Estrutura

```
base-conhecimento/
├── mkdocs.yml           # Configuração do site
├── requirements.txt     # Dependências Python
├── vercel.json          # Configuração de deploy na Vercel
├── docs/                # Todo o conteúdo (markdown)
│   ├── index.md
│   ├── processos/       # SOPs internos
│   ├── clientes/        # Cases e histórico
│   ├── templates/       # Briefings, propostas, etc.
│   └── conhecimento/    # Conhecimento técnico
└── site/                # Build gerado (ignorado no git)
```

## Rodando localmente

Requisitos: Python 3.9+

```bash
cd base-conhecimento
pip install -r requirements.txt
mkdocs serve
```

Abra http://localhost:8000 — o site recarrega automaticamente ao editar arquivos.

## Adicionando conteúdo

1. Crie ou edite o arquivo `.md` dentro da pasta certa em `docs/`
2. Se for uma página nova, adicione a entrada na seção `nav:` do `mkdocs.yml`
3. Salve, commite e faça push — o deploy roda sozinho

### Exemplo: adicionando um novo SOP

```bash
# 1. Criar o arquivo
touch docs/processos/novo-processo.md

# 2. Editar o mkdocs.yml, seção nav, adicionar:
#    - Novo processo: processos/novo-processo.md

# 3. Ver localmente
mkdocs serve

# 4. Commitar
git add .
git commit -m "docs: adiciona SOP novo-processo"
git push
```

## Deploy

### Opção 1 — Vercel (recomendada)

1. Acesse [vercel.com](https://vercel.com) e conecte o repositório
2. Ao importar, configure:
    - **Root Directory**: `base-conhecimento`
    - **Framework Preset**: Other
    - As demais opções já estão no `vercel.json`
3. Clique em Deploy — pronto

A cada push na branch principal, a Vercel faz rebuild automaticamente.

### Opção 2 — GitHub Pages

```bash
cd base-conhecimento
mkdocs gh-deploy
```

Isso gera o site e dá push na branch `gh-pages`. Habilite GitHub Pages nessa branch nas settings do repo.

### Opção 3 — Qualquer hospedagem estática

```bash
mkdocs build
# Faz upload da pasta site/ para S3, Netlify, Cloudflare Pages, etc.
```

## Dicas de escrita

- **Seja direto**: a equipe não tem tempo de ler 3 páginas para achar uma info
- **Use listas e tabelas**: mais fáceis de escanear
- **Inclua exemplos reais**: o que diferencia documentação viva de documentação morta
- **Admonitions**: use blocos `!!! tip`, `!!! warning`, `!!! danger` para destacar avisos

Exemplo de admonition:

```markdown
!!! tip "Dica rápida"
    Aqui vai o conteúdo destacado.
```

## Manutenção

- **Responsável geral**: [definir]
- **Revisão trimestral**: olhar cada seção e marcar o que está desatualizado
- **Regra de ouro**: se algo mudou na operação, atualize a página **no mesmo dia**
