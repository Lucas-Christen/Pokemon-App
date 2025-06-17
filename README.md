# Pokémon App

Este aplicativo Ionic/Angular foi desenvolvido por Lucas Fernandes Christen, (contato: lucas.f.christen@outlook.com, +55 15 996706256, https://www.linkedin.com/in/lucas-f-christen-69327a21b/), para exibir informações sobre Pokémon utilizando a PokéAPI, seguindo princípios de design modular e responsivo. A arquitetura do projeto segue o padrão de componentes do Angular com separação clara entre serviços, interfaces de modelo e componentes de UI para facilitar a manutenção e escalabilidade. Adotei uma abordagem de design mobile-first com adaptações específicas para diferentes orientações de tela através de media queries no SCSS. O gerenciamento de estado foi implementado através de serviços compartilhados, especialmente para o sistema de favoritos que persiste dados localmente. A interface de usuário segue princípios de Material Design com componentes Ionic, priorizando acessibilidade e usabilidade em diferentes dispositivos. O código segue boas práticas como tipagem forte com TypeScript, nomenclatura descritiva e comentários estratégicos para facilitar a compreensão do fluxo de dados.

## Funcionalidades

- Listagem de Pokémon com paginação
- Visualização detalhada com informações, estatísticas, habilidades e movimentos
- Sistema de favoritos com persistência local
- Design responsivo para diferentes tamanhos de tela e orientações
- Busca em tempo real por nome de Pokémon
- Sistema de webhooks para integração com serviços externos

## Tecnologias Utilizadas

- Ionic 7
- Angular 17
- TypeScript
- RxJS
- PokéAPI

## Como Executar

1. Clone este repositório
2. Execute `npm install` para instalar as dependências
3. Execute `ionic serve` para iniciar o servidor de desenvolvimento
4. Acesse `http://localhost:8100` no navegador

## Estrutura do Projeto

- **models**: Interfaces TypeScript para tipagem dos dados
- **services**: Serviços para comunicação com API e gerenciamento de estado
- **pages**: Componentes de página principais da aplicação
- **shared/components**: Componentes reutilizáveis

## Responsividade

O aplicativo foi projetado para funcionar em diferentes orientações e tamanhos de tela:
- **Modo retrato**: Layout otimizado para uso com uma mão
- **Modo paisagem**: Layout adaptado para aproveitar a largura extra da tela

## Sistema de Webhooks

O aplicativo inclui um sistema completo de webhooks que permite integração com serviços externos:

### Tipos de Eventos
- Adição de Pokémon aos favoritos
- Remoção de Pokémon dos favoritos
- Visualização de detalhes de Pokémon
- Busca de Pokémon

### Como Usar
1. Acesse a página de webhooks através do ícone de link na barra superior
2. Adicione um novo webhook com URL de destino e eventos de interesse
3. Opcionalmente, configure uma chave secreta para autenticação
4. Teste a conexão e ative o webhook

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

Para mais detalhes sobre a implementação, consulte o arquivo DOCUMENTATION.md. 