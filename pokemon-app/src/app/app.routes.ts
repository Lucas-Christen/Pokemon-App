import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'pokemon/:id',
    loadComponent: () => import('./pages/pokemon-detail/pokemon-detail.page').then(m => m.PokemonDetailPage)
  },
  {
    path: 'favorites',
    loadComponent: () => import('./pages/favorites/favorites.page').then(m => m.FavoritesPage)
  },
  {
    path: 'webhooks',
    loadComponent: () => import('./pages/webhooks/webhooks.page').then(m => m.WebhooksPage)
  }
];
