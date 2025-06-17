// src/app/services/pokemon.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { 
  PokemonListResponse, 
  Pokemon, 
  PokemonSpecies, 
  PokemonBasic 
} from '../models/pokemon.interface';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private readonly baseUrl = 'https://pokeapi.co/api/v2';
  private cache = new Map<string, any>();

  constructor(private http: HttpClient) {}

  // Buscar lista de pokemons com paginação
  getPokemonList(limit: number = 20, offset: number = 0): Observable<PokemonListResponse> {
    const cacheKey = `list_${limit}_${offset}`;
    
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    return this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon?limit=${limit}&offset=${offset}`)
      .pipe(
        map(response => {
          this.cache.set(cacheKey, response);
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
    
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    return this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${idOrName}`)
      .pipe(
        map(pokemon => {
          this.cache.set(cacheKey, pokemon);
          return pokemon;
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
      return of(this.cache.get(cacheKey));
    }

    return this.http.get<PokemonSpecies>(`${this.baseUrl}/pokemon-species/${idOrName}`)
      .pipe(
        map(species => {
          this.cache.set(cacheKey, species);
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
    return this.http.get<any>(`${this.baseUrl}/type/${type}`)
      .pipe(
        map(response => response.pokemon.map((p: any) => p.pokemon)),
        catchError(error => {
          console.error('Erro ao buscar pokemons por tipo:', error);
          throw error;
        })
      );
  }

  // Buscar pokemon por nome (busca)
  searchPokemon(query: string): Observable<Pokemon | null> {
    if (!query || query.length < 2) {
      return of(null);
    }

    return this.getPokemon(query.toLowerCase()).pipe(
      catchError(() => of(null))
    );
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
    return colors[type] || '#68A090';
  }

  clearCache(): void {
    this.cache.clear();
  }
}