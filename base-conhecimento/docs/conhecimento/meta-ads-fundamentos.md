# Meta Ads — Fundamentos

Os conceitos que todo gestor de tráfego precisa dominar antes de tocar em qualquer conta.

## Hierarquia do Meta Ads

O Meta Ads tem **3 níveis**:

```
Campanha
├── Conjunto de anúncios (Ad Set)
│   ├── Anúncio 1
│   ├── Anúncio 2
│   └── Anúncio 3
└── Conjunto de anúncios
    └── ...
```

### Campanha
- Define o **objetivo** (Vendas, Leads, Tráfego, etc.)
- Controla o orçamento (quando usar CBO)
- Define a estrutura geral

### Conjunto de anúncios (Ad Set)
- Define **quem** vai ver o anúncio (público)
- Define **onde** (posicionamentos)
- Define **quando** (agendamento)
- Define o **lance** e otimização

### Anúncio (Ad)
- O **criativo** em si
- Imagem/vídeo + texto + CTA + link de destino

## Objetivos de campanha

O Meta atualizou os objetivos para o modelo ODAX. Os principais:

| Objetivo | Quando usar |
|----------|-------------|
| **Vendas** | E-commerce, compras online rastreáveis |
| **Cadastros (Leads)** | Captação de leads (formulário, WhatsApp) |
| **Tráfego** | Levar gente para um site (evitar para conversão) |
| **Engajamento** | Curtidas, comentários, mensagens |
| **Reconhecimento** | Topo de funil, brand awareness |
| **App** | Instalações e eventos de app |

!!! danger "Atenção"
    **Nunca** use "Tráfego" para otimizar conversão. Use "Vendas" ou "Cadastros" — são objetivos que aprendem com as conversões reais.

## Públicos

### Tipos principais

1. **Prospecção**:
     - Interesses
     - Comportamentos
     - Lookalike (semelhante)
     - Público amplo (Advantage+)

2. **Remarketing**:
     - Visitantes do site (Pixel)
     - Engajamento no Instagram/Facebook
     - Lista de clientes
     - Video viewers

### Regra de ouro
> Comece pela base mais quente (lista de clientes, visitantes) e vá abrindo para lookalikes e interesses.

## Pixel e Conversions API

- **Pixel**: roda no navegador, rastreia eventos via JavaScript
- **Conversions API (CAPI)**: envia eventos direto do servidor
- **Deduplicação**: use o mesmo `event_id` nos dois lados

!!! tip "Melhor prática"
    Rode **Pixel + CAPI juntos** com deduplicação. iOS 14+ quebrou muito Pixel puro, CAPI recupera esses dados.

## Métricas essenciais

| Métrica | Fórmula | O que significa |
|---------|---------|----------------|
| **CPM** | Gasto / Impressões × 1000 | Custo para alcançar 1000 pessoas |
| **CTR** | Cliques / Impressões | % de quem clicou |
| **CPC** | Gasto / Cliques | Custo por clique |
| **CPA** | Gasto / Conversões | Custo por aquisição |
| **ROAS** | Receita / Gasto | Retorno sobre investimento em ads |
| **Frequência** | Impressões / Alcance | Quantas vezes a mesma pessoa viu |

### Benchmarks de referência

Estes são **pontos de partida** — sempre compare com o histórico do cliente.

- **CTR saudável**: > 1% no feed, > 0,8% em stories
- **Frequência**: manter < 3 por semana
- **ROAS mínimo**: depende da margem (regra geral: 3x para e-commerce)

## Aprendizado da campanha

Todo conjunto de anúncios passa por uma fase de **aprendizado**:

- Precisa de **~50 conversões por semana** para sair da fase de aprendizado
- Editar o conjunto reinicia o aprendizado
- **Não otimize nada nos primeiros 3-5 dias** — deixe o algoritmo aprender

!!! warning "Não faça isso"
    - Pausar/despausar campanha toda hora
    - Mudar verba em mais de 20% por dia
    - Duplicar todos os conjuntos achando que é "otimização"

## Próximos passos

- Leia a [estrutura de campanha](estrutura-campanha.md) da agência
- Consulte o [glossário](glossario.md) para termos novos
