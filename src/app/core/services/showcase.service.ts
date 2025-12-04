import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from './api.service';
import { Article } from '../models/article.model';

@Injectable({
  providedIn: 'root'
})
export class ShowcaseService {
  private currentGroupId = signal<string | null>(null);

  constructor(private apiService: ApiService) {}

  setCurrentGroup(groupId: string) {
    this.currentGroupId.set(groupId);
  }

  getCurrentGroupId(): string | null {
    return this.currentGroupId();
  }

  /**
   * Obtener artículos del aparador del grupo
   */
  getShowcaseArticles(groupId?: string): Observable<Article[]> {
    const id = groupId || this.currentGroupId();
    console.log('getShowcaseArticles id:', id);
    if (!id) {
      return of([]);
    }
    return this.apiService.get<Article[]>('/articles', {
      groupId: id,
      inShowcase: true
    });
  }

  /**
   * Buscar artículos en el aparador
   */
  searchArticles(query: string, groupId?: string): Observable<Article[]> {
    const id = groupId || this.currentGroupId();
    if (!id) {
      return of([]);
    }
    return this.apiService.get<Article[]>('/articles', {
      groupId: id,
      inShowcase: true,
      search: query
    });
  }

  /**
   * Obtener artículos por categoría
   */
  getArticlesByCategory(category: string, groupId?: string): Observable<Article[]> {
    const id = groupId || this.currentGroupId();
    if (!id) {
      return of([]);
    }
    return this.apiService.get<Article[]>('/articles', {
      groupId: id,
      inShowcase: true,
      category
    });
  }

  /**
   * Obtener detalle de un artículo
   */
  getArticleById(articleId: string): Observable<Article> {
    return this.apiService.get<Article>(`/articles/${articleId}`);
  }
}

