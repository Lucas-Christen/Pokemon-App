// src/app/services/favorites.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FavoritePokemon } from '../models/pokemon.interface';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'pokemon_favorites';
  private favoritesSubject = new BehaviorSubject<FavoritePokemon[]>([]);
  
  public favorites$ = this.favoritesSubject.asObservable();

  constructor() {
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
        this.favoritesSubject.next(favorites);
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      this.favoritesSubject.next([]);
    }
  }

  // Salvar favoritos no localStorage
  private saveFavorites(favorites: FavoritePokemon[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      this.favoritesSubject.next(favorites);
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
    const currentFavorites = this.getFavoritesSync();
    
    // Verificar se já está nos favoritos
    if (this.isFavorite(pokemon.id)) {
      return false;
    }

    const newFavorite: FavoritePokemon = {
      ...pokemon,
      dateAdded: new Date()
    };

    const updatedFavorites = [...currentFavorites, newFavorite];
    this.saveFavorites(updatedFavorites);
    return true;
  }

  // Remover dos favoritos
  removeFromFavorites(pokemonId: number): boolean {
    const currentFavorites = this.getFavoritesSync();
    const updatedFavorites = currentFavorites.filter(fav => fav.id !== pokemonId);
    
    if (updatedFavorites.length !== currentFavorites.length) {
      this.saveFavorites(updatedFavorites);
      return true;
    }
    return false;
  }

  // Verificar se é favorito
  isFavorite(pokemonId: number): boolean {
    return this.getFavoritesSync().some(fav => fav.id === pokemonId);
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
    return this.getFavoritesSync().length;
  }

  // Limpar todos os favoritos
  clearAllFavorites(): void {
    this.saveFavorites([]);
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

  // Buscar favorito por ID
  getFavoriteById(id: number): FavoritePokemon | undefined {
    return this.getFavoritesSync().find(fav => fav.id === id);
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