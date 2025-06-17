# Documentação Técnica - Pokémon App

## Visão Geral da Arquitetura

Este aplicativo foi desenvolvido por Lucas Fernandes Christen, (contato: lucas.f.christen@outlook.com, +55 15 996706256, https://www.linkedin.com/in/lucas-f-christen-69327a21b/) e segue uma arquitetura baseada em componentes do Angular, organizada em módulos funcionais. A estrutura do projeto foi projetada para ser escalável, manutenível e testável.

### Estrutura de Diretórios

```
pokemon-app/
  ├── src/
  │   ├── app/
  │   │   ├── models/         # Interfaces e tipos
  │   │   ├── services/       # Serviços para lógica de negócios e API
  │   │   ├── pages/          # Componentes de página
  │   │   │   ├── home/       # Página inicial com lista de Pokémon
  │   │   │   ├── pokemon-detail/ # Página de detalhes do Pokémon
  │   │   │   ├── favorites/  # Página de Pokémon favoritos
  │   │   │   └── webhooks/   # Página de gerenciamento de webhooks
  │   │   └── shared/         # Componentes e utilitários compartilhados
  │   ├── assets/             # Recursos estáticos
  │   └── environments/       # Configurações de ambiente
```

## Fluxo de Dados

O aplicativo segue um fluxo de dados unidirecional:

1. Os serviços (`PokemonService`, `FavoritesService`, `WebhookService`) são responsáveis por buscar e gerenciar dados
2. Os componentes de página injetam esses serviços e se inscrevem em seus observables
3. Os dados são exibidos nos templates usando data binding
4. Interações do usuário disparam eventos que são tratados pelos componentes
5. Os componentes delegam operações de dados para os serviços

## Principais Componentes

### PokemonService

Responsável pela comunicação com a PokéAPI, este serviço implementa:

- Busca paginada de Pokémon
- Busca de detalhes de um Pokémon específico
- Busca de informações de espécie
- Funções utilitárias para formatação de dados
- Disparo de eventos de webhook quando um Pokémon é visualizado ou uma busca é realizada

```typescript
// Exemplo de método para buscar detalhes do Pokémon
getPokemonWithSpecies(id: number): Observable<{pokemon: Pokemon, species: PokemonSpecies}> {
  return forkJoin({
    pokemon: this.getPokemon(id),
    species: this.getPokemonSpecies(id)
  });
}
```

### FavoritesService

Gerencia o sistema de favoritos com persistência local:

- Adicionar/remover Pokémon favoritos
- Verificar status de favorito
- Persistência usando localStorage
- Notificação de mudanças via BehaviorSubject
- Disparo de eventos de webhook quando um Pokémon é adicionado ou removido dos favoritos

```typescript
// Exemplo de implementação do toggle de favoritos
toggleFavorite(pokemon: FavoritePokemon): boolean {
  if (this.isFavorite(pokemon.id)) {
    return this.removeFromFavorites(pokemon.id);
  } else {
    return this.addToFavorites(pokemon);
  }
}
```

### WebhookService

Gerencia o sistema de webhooks para integração com sistemas externos:

- Registro e gerenciamento de webhooks
- Disparo de eventos para endpoints externos
- Persistência de configurações usando localStorage
- Suporte para diferentes tipos de eventos

```typescript
// Exemplo de método para disparar um evento de webhook
triggerEvent(eventType: string, payload: any): void {
  const webhooks = this.webhooksSubject.value.filter(
    webhook => webhook.active && webhook.events.includes(eventType)
  );
  
  webhooks.forEach(webhook => {
    this.sendWebhookRequest(webhook, {
      type: eventType,
      payload,
      timestamp: new Date()
    });
  });
}
```

## Interfaces de Modelo

As interfaces TypeScript definem a estrutura dos dados da aplicação:

```typescript
export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  sprites: PokemonSprites;
  stats: PokemonStat[];
  types: PokemonType[];
  abilities: PokemonAbility[];
  moves: PokemonMove[];
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  createdAt: Date;
  lastTriggered?: Date;
  active: boolean;
}
```

## Sistema de Webhooks

O aplicativo implementa um sistema completo de webhooks que permite a integração com sistemas externos:

### Tipos de Eventos

- `pokemon.favorite.added`: Disparado quando um Pokémon é adicionado aos favoritos
- `pokemon.favorite.removed`: Disparado quando um Pokémon é removido dos favoritos
- `pokemon.viewed`: Disparado quando um Pokémon é visualizado
- `search.performed`: Disparado quando uma busca é realizada

### Formato do Payload

```json
{
  "type": "pokemon.favorite.added",
  "payload": {
    "pokemon": {
      "id": 25,
      "name": "pikachu",
      "image": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
      "types": ["electric"]
    }
  },
  "timestamp": "2023-07-20T15:30:45.123Z",
  "app": {
    "name": "Pokemon App",
    "version": "1.0.0"
  }
}
```

### Configuração de Webhooks

Os usuários podem configurar webhooks através da interface gráfica:

1. Acessar a página de webhooks
2. Adicionar um novo webhook com URL, eventos de interesse e chave secreta (opcional)
3. Testar a conexão com o endpoint
4. Ativar/desativar webhooks conforme necessário

### Segurança

- Suporte para chaves secretas enviadas como header `X-Webhook-Secret`
- Validação de URLs
- Controle de ativação/desativação de webhooks

## Estratégias de Responsividade

O aplicativo implementa design responsivo através de:

1. **Media Queries**: Adaptações específicas para diferentes tamanhos de tela e orientações
2. **Flexbox e Grid**: Layout fluido que se ajusta automaticamente
3. **Unidades Relativas**: Uso de % e rem para dimensionamento proporcional
4. **Componentes Ionic**: Aproveitamento dos recursos responsivos nativos do Ionic

### Exemplos de Media Queries

```scss
// Modo paisagem
@media (orientation: landscape) {
  .pokemon-header {
    flex-direction: row;
    justify-content: space-around;
  }
}

// Telas maiores (tablets)
@media (min-width: 768px) {
  .pokemon-image {
    width: 250px;
    height: 250px;
  }
}
```

## Gerenciamento de Estado

O aplicativo utiliza uma combinação de:

1. **Serviços com BehaviorSubject**: Para estado compartilhado entre componentes
2. **Parâmetros de Rota**: Para navegação com estado
3. **LocalStorage**: Para persistência de dados entre sessões

## Otimizações de Performance

1. **Lazy Loading**: Carregamento sob demanda de módulos e componentes
2. **Paginação**: Carregamento incremental de dados da API
3. **Limitação de Dados**: Processamento apenas dos dados necessários
4. **Memoização**: Cache de resultados de operações custosas

## Estratégia de Testes

O projeto é estruturado para suportar:

1. **Testes Unitários**: Para serviços e lógica de negócios
2. **Testes de Componentes**: Para verificar renderização e comportamento da UI
3. **Testes E2E**: Para fluxos completos de usuário

## Convenções de Código

1. **Nomenclatura**: Nomes descritivos em camelCase para variáveis e PascalCase para interfaces
2. **Organização**: Um componente/serviço por arquivo
3. **Comentários**: Documentação de métodos públicos e lógica complexa
4. **Tipagem**: Uso consistente de interfaces TypeScript

## Considerações de Segurança

1. **Sanitização de Input**: Prevenção de XSS em campos de entrada
2. **Validação de Dados**: Verificação de integridade dos dados da API
3. **Content Security Policy**: Configuração para prevenir injeção de scripts maliciosos
4. **Validação de Webhooks**: Verificação de URLs e uso de chaves secretas

## Roadmap Futuro

1. **Modo Offline**: Implementação de cache para funcionamento sem internet
2. **Internacionalização**: Suporte a múltiplos idiomas
3. **PWA**: Transformação em Progressive Web App para instalação no dispositivo
4. **Testes Automatizados**: Cobertura completa de testes unitários e E2E
5. **Autenticação para Webhooks**: Implementação de autenticação OAuth para maior segurança 