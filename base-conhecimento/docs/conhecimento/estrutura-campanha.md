# Estrutura de Campanha — Padrão da Agência

Padrão oficial de nomenclatura e organização usado em **todas** as contas gerenciadas.

## Por que um padrão?

Sem padrão, cada gestor cria do seu jeito e:
- Relatórios viram um inferno
- Troca de gestor custa semanas de reorganização
- Erros passam despercebidos

Com padrão:
- Qualquer gestor entende qualquer conta em minutos
- Relatórios automatizados funcionam
- Auditoria é rápida

## Nomenclatura

### Campanha

```
[Cliente] | [Objetivo] | [Fase] | [AAAA-MM]
```

**Exemplo:**
```
AcmeCorp | Vendas | Prospecção | 2026-04
AcmeCorp | Vendas | Remarketing | 2026-04
AcmeCorp | Leads | Escala | 2026-04
```

**Fases possíveis:**
- `Prospecção` — públicos frios
- `Remarketing` — públicos quentes
- `Escala` — campanhas validadas recebendo mais verba
- `Teste` — campanhas experimentais

### Conjunto de anúncios

```
[Tipo de público] | [Detalhe] | [Posicionamento]
```

**Exemplos:**
```
LAL 1% | Compradores 180d | Feed+Stories
Interesse | Marketing Digital | Feed+Stories+Reels
Retarget | ViewContent 14d | Todos
Lista | Clientes inativos | Feed
```

### Anúncio

```
[Formato] | [Ângulo] | [Variação]
```

**Formatos:** `Static`, `Video`, `Carousel`, `Collection`

**Exemplos:**
```
Video | Dor-solução | v1
Static | Prova social | v2
Carousel | Benefícios | v1
```

## Estrutura recomendada

### Conta pequena (< R$ 10k/mês)

```
1 campanha Prospecção
├── 2-3 conjuntos (LAL, Interesse, Amplo)
└── 3 anúncios por conjunto

1 campanha Remarketing
├── 1 conjunto (ViewContent/AddToCart)
└── 3 anúncios
```

### Conta média (R$ 10k–50k/mês)

```
1 campanha Prospecção (CBO)
├── 3-5 conjuntos
└── 3-4 anúncios por conjunto

1 campanha Remarketing
├── 2-3 conjuntos (14d, 30d, 180d)
└── 3 anúncios por conjunto

1 campanha Teste (sempre ativa)
└── Testes controlados de criativos/públicos
```

### Conta grande (> R$ 50k/mês)

Estrutura acima, mas com **campanhas separadas por ângulo criativo** ou por categoria de produto. Discutir com o líder de tráfego.

## Regras gerais

!!! tip "Faça"
    - **Posicionamentos manuais** nos primeiros 30 dias para gerar dados por canal
    - **Janela de atribuição 7d click / 1d view** como padrão
    - **Budget lifetime** para campanhas com data fim, **daily** para contínuas
    - **UTM obrigatória** em todos os anúncios

!!! danger "Não faça"
    - Não use posicionamentos automáticos em conta nova
    - Não misture prospecção e remarketing no mesmo conjunto
    - Não crie 20 conjuntos "para ver qual funciona" — foco primeiro
    - Não mude nomenclatura no meio do mês — espere o próximo ciclo

## UTMs padrão

```
utm_source=meta
utm_medium=paid
utm_campaign={{campaign.name}}
utm_content={{adset.name}}
utm_term={{ad.name}}
```

Coloque no campo **Parâmetros de URL** do anúncio. Use as macros do próprio Meta — elas preenchem automaticamente.
