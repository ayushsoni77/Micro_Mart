import request from 'supertest';
import app from '../index.js';

describe('Health endpoint', () => {
  it('GET /health should return status 200 with service info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(typeof res.body.status).toBe('string');
    expect(res.body).toHaveProperty('timestamp');
  });
});
