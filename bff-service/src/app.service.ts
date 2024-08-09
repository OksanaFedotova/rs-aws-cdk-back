import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';
import * as NodeCache from 'node-cache';

@Injectable()
export class AppService {
  private cache: NodeCache;
  constructor(private configService: ConfigService) {
    this.cache = new NodeCache({ stdTTL: 120 }); // 2 minutes cache expiration
  }

  async handleRequest(req: Request, res: Response): Promise<void> {
    const { method, originalUrl, query, body, headers } = req;
    const recipientName = originalUrl.split('/')[1];
    console.log(originalUrl.split('/')[1]);
    const recipientURL = this.configService.get<string>(
      `${recipientName.toUpperCase()}`,
    );
    console.log(recipientURL);

    if (!recipientURL) {
      res
        .status(HttpStatus.BAD_GATEWAY)
        .json({ error: 'Cannot process request' });
      return;
    }

    try {
      if (recipientName === 'products' && method === 'GET') {
        const cacheKey = `${recipientName}-${JSON.stringify(req.query)}`;
        console.log('Cache key:', cacheKey);
        const cachedResponse = this.cache.get(cacheKey);
        if (cachedResponse) {
          console.log('Using cached response');
          res.status(200).json(cachedResponse);
          return;
        } else {
          console.log('Cache miss, fetching data from external source');
        }
      }

      const authorizationHeader = headers.authorization;
      const axiosConfig: AxiosRequestConfig = {
        method,
        url: `${recipientURL}${originalUrl}`,
        params: query,
        data: method.toUpperCase() === 'GET' ? undefined : body,
        headers: {
          Authorization: authorizationHeader,
        },
      };
      const response = await axios(axiosConfig);
      if (recipientName === 'products' && method === 'GET') {
        const cacheKey = `${recipientName}-${JSON.stringify(req.query)}`;
        console.log('Caching response with key:', cacheKey);
        this.cache.set(cacheKey, response.data);
      }
      res.status(response.status).json(response.data);
    } catch (error) {
      res
        .status(error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response?.data);
    }
  }
}
