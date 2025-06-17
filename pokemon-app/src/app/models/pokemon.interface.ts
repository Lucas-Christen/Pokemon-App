// src/app/models/pokemon.interface.ts

// Resposta da lista de pokemons
export interface PokemonListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: PokemonBasic[];
  }
  
  // Pokemon básico (da lista)
  export interface PokemonBasic {
    name: string;
    url: string;
  }
  
  // Pokemon completo (detalhes)
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
    species: {
      name: string;
      url: string;
    };
  }
  
  // Sprites (imagens)
  export interface PokemonSprites {
    front_default: string | null;
    front_shiny: string | null;
    back_default: string | null;
    back_shiny: string | null;
    other: {
      'official-artwork': {
        front_default: string | null;
        front_shiny: string | null;
      };
      dream_world: {
        front_default: string | null;
      };
      home: {
        front_default: string | null;
        front_shiny: string | null;
      };
    };
  }
  
  // Estatísticas
  export interface PokemonStat {
    base_stat: number;
    effort: number;
    stat: {
      name: string;
      url: string;
    };
  }
  
  // Tipos
  export interface PokemonType {
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }
  
  // Habilidades
  export interface PokemonAbility {
    is_hidden: boolean;
    slot: number;
    ability: {
      name: string;
      url: string;
    };
  }
  
  // Espécie (para descrições)
  export interface PokemonSpecies {
    id: number;
    name: string;
    flavor_text_entries: FlavorTextEntry[];
    genera: Genus[];
    habitat: {
      name: string;
      url: string;
    } | null;
    color: {
      name: string;
      url: string;
    };
    evolution_chain: {
      url: string;
    };
  }
  
  // Descrições
  export interface FlavorTextEntry {
    flavor_text: string;
    language: {
      name: string;
      url: string;
    };
    version: {
      name: string;
      url: string;
    };
  }
  
  // Gênero/categoria
  export interface Genus {
    genus: string;
    language: {
      name: string;
      url: string;
    };
  }
  
  // Interface para Pokemon favorito (local storage)
  export interface FavoritePokemon {
    id: number;
    name: string;
    image: string;
    types: string[];
    dateAdded: Date;
  }