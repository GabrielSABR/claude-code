# PROMPT — CRIAR CAMPANHA META ADS VIA API

Crie uma campanha completa no Meta Ads Manager usando a API do Meta (v22.0).
Siga exatamente as configurações abaixo e respeite todas as regras obrigatórias.

---

## REGRAS OBRIGATÓRIAS

- Criar tudo em status **PAUSED** (rascunho — nunca publicar)
- Advantage+ Audience: **DESLIGADO** em todos os conjuntos (`targeting_automation: {"advantage_audience": 0}`)
- Direcionamento detalhado: para cada interesse informado, buscar na API (`GET /search?type=adinterest&q={nome}`) e aplicar o ID via `flexible_spec`. Se não encontrado exatamente, listar os não encontrados e continuar a criação
- Executar todas as chamadas via `curl` no Bash
- **Fluxo obrigatório de criação para cada anúncio:**
  1. Criar campanha → salvar `campaign_id`
  2. Criar conjunto → salvar `adset_id` (vinculado ao `campaign_id`)
  3. Criar creative com `asset_feed_spec` → salvar `creative_id`
  4. Criar anúncio → vincular `adset_id` + `creative_id` no mesmo POST
- Cada anúncio deve ser criado **dentro do seu respectivo conjunto**
- **Criativos em vídeo com múltiplos formatos:**
  - Usar `asset_feed_spec` com `asset_customization_rules` para mapear cada vídeo ao seu placement
  - Feed → `facebook_positions: ["feed"]` + `instagram_positions: ["stream"]`
  - Wide → `facebook_positions: ["instream_video"]`
  - Stories → `facebook_positions: ["story"]` + `instagram_positions: ["story", "reels"]`
  - Se algum formato não estiver preenchido: criar o creative apenas com os formatos disponíveis, sem substituir
- Retornar relatório final com todos os IDs criados

---

## ACESSO

```
Token       :
ID da conta :
```

---

## CAMPANHA

```
Nome      :
Objetivo  : [ ] Tráfego  [ ] Leads  [ ] Vendas  [ ] Engajamento
Orçamento : [ ] Por campanha (CBO)  [ ] Por conjunto (ABO)
```

---

## CONJUNTO 1

```
Nome        :
Destino     : [ ] Site  [ ] WhatsApp  [ ] Instagram  [ ] Messenger
Meta        : [ ] Cliques no link  [ ] Visualizações de página
Pixel       :
Evento      : [ ] Lead  [ ] Purchase  [ ] ViewContent  [ ] CompleteRegistration
Orçamento   : R$ ___ por dia
Período     : de ___/___/______  até ___/___/______
Localização :
Idade       : ___ a ___
Gênero      : [ ] Todos  [ ] Masculino  [ ] Feminino
Excluir     :
Interesses  :
---
(cole os interesses aqui, um por linha)
---
```

### ANÚNCIO 1.1 (dentro do Conjunto 1)

```
Nome              :
Página FB         :
Instagram         :
Título            :
Descrição         :
CTA               : [ ] Saiba mais  [ ] Comprar  [ ] Cadastre-se  [ ] Fale conosco
Link              :
UTMs              : utm_source=&utm_medium=&utm_campaign=&utm_content=&utm_term=
WhatsApp          : [ ] Sim  [ ] Não

Vídeo Feed        : (nome ou ID do vídeo — formato 4:5 ou 1:1)
Vídeo Wide        : (nome ou ID do vídeo — formato 16:9)
Vídeo Stories     : (nome ou ID do vídeo — formato 9:16)

Texto do anúncio  :
---
(texto aqui)
---
```

### ANÚNCIO 1.2 (dentro do Conjunto 1)

```
Nome              :
Página FB         :
Instagram         :
Título            :
Descrição         :
CTA               : [ ] Saiba mais  [ ] Comprar  [ ] Cadastre-se  [ ] Fale conosco
Link              :
UTMs              : utm_source=&utm_medium=&utm_campaign=&utm_content=&utm_term=
WhatsApp          : [ ] Sim  [ ] Não

Vídeo Feed        : (nome ou ID do vídeo — formato 4:5 ou 1:1)
Vídeo Wide        : (nome ou ID do vídeo — formato 16:9)
Vídeo Stories     : (nome ou ID do vídeo — formato 9:16)

Texto do anúncio  :
---
(texto aqui)
---
```

> Para adicionar mais anúncios no Conjunto 1: copie o bloco ANÚNCIO 1.X e renomeie (1.3, 1.4...).
> Para remover: deixe o bloco vazio ou apague.
> Se algum formato de vídeo não existir: deixe o campo em branco — o creative será criado só com os formatos preenchidos.

---

## CONJUNTO 2

```
Nome        :
Destino     : [ ] Site  [ ] WhatsApp  [ ] Instagram  [ ] Messenger
Meta        : [ ] Cliques no link  [ ] Visualizações de página
Pixel       :
Evento      : [ ] Lead  [ ] Purchase  [ ] ViewContent  [ ] CompleteRegistration
Orçamento   : R$ ___ por dia
Período     : de ___/___/______  até ___/___/______
Localização :
Idade       : ___ a ___
Gênero      : [ ] Todos  [ ] Masculino  [ ] Feminino
Excluir     :
Interesses  :
---
(cole os interesses aqui, um por linha)
---
```

### ANÚNCIO 2.1 (dentro do Conjunto 2)

```
Nome              :
Página FB         :
Instagram         :
Título            :
Descrição         :
CTA               : [ ] Saiba mais  [ ] Comprar  [ ] Cadastre-se  [ ] Fale conosco
Link              :
UTMs              : utm_source=&utm_medium=&utm_campaign=&utm_content=&utm_term=
WhatsApp          : [ ] Sim  [ ] Não

Vídeo Feed        : (nome ou ID do vídeo — formato 4:5 ou 1:1)
Vídeo Wide        : (nome ou ID do vídeo — formato 16:9)
Vídeo Stories     : (nome ou ID do vídeo — formato 9:16)

Texto do anúncio  :
---
(texto aqui)
---
```

> Para adicionar mais conjuntos: copie o bloco CONJUNTO X com todos os seus anúncios e renomeie (3, 4...).
> Para remover um conjunto: deixe vazio ou apague o bloco inteiro.

---

## RELATÓRIO ESPERADO

```
CAMPANHA
  ✅ [nome] | ID: xxxxxx

CONJUNTO 1 — [nome] | ID: xxxxxx
  Interesses:
    ✓ [nome exato] — ID: xxxxxx
    ~ [nome aproximado para "digitado"] — ID: xxxxxx
    ✗ [não encontrado]

  ANÚNCIO 1.1 — [nome]
    Formatos: Feed ✅ | Wide ✅ | Stories ✅
    Creative ID: xxxxxx | Ad ID: xxxxxx

  ANÚNCIO 1.2 — [nome]
    Formatos: Feed ✅ | Wide ✗ (não informado) | Stories ✅
    Creative ID: xxxxxx | Ad ID: xxxxxx

CONJUNTO 2 — [nome] | ID: xxxxxx
  ...
```
