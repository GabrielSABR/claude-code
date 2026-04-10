# Base de Conhecimento da Agência

Site estático de documentação interna construído com [MkDocs Material](https://squidfunk.github.io/mkdocs-material/).

**Status atual**: esqueleto pronto, conteúdo a ser preenchido pela equipe.

## Estrutura

```
base-conhecimento/
├── mkdocs.yml           # Configuração do site e navegação
├── requirements.txt     # Dependências Python
├── vercel.json          # Configuração de deploy na Vercel
├── docs/
│   ├── index.md
│   ├── servicos/              # Como cada serviço é entregue
│   │   ├── site-landing-page.md
│   │   ├── google-business-profile.md
│   │   ├── trafego-pago/
│   │   │   ├── meta-ads.md
│   │   │   ├── google-ads.md
│   │   │   └── local-service-ads.md
│   │   ├── funil-de-vendas.md
│   │   ├── sistemas/
│   │   └── consultorias.md
│   ├── processos/             # Processos internos da equipe
│   ├── clientes/              # Cases e histórico de clientes
│   └── recursos/              # Ferramentas, links, materiais de apoio
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

## Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e importe este repositório
2. Ao importar, configure:
    - **Root Directory**: `base-conhecimento`
    - **Framework Preset**: Other
    - As demais opções já vêm do `vercel.json`
3. Clique em Deploy

A cada push, a Vercel faz rebuild automaticamente.

## Próximos passos

- [ ] Preencher a página de cada serviço
- [ ] Criar primeiros processos internos (ex: onboarding de cliente)
- [ ] Documentar clientes atuais
- [ ] Adicionar recursos / ferramentas da agência
