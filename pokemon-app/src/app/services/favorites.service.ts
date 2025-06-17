// src/app/services/favorites.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FavoritePokemon } from '../models/pokemon.interface';
import { WebhookService } from './webhook.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'pokemon_favorites';
  private favoritesSubject = new BehaviorSubject<FavoritePokemon[]>([]);
  private favoritesMap = new Map<number, FavoritePokemon>(); // Cache para acesso rápido
  
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private webhookService: WebhookService) {
    this.loadFavorites();
  }

  // Carregar favoritos do localStorage
  private loadFavorites(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const favorites = JSON.parse(stored).map((fav: any) => ({
          ...fav,
          dateAdded: new Date(fav.dateAdded)
        }));
        
        // Atualizar o subject e o mapa de cache
        this.favoritesSubject.next(favorites);
        this.updateFavoritesMap(favorites);
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      this.favoritesSubject.next([]);
      this.favoritesMap.clear();
    }
  }

  // Atualizar o mapa de cache
  private updateFavoritesMap(favorites: FavoritePokemon[]): void {
    this.favoritesMap.clear();
    favorites.forEach(fav => {
      this.favoritesMap.set(fav.id, fav);
    });
  }

  // Salvar favoritos no localStorage
  private saveFavorites(favorites: FavoritePokemon[]): void {
    try {
      // Usar requestAnimationFrame para não bloquear a UI
      requestAnimationFrame(() => {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      });
      
      this.favoritesSubject.next(favorites);
      this.updateFavoritesMap(favorites);
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
    }
  }

  // Obter lista de favoritos
  getFavorites(): Observable<FavoritePokemon[]> {
    return this.favorites$;
  }

  // Obter favoritos síncronos
  getFavoritesSync(): FavoritePokemon[] {
    return this.favoritesSubject.value;
  }

  // Adicionar aos favoritos
  addToFavorites(pokemon: FavoritePokemon): boolean {
    // Verificar se já está nos favoritos usando o mapa (mais rápido)
    if (this.favoritesMap.has(pokemon.id)) {
      return false;
    }

    const newFavorite: FavoritePokemon = {
      ...pokemon,
      dateAdded: new Date()
    };

    const updatedFavorites = [...this.getFavoritesSync(), newFavorite];
    this.saveFavorites(updatedFavorites);
    
    // Disparar evento de webhook
    setTimeout(() => {
      this.webhookService.triggerEvent(
        this.webhookService.EVENT_TYPES.FAVORITE_ADDED,
        { pokemon: newFavorite }
      );
    }, 0);
    
    return true;
  }

  // Remover dos favoritos
  removeFromFavorites(pokemonId: number): boolean {
    // Verificar se existe no mapa primeiro (mais rápido)
    if (!this.favoritesMap.has(pokemonId)) {
      return false;
    }
    
    const pokemonToRemove = this.favoritesMap.get(pokemonId);
    const currentFavorites = this.getFavoritesSync();
    const updatedFavorites = currentFavorites.filter(fav => fav.id !== pokemonId);
    
    this.saveFavorites(updatedFavorites);
    
    // Disparar evento de webhook de forma assíncrona
    if (pokemonToRemove) {
      setTimeout(() => {
        this.webhookService.triggerEvent(
          this.webhookService.EVENT_TYPES.FAVORITE_REMOVED,
          { pokemon: pokemonToRemove }
        );
      }, 0);
    }
    
    return true;
  }

  // Verificar se é favorito (usando o mapa para performance)
  isFavorite(pokemonId: number): boolean {
    return this.favoritesMap.has(pokemonId);
  }

  // Toggle favorito
  toggleFavorite(pokemon: FavoritePokemon): boolean {
    if (this.isFavorite(pokemon.id)) {
      return this.removeFromFavorites(pokemon.id);
    } else {
      return this.addToFavorites(pokemon);
    }
  }

  // Obter contagem de favoritos
  getFavoritesCount(): number {
    return this.favoritesMap.size;
  }

  // Limpar todos os favoritos
  clearAllFavorites(): void {
    const currentFavorites = this.getFavoritesSync();
    this.saveFavorites([]);
    
    // Disparar evento para cada favorito removido de forma assíncrona
    setTimeout(() => {
      currentFavorites.forEach(favorite => {
        this.webhookService.triggerEvent(
          this.webhookService.EVENT_TYPES.FAVORITE_REMOVED,
          { pokemon: favorite }
        );
      });
    }, 0);
  }

  // Obter favoritos ordenados
  getFavoritesSorted(sortBy: 'name' | 'dateAdded' = 'dateAdded'): FavoritePokemon[] {
    const favorites = this.getFavoritesSync();
    
    return favorites.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return b.dateAdded.getTime() - a.dateAdded.getTime();
      }
    });
  }

  // Buscar favorito por ID (usando o mapa para performance)
  getFavoriteById(id: number): FavoritePokemon | undefined {
    return this.favoritesMap.get(id);
  }

  // Exportar favoritos (para backup)
  exportFavorites(): string {
    return JSON.stringify(this.getFavoritesSync(), null, 2);
  }

  // Importar favoritos (de backup)
  importFavorites(favoritesJson: string): boolean {
    try {
      const favorites = JSON.parse(favoritesJson);
      if (Array.isArray(favorites)) {
        const validFavorites = favorites.map(fav => ({
          ...fav,
          dateAdded: new Date(fav.dateAdded)
        }));
        this.saveFavorites(validFavorites);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao importar favoritos:', error);
      return false;
    }
  }
}