// src/app/services/pokemon.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, catchError, tap, shareReplay } from 'rxjs/operators';
import { 
  PokemonListResponse, 
  Pokemon, 
  PokemonSpecies, 
  PokemonBasic 
} from '../models/pokemon.interface';
import { WebhookService } from './webhook.service';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private readonly baseUrl = 'https://pokeapi.co/api/v2';
  private cache = new Map<string, any>();
  private allPokemonNames: {name: string, id: number}[] = [];
  private isLoadingAllNames = false;
  private namesLoaded$ = new BehaviorSubject<boolean>(false);
  private storageAvailable = true; // Flag para verificar se o localStorage está disponível
  private readonly MAX_CACHE_SIZE = 100; // Limitar o número de itens em cache
  private readonly MAX_STORAGE_ITEMS = 50; // Limitar o número de itens no localStorage
  private cacheKeys: string[] = []; // Rastrear chaves de cache para implementar LRU

  constructor(
    private http: HttpClient,
    private webhookService: WebhookService
  ) {
    this.checkStorageAvailability();
    this.loadAllPokemonNames();
  }
  
  // Verificar se o localStorage está disponível e com espaço
  private checkStorageAvailability(): void {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      this.storageAvailable = true;
    } catch (e) {
      console.warn('localStorage não está disponível ou está cheio:', e);
      this.storageAvailable = false;
    }
  }

  // Carregar todos os nomes de Pokémon para busca rápida
  private loadAllPokemonNames(): void {
    if (this.isLoadingAllNames) return;
    
    this.isLoadingAllNames = true;
    
    // Verificar se já temos os nomes no localStorage
    if (this.storageAvailable) {
      try {
        const cachedNames = localStorage.getItem('pokemon_names');
        if (cachedNames) {
          this.allPokemonNames = JSON.parse(cachedNames);
          this.isLoadingAllNames = false;
          this.namesLoaded$.next(true);
          return;
        }
      } catch (e) {
        console.error('Erro ao carregar nomes do cache:', e);
      }
    }
    
    // Buscar até 1010 Pokémon (limite atual da API)
    this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon?limit=1010`)
      .pipe(shareReplay(1))
      .subscribe({
        next: (response) => {
          this.allPokemonNames = response.results.map((pokemon, index) => ({
            name: pokemon.name,
            id: this.extractIdFromUrl(pokemon.url)
          }));
          
          // Salvar no localStorage se disponível
          if (this.storageAvailable) {
            try {
              localStorage.setItem('pokemon_names', JSON.stringify(this.allPokemonNames));
            } catch (e) {
              console.warn('Não foi possível salvar nomes no cache:', e);
              this.storageAvailable = false;
            }
          }
          
          this.isLoadingAllNames = false;
          this.namesLoaded$.next(true);
        },
        error: (error) => {
          console.error('Erro ao carregar nomes de Pokémon:', error);
          this.isLoadingAllNames = false;
          this.namesLoaded$.next(false);
        }
      });
  }

  // Gerenciar cache LRU (Least Recently Used)
  private manageCache(key: string, data: any): void {
    // Adicionar à memória cache
    this.cache.set(key, data);
    
    // Atualizar a lista de chaves (mover para o final = mais recente)
    this.cacheKeys = this.cacheKeys.filter(k => k !== key);
    this.cacheKeys.push(key);
    
    // Se exceder o tamanho máximo, remover o item menos usado
    if (this.cacheKeys.length > this.MAX_CACHE_SIZE) {
      const oldestKey = this.cacheKeys.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    // Tentar salvar no localStorage se disponível
    if (this.storageAvailable) {
      try {
        // Verificar se é um item que deve ser armazenado permanentemente
        if (key.startsWith('pokemon_') || key.startsWith('species_')) {
          // Verificar quantos itens já estão no localStorage
          let storageItems = 0;
          for (let i = 0; i < localStorage.length; i++) {
            const storedKey = localStorage.key(i);
            if (storedKey && (storedKey.startsWith('pokemon_') || storedKey.startsWith('species_'))) {
              storageItems++;
            }
          }
          
          // Se exceder o limite, remover alguns itens antigos
          if (storageItems >= this.MAX_STORAGE_ITEMS) {
            // Remover alguns itens antigos para liberar espaço
            let removed = 0;
            for (let i = 0; i < localStorage.length && removed < 5; i++) {
              const storedKey = localStorage.key(i);
              if (storedKey && (storedKey.startsWith('pokemon_') || storedKey.startsWith('species_'))) {
                localStorage.removeItem(storedKey);
                removed++;
              }
            }
          }
          
          // Agora tenta salvar
          localStorage.setItem(key, JSON.stringify(data));
        }
      } catch (e) {
        console.warn('Erro ao salvar no localStorage, desativando armazenamento:', e);
        this.storageAvailable = false;
      }
    }
  }

  // Buscar lista de pokemons com paginação
  getPokemonList(limit: number = 20, offset: number = 0): Observable<PokemonListResponse> {
    const cacheKey = `list_${limit}_${offset}`;
    
    if (this.cache.has(cacheKey)) {
      // Atualizar posição na LRU
      this.cacheKeys = this.cacheKeys.filter(k => k !== cacheKey);
      this.cacheKeys.push(cacheKey);
      return of(this.cache.get(cacheKey));
    }

    return this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon?limit=${limit}&offset=${offset}`)
      .pipe(
        shareReplay(1),
        map(response => {
          this.manageCache(cacheKey, response);
          return response;
        }),
        catchError(error => {
          console.error('Erro ao buscar lista de pokemons:', error);
          throw error;
        })
      );
  }

  // Buscar pokemon por ID ou nome
  getPokemon(idOrName: string | number): Observable<Pokemon> {
    const cacheKey = `pokemon_${idOrName}`;
    
    // Verificar cache em memória
    if (this.cache.has(cacheKey)) {
      // Atualizar posição na LRU
      this.cacheKeys = this.cacheKeys.filter(k => k !== cacheKey);
      this.cacheKeys.push(cacheKey);
      
      return of(this.cache.get(cacheKey)).pipe(
        tap(pokemon => {
          // Disparar evento de visualização de Pokémon
          this.webhookService.triggerEvent(
            this.webhookService.EVENT_TYPES.POKEMON_VIEWED,
            { pokemon: { id: pokemon.id, name: pokemon.name } }
          );
        })
      );
    }
    
    // Verificar cache no localStorage
    if (this.storageAvailable) {
      try {
        const localData = localStorage.getItem(cacheKey);
        if (localData) {
          const pokemon = JSON.parse(localData);
          this.manageCache(cacheKey, pokemon);
          
          return of(pokemon).pipe(
            tap(pokemon => {
              this.webhookService.triggerEvent(
                this.webhookService.EVENT_TYPES.POKEMON_VIEWED,
                { pokemon: { id: pokemon.id, name: pokemon.name } }
              );
            })
          );
        }
      } catch (e) {
        console.warn('Erro ao carregar pokemon do cache local:', e);
      }
    }

    return this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${idOrName}`)
      .pipe(
        shareReplay(1),
        map(pokemon => {
          this.manageCache(cacheKey, pokemon);
          return pokemon;
        }),
        tap(pokemon => {
          // Disparar evento de visualização de Pokémon
          this.webhookService.triggerEvent(
            this.webhookService.EVENT_TYPES.POKEMON_VIEWED,
            { pokemon: { id: pokemon.id, name: pokemon.name } }
          );
        }),
        catchError(error => {
          console.error('Erro ao buscar pokemon:', error);
          throw error;
        })
      );
  }

  // Buscar espécie do pokemon (para descrições)
  getPokemonSpecies(idOrName: string | number): Observable<PokemonSpecies> {
    const cacheKey = `species_${idOrName}`;
    
    if (this.cache.has(cacheKey)) {
      // Atualizar posição na LRU
      this.cacheKeys = this.cacheKeys.filter(k => k !== cacheKey);
      this.cacheKeys.push(cacheKey);
      return of(this.cache.get(cacheKey));
    }
    
    // Verificar cache no localStorage
    if (this.storageAvailable) {
      try {
        const localData = localStorage.getItem(cacheKey);
        if (localData) {
          const species = JSON.parse(localData);
          this.manageCache(cacheKey, species);
          return of(species);
        }
      } catch (e) {
        console.warn('Erro ao carregar espécie do cache local:', e);
      }
    }

    return this.http.get<PokemonSpecies>(`${this.baseUrl}/pokemon-species/${idOrName}`)
      .pipe(
        shareReplay(1),
        map(species => {
          this.manageCache(cacheKey, species);
          return species;
        }),
        catchError(error => {
          console.error('Erro ao buscar espécie do pokemon:', error);
          throw error;
        })
      );
  }

  // Buscar pokemon completo com espécie
  getPokemonWithSpecies(idOrName: string | number): Observable<{pokemon: Pokemon, species: PokemonSpecies}> {
    return this.getPokemon(idOrName).pipe(
      switchMap(pokemon => 
        this.getPokemonSpecies(pokemon.id).pipe(
          map(species => ({ pokemon, species }))
        )
      )
    );
  }

  // Buscar múltiplos pokemons (para lista com detalhes)
  getMultiplePokemons(pokemonList: PokemonBasic[]): Observable<Pokemon[]> {
    const requests = pokemonList.map(pokemon => 
      this.getPokemon(this.extractIdFromUrl(pokemon.url))
    );
    
    return forkJoin(requests);
  }

  // Buscar pokemon aleatório
  getRandomPokemon(): Observable<Pokemon> {
    const randomId = Math.floor(Math.random() * 1010) + 1; // 1010 é o total aproximado
    return this.getPokemon(randomId);
  }

  // Buscar pokemons por tipo
  getPokemonsByType(type: string): Observable<PokemonBasic[]> {
    const cacheKey = `type_${type}`;
    
    if (this.cache.has(cacheKey)) {
      // Atualizar posição na LRU
      this.cacheKeys = this.cacheKeys.filter(k => k !== cacheKey);
      this.cacheKeys.push(cacheKey);
      return of(this.cache.get(cacheKey));
    }
    
    return this.http.get<any>(`${this.baseUrl}/type/${type}`)
      .pipe(
        shareReplay(1),
        map(response => {
          const pokemon = response.pokemon.map((p: any) => p.pokemon);
          this.manageCache(cacheKey, pokemon);
          return pokemon;
        }),
        catchError(error => {
          console.error('Erro ao buscar pokemons por tipo:', error);
          throw error;
        })
      );
  }

  // Buscar pokemon por nome (busca exata)
  searchPokemon(query: string): Observable<Pokemon | null> {
    if (!query || query.length < 2) {
      return of(null);
    }

    // Disparar evento de busca
    this.webhookService.triggerEvent(
      this.webhookService.EVENT_TYPES.SEARCH_PERFORMED,
      { query }
    );

    return this.getPokemon(query.toLowerCase()).pipe(
      catchError(() => of(null))
    );
  }

  // Filtrar Pokémon por nome (busca parcial)
  filterPokemonByName(query: string): Observable<{name: string, id: number}[]> {
    if (!query || query.length === 0) {
      return of([]);
    }
    
    const normalizedQuery = query.toLowerCase();
    
    // Se os nomes ainda não foram carregados, esperar
    if (this.allPokemonNames.length === 0) {
      // Se estiver carregando, esperar até que termine
      if (this.isLoadingAllNames) {
        return this.namesLoaded$.pipe(
          switchMap(loaded => {
            if (loaded) {
              return this.performFilterByName(normalizedQuery);
            }
            return of([]);
          })
        );
      }
      return of([]);
    }
    
    return this.performFilterByName(normalizedQuery);
  }
  
  // Método auxiliar para filtrar nomes
  private performFilterByName(query: string): Observable<{name: string, id: number}[]> {
    // Filtrar Pokémon que incluem a query
    const filteredPokemon = this.allPokemonNames
      .filter(pokemon => pokemon.name.includes(query))
      .slice(0, 20); // Limitar a 20 resultados
    
    // Disparar evento de busca se houver resultados
    if (filteredPokemon.length > 0 && query.length >= 2) {
      this.webhookService.triggerEvent(
        this.webhookService.EVENT_TYPES.SEARCH_PERFORMED,
        { 
          query,
          resultCount: filteredPokemon.length,
          firstResult: filteredPokemon[0].name
        }
      );
    }
    
    return of(filteredPokemon);
  }

  // Buscar detalhes de múltiplos Pokémon por ID
  getPokemonDetailsByIds(ids: number[]): Observable<Pokemon[]> {
    if (ids.length === 0) {
      return of([]);
    }
    
    const requests = ids.map(id => this.getPokemon(id));
    return forkJoin(requests);
  }

  // Utilidades
  extractIdFromUrl(url: string): number {
    const matches = url.match(/\/(\d+)\/$/);
    return matches ? parseInt(matches[1], 10) : 0;
  }

  getPokemonImageUrl(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  formatPokemonName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  getPokemonTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC'
    };
    
    return colors[type] || '#68A090'; // cor padrão se não encontrar
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheKeys = [];
    
    if (this.storageAvailable) {
      try {
        // Limpar apenas os dados de Pokémon do localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('pokemon_') || key.startsWith('species_') || key.startsWith('list_') || key.startsWith('type_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn('Erro ao limpar cache:', e);
      }
    }
  }
}