import { TestBed } from '@angular/core/testing';
import { FavoritesService } from './favorites.service';
import { FavoritePokemon } from '../models/pokemon.interface';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let mockPokemon: FavoritePokemon;

  // Mock para localStorage
  let localStorageMock: {
    getItem: jasmine.Spy;
    setItem: jasmine.Spy;
  };

  beforeEach(() => {
    // Criar mock para localStorage
    localStorageMock = {
      getItem: jasmine.createSpy('getItem').and.returnValue(null),
      setItem: jasmine.createSpy('setItem')
    };

    // Substituir localStorage com o mock
    spyOn(localStorage, 'getItem').and.callFake(localStorageMock.getItem);
    spyOn(localStorage, 'setItem').and.callFake(localStorageMock.setItem);

    TestBed.configureTestingModule({
      providers: [FavoritesService]
    });
    
    service = TestBed.inject(FavoritesService);

    // Dados de teste
    mockPokemon = {
      id: 25,
      name: 'pikachu',
      image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
      types: ['electric'],
      dateAdded: new Date()
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a pokemon to favorites', () => {
    // Verificar estado inicial
    expect(service.getFavoritesSync().length).toBe(0);
    
    // Adicionar aos favoritos
    service.toggleFavorite(mockPokemon);
    
    // Verificar se foi adicionado
    expect(service.getFavoritesSync().length).toBe(1);
    expect(service.getFavoritesSync()[0].id).toBe(mockPokemon.id);
    
    // Verificar se localStorage foi atualizado
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should remove a pokemon from favorites when toggled twice', () => {
    // Adicionar aos favoritos
    service.toggleFavorite(mockPokemon);
    expect(service.getFavoritesSync().length).toBe(1);
    
    // Remover dos favoritos
    service.toggleFavorite(mockPokemon);
    expect(service.getFavoritesSync().length).toBe(0);
  });

  it('should check if a pokemon is favorite', () => {
    // Inicialmente não é favorito
    expect(service.isFavorite(mockPokemon.id)).toBeFalse();
    
    // Adicionar aos favoritos
    service.toggleFavorite(mockPokemon);
    
    // Agora deve ser favorito
    expect(service.isFavorite(mockPokemon.id)).toBeTrue();
  });

  it('should emit updated favorites when changes occur', (done) => {
    // Inscrever no observable de favoritos
    service.getFavorites().subscribe((favorites: FavoritePokemon[]) => {
      // Verificar se a lista contém o Pokémon adicionado
      expect(favorites.length).toBe(1);
      expect(favorites[0].id).toBe(mockPokemon.id);
      done();
    });
    
    // Adicionar aos favoritos
    service.toggleFavorite(mockPokemon);
  });
}); 