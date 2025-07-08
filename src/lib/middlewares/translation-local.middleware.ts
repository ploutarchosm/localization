import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { getErrorMessage, getErrorStack } from '@ploutos/common';
import { NS_LOCALE } from '../constants/ng-locale';
import * as clsHooked from 'cls-hooked';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TranslationLocaleMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TranslationLocaleMiddleware.name);

  constructor(private config: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      const clsNamespace = clsHooked.getNamespace(
        this.config.get<string>('APP_NAMESPACE'),
      );

      clsNamespace.run(() => {
        try {
          const locale = (req.headers['x-data-locale'] as string) || 'en';
          clsNamespace.set(NS_LOCALE, locale);
          next();
        } catch (innerError) {
          this.logger.warn(
            `Failed to set locale in context: ${getErrorMessage(innerError)}`,
          );
          next(); // Continue request processing even if locale setting fails
        }
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const errorStack = getErrorStack(error);
      this.logger.error(
        `Translation locale middleware error: ${errorMessage}`,
        errorStack,
      );
      next(); // Continue request processing even if a context system fails
    }
  }
}
