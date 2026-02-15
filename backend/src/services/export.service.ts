import prisma from './database.service';

export type ExportFormat = 'json' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  includeMetadata?: boolean;
}

export class ExportService {
  async exportErrors(options: ExportOptions): Promise<{ data: string; filename: string; contentType: string }> {
    const where: any = {};
    
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const errors = await prisma.errorCode.findMany({
      where,
      include: {
        application: {
          include: {
            category: true,
          },
        },
        solutions: {
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
      },
      orderBy: { createdAt: 'desc' },
    });

    if (options.format === 'csv') {
      return this.convertToCSV(errors, 'errors');
    }

    return {
      data: JSON.stringify(errors, null, 2),
      filename: `errors_export_${Date.now()}.json`,
      contentType: 'application/json',
    };
  }

  async exportSolutions(options: ExportOptions): Promise<{ data: string; filename: string; contentType: string }> {
    const where: any = {};
    
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    if (options.userId) {
      where.authorId = options.userId;
    }

    const solutions = await prisma.solution.findMany({
      where,
      include: {
        error: {
          include: {
            application: true,
          },
        },
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (options.format === 'csv') {
      return this.convertToCSV(solutions, 'solutions');
    }

    return {
      data: JSON.stringify(solutions, null, 2),
      filename: `solutions_export_${Date.now()}.json`,
      contentType: 'application/json',
    };
  }

  async exportUserData(userId: string): Promise<{ data: string; filename: string; contentType: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        solutions: {
          include: {
            error: {
              include: {
                application: true,
              },
            },
          },
        },
        bookmarks: {
          include: {
            solution: {
              include: {
                error: {
                  include: {
                    application: true,
                  },
                },
              },
            },
          },
        },
        votes: {
          include: {
            solution: {
              include: {
                error: {
                  include: {
                    application: true,
                  },
                },
              },
            },
          },
        },
        searchHistory: true,
        achievements: {
          include: {
            badge: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove sensitive information
    const { passwordHash, ...userData } = user as any;

    return {
      data: JSON.stringify(userData, null, 2),
      filename: `user_data_export_${userId}_${Date.now()}.json`,
      contentType: 'application/json',
    };
  }

  async exportAnalytics(options: ExportOptions): Promise<{ data: string; filename: string; contentType: string }> {
    const where: any = {};
    
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [searchAnalytics, errorStats, userStats] = await Promise.all([
      prisma.searchAnalytics.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.errorCode.groupBy({
        by: ['severity'],
        _count: { id: true },
      }),
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _count: { id: true },
      }),
    ]);

    const data = {
      searchAnalytics,
      errorStats,
      userStats,
      generatedAt: new Date().toISOString(),
    };

    if (options.format === 'csv') {
      // For CSV, export just the search analytics as it's tabular
      return this.convertToCSV(searchAnalytics, 'analytics');
    }

    return {
      data: JSON.stringify(data, null, 2),
      filename: `analytics_export_${Date.now()}.json`,
      contentType: 'application/json',
    };
  }

  private convertToCSV(data: any[], filename: string): { data: string; filename: string; contentType: string } {
    if (data.length === 0) {
      return {
        data: '',
        filename: `${filename}.csv`,
        contentType: 'text/csv',
      };
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV rows
    const rows = data.map(item => {
      return headers.map(header => {
        const value = item[header];
        // Handle arrays and objects
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Escape quotes and wrap in quotes if needed
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    return {
      data: csv,
      filename: `${filename}_${Date.now()}.csv`,
      contentType: 'text/csv',
    };
  }

  async getExportStats(): Promise<{
    totalErrors: number;
    totalSolutions: number;
    totalUsers: number;
    totalApplications: number;
    totalCategories: number;
    dateRange: { earliest: Date | null; latest: Date | null };
  }> {
    const [
      totalErrors,
      totalSolutions,
      totalUsers,
      totalApplications,
      totalCategories,
      errorDateRange,
    ] = await Promise.all([
      prisma.errorCode.count(),
      prisma.solution.count(),
      prisma.user.count(),
      prisma.application.count(),
      prisma.category.count(),
      prisma.errorCode.aggregate({
        _min: { createdAt: true },
        _max: { createdAt: true },
      }),
    ]);

    return {
      totalErrors,
      totalSolutions,
      totalUsers,
      totalApplications,
      totalCategories,
      dateRange: {
        earliest: errorDateRange._min.createdAt,
        latest: errorDateRange._max.createdAt,
      },
    };
  }
}

export const exportService = new ExportService();
