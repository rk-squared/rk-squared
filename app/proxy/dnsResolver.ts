import * as dns from 'dns';

import { logger } from '../utils/logger';

export class DnsResolver {
  private cache: Map<string, string> = new Map<string, string>();

  resolve(host: string): string | Promise<string> {
    const cachedIpAddress = this.cache.get(host);
    if (cachedIpAddress) {
      return cachedIpAddress;
    }

    return new Promise((resolve, reject) => {
      logger.debug(`DNS: resolving ${host}`);
      dns.resolve4(host, { ttl: true }, (err: Error, ipAddresses: dns.RecordWithTtl[]) => {
        if (err) {
          logger.warn(`DNS: failed: ${err}`);
          reject(err);
          return;
        }
        logger.debug(`DNS: resolved ${host} to ${ipAddresses.map(i => i.address).join(' ')}`);
        if (!ipAddresses.length) {
          reject(new Error(`Failed to resolve ${host}`));
          return;
        }

        const { address, ttl } = ipAddresses[0];
        logger.debug(`DNS: caching ${host} with TTL ${ttl}`);
        this.cache.set(host, address);

        setTimeout(() => {
          this.cache.delete(host);
          logger.debug(`DNS: expiring ${host} from cache`);
        }, ttl * 1000);

        resolve(address);
      });
    });
  }
}
