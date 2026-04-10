# Criação de Campanha no Meta Ads

## Objetivo

Padronizar como a equipe sobe campanhas no Meta Ads, garantindo nomenclatura consistente, estrutura correta e rastreamento adequado.

## Quando usar

Toda vez que for criar uma nova campanha, conjunto de anúncios ou anúncio no Meta Ads.

## Responsável

- **Gestor de tráfego**: executa
- **Líder de tráfego**: revisa antes de ativar

## Pré-requisitos

- Briefing do cliente preenchido
- Criativos aprovados
- Pixel e conversões funcionando
- Verba definida

## Passo a passo

### 1. Nomenclatura

Seguir o padrão definido no [guia de estrutura de campanha](../conhecimento/estrutura-campanha.md).

**Formato de campanha:**
```
[Cliente] | [Objetivo] | [Fase] | [Data]
Ex: AcmeCorp | Conversão | Prospecção | 2026-04
```

**Formato de conjunto de anúncios:**
```
[Público] | [Segmentação] | [Posicionamento]
Ex: LAL 1% | Compradores 180d | Feed+Stories
```

**Formato de anúncio:**
```
[Formato] | [Hook] | [CTA]
Ex: Video | Dor-solução | Saiba mais
```

### 2. Estrutura da campanha

- [ ] Escolher objetivo correto (Vendas, Leads, Tráfego, Reconhecimento)
- [ ] Ativar otimização de orçamento (CBO) quando aplicável
- [ ] Configurar limite de gasto diário/vitalício
- [ ] Definir datas de início e fim (se houver)

### 3. Conjunto de anúncios

- [ ] Definir público: LAL, interesses, retargeting
- [ ] Configurar posicionamentos manualmente (não automático)
- [ ] Otimização: conversão correta selecionada
- [ ] Janela de atribuição: 7d click / 1d view (padrão)

### 4. Anúncios

- [ ] Subir 3 variações por conjunto (mínimo)
- [ ] UTMs configuradas (padrão da agência)
- [ ] Link de destino correto
- [ ] CTA coerente com o objetivo

### 5. Revisão antes de ativar

- [ ] Nomenclatura correta
- [ ] Verba conferida
- [ ] Segmentação revisada
- [ ] Criativos aprovados e em alta resolução
- [ ] UTMs testadas (abrir link e ver se chega no analytics)

## Checklist final

- [ ] Campanha revisada pelo líder
- [ ] Cliente comunicado sobre o go-live
- [ ] Screenshot salvo na pasta do cliente
- [ ] Entrada no log de campanhas

## Erros comuns

!!! danger "Nunca faça isso"
    - Subir campanha sem revisar nomenclatura — atrapalha relatórios depois.
    - Usar posicionamentos automáticos em conta nova — sempre manual no início.
    - Esquecer UTMs — sem elas, o analytics fica cego.
    - Subir um único anúncio — sem teste A/B você não aprende nada.
