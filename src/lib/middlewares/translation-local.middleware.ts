import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { getErrorMessage, getErrorStack } from '@ploutos/common';
import { NS_LOCALE } from '../constants/ng-locale';
import * as clsHooked from 'cls-hooked';
import { AppConfigDto } from '@ploutos/application';

@Injectable()
export class TranslationLocaleMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TranslationLocaleMiddleware.name);

  constructor(
      @Inject('APP_CONFIG') private readonly appConfig: AppConfigDto,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      const clsNamespace = clsHooked.getNamespace(
        this.appConfig.namespace,
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
