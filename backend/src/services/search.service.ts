import prisma from './database.service';
import { SearchFilters, SearchSuggestion } from '../types/search.types';

export class SearchService {
  async search(query: string, filters: SearchFilters, userId?: string) {
    const startTime = Date.now();
    const normalizedQuery = this.normalizeQuery(query);
    
    // Build where clause
    const where: any = {
      OR: [
        { code: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Apply filters
    if (filters.applicationId) {
      where.applicationId = filters.applicationId;
    }
    if (filters.categoryId) {
      where.application = {
        categoryId: filters.categoryId,
      };
    }
    if (filters.severity) {
      where.severity = filters.severity;
    }
    if (filters.hasSolutions !== undefined) {
      where.solutions = filters.hasSolutions ? { some: {} } : { none: {} };
    }

    // Execute search with pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [errors, totalCount] = await Promise.all([
      prisma.errorCode.findMany({
        where,
        include: {
          application: {
            include: {
              category: true,
            },
          },
          solutions: {
            where: { isVerified: true },
            orderBy: { score: 'desc' },
            take: 1,
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
          _count: {
            select: {
              solutions: true,
            },
          },
        },
        orderBy: [
          { viewCount: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.errorCode.count({ where }),
    ]);

    const searchDuration = Date.now() - startTime;
    
    // Track search analytics (only if userId is provided)
    if (userId) {
      await this.trackSearchAnalytics({
        query,
        normalizedQuery,
        filters,
        resultCount: totalCount,
        userId,
        searchDuration,
      });
    }

    return {
      errors,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async getSuggestions(query: string, limit: number = 5): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const normalizedQuery = this.normalizeQuery(query);

    // Get suggestions from error codes
    const errorSuggestions = await prisma.errorCode.findMany({
      where: {
        OR: [
          { code: { startsWith: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        code: true,
        title: true,
        application: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      orderBy: {
        viewCount: 'desc',
      },
    });

    // Get popular searches
    const popularSearches = await prisma.searchAnalytics.groupBy({
      by: ['normalizedQuery'],
      where: {
        normalizedQuery: {
          contains: normalizedQuery,
        },
      },
      _count: {
        normalizedQuery: true,
      },
      orderBy: {
        _count: {
          normalizedQuery: 'desc',
        },
      },
      take: 3,
    });

    const suggestions: SearchSuggestion[] = [
      ...errorSuggestions.map(error => ({
        type: 'error' as const,
        value: `${error.application.name}: ${error.code}`,
        label: error.title,
      })),
      ...popularSearches.map(search => ({
        type: 'popular' as const,
        value: search.normalizedQuery,
        label: `Popular search: ${search.normalizedQuery}`,
      })),
    ];

    return suggestions.slice(0, limit);
  }

  async getSearchHistory(userId: string, limit: number = 10) {
    return await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async saveSearchHistory(userId: string, query: string, filters: SearchFilters, resultCount: number) {
    return await prisma.searchHistory.create({
      data: {
        userId,
        query,
        filters: filters as any,
        resultCount,
      },
    });
  }

  async deleteSearchHistory(userId: string, searchId: string) {
    return await prisma.searchHistory.deleteMany({
      where: {
        id: searchId,
        userId,
      },
    });
  }

  async clearSearchHistory(userId: string) {
    return await prisma.searchHistory.deleteMany({
      where: { userId },
    });
  }

  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private async trackSearchAnalytics(data: {
    query: string;
    normalizedQuery: string;
    filters: SearchFilters;
    resultCount: number;
    userId?: string;
    searchDuration: number;
  }) {
    try {
      const analyticsData: any = {
        query: data.query,
        normalizedQuery: data.normalizedQuery,
        filters: data.filters as any,
        resultCount: data.resultCount,
        searchDuration: data.searchDuration,
      };
      
      // Only include userId if it's defined
      if (data.userId) {
        analyticsData.userId = data.userId;
      }
      
      await prisma.searchAnalytics.create({
        data: analyticsData,
      });
    } catch (error) {
      console.error('Failed to track search analytics:', error);
    }
  }

  async getSearchTrends(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await prisma.searchAnalytics.groupBy({
      by: ['normalizedQuery'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        normalizedQuery: true,
      },
      orderBy: {
        _count: {
          normalizedQuery: 'desc',
        },
      },
      take: 20,
    });

    return trends.map(trend => ({
      query: trend.normalizedQuery,
      count: trend._count.normalizedQuery,
    }));
  }
}

export const searchService = new SearchService();
