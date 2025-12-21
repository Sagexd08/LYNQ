import { Controller, Get } from '@nestjs/common';
import { Registry, collectDefaultMetrics } from 'prom-client';

const register = new Registry();
collectDefaultMetrics({ register });

@Controller()
export class MetricsController {
  @Get('metrics')
  async metrics(): Promise<string> {
    return await register.metrics();
  }
}
