import request from 'supertest';
import './setup'; // Import setup to ensure mocks are applied
import { app } from './setup';
import * as metrics from '../utils/metrics';

describe('Metrics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset metrics before each test
    metrics.resetMetrics();
  });

  describe('GET /api/metrics', () => {
    it('should return Prometheus metrics', async () => {
      // Track some metrics to ensure there's data
      metrics.trackUserRegistration();
      metrics.trackUserLogin();

      const response = await request(app).get('/api/metrics');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('user_registrations_total');
      expect(response.text).toContain('user_logins_total');
    });

    it('should include HTTP request metrics after making requests', async () => {
      // Make a test request to generate HTTP metrics
      await request(app).get('/api/health');

      const response = await request(app).get('/api/metrics');

      expect(response.status).toBe(200);
      expect(response.text).toContain('http_requests_total');
      expect(response.text).toContain('http_request_duration_seconds');
    });
  });

  describe('GET /api/metrics/health', () => {
    it('should return metrics health status', async () => {
      const response = await request(app).get('/api/metrics/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('OK');
      expect(response.body.data.metrics_endpoint).toBe('/api/metrics');
    });
  });

  describe('Metrics tracking functions', () => {
    it('should track user registrations', async () => {
      metrics.trackUserRegistration();
      
      // Verify the metric was incremented
      const metricsData = await metrics.getMetrics();
      const registrationMetric = metricsData.find(m => m.name === 'user_registrations_total');
      expect(registrationMetric).toBeDefined();
    });

    it('should track user logins', async () => {
      metrics.trackUserLogin();
      
      const metricsData = await metrics.getMetrics();
      const loginMetric = metricsData.find(m => m.name === 'user_logins_total');
      expect(loginMetric).toBeDefined();
    });

    it('should track error submissions', async () => {
      metrics.trackErrorSubmission('test-app');
      
      const metricsData = await metrics.getMetrics();
      const errorMetric = metricsData.find(m => m.name === 'error_submissions_total');
      expect(errorMetric).toBeDefined();
    });

    it('should track solution submissions', async () => {
      metrics.trackSolutionSubmission('ERR001');
      
      const metricsData = await metrics.getMetrics();
      const solutionMetric = metricsData.find(m => m.name === 'solutions_submitted_total');
      expect(solutionMetric).toBeDefined();
    });

    it('should track solution acceptances', async () => {
      metrics.trackSolutionAcceptance('ERR001');
      
      const metricsData = await metrics.getMetrics();
      const acceptanceMetric = metricsData.find(m => m.name === 'solutions_accepted_total');
      expect(acceptanceMetric).toBeDefined();
    });

    it('should track database queries', async () => {
      const duration = 0.1; // 100ms
      
      metrics.trackDatabaseQuery('find', 'User', duration);
      
      const metricsData = await metrics.getMetrics();
      const queryMetric = metricsData.find(m => m.name === 'database_queries_total');
      const durationMetric = metricsData.find(m => m.name === 'database_query_duration_seconds');
      
      expect(queryMetric).toBeDefined();
      expect(durationMetric).toBeDefined();
    });

    it('should track database connection errors', async () => {
      metrics.trackDatabaseConnectionError();
      
      const metricsData = await metrics.getMetrics();
      const errorMetric = metricsData.find(m => m.name === 'database_connection_errors_total');
      expect(errorMetric).toBeDefined();
    });

    it('should track cache hits and misses', async () => {
      metrics.trackCacheHit('user:123');
      metrics.trackCacheMiss('user:456');
      
      const metricsData = await metrics.getMetrics();
      const hitMetric = metricsData.find(m => m.name === 'cache_hits_total');
      const missMetric = metricsData.find(m => m.name === 'cache_misses_total');
      
      expect(hitMetric).toBeDefined();
      expect(missMetric).toBeDefined();
    });
  });

  describe('Metrics middleware', () => {
    it('should track HTTP requests', async () => {
      // Make a request to trigger the middleware
      await request(app).get('/api/health');
      
      // Check if metrics were recorded
      const response = await request(app).get('/api/metrics');
      
      expect(response.text).toContain('http_requests_total{method="GET",route="/health",status="200"}');
      expect(response.text).toContain('http_request_duration_seconds');
    });

    it('should track different HTTP status codes', async () => {
      // Make a request that will 404
      await request(app).get('/nonexistent-route');
      
      const response = await request(app).get('/api/metrics');
      
      expect(response.text).toContain('http_requests_total{method="GET",route="/nonexistent-route",status="404"}');
    });
  });
});