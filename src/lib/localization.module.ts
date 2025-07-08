import {
  DynamicModule,
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Translation, TranslationSchema } from './schemas/translation.schema';
import { Language, LanguageSchema } from './schemas/language.schema';
import { TranslationLocaleMiddleware } from './middlewares/translation-local.middleware';
import { AppLanguageListController } from './controllers/app-language-list.controller';
import { GetNsLocaleService } from './services/get-ns-locale.service';
import { LanguageService } from './services/language.service';
import { TranslationService } from './services/translation.service';
import { AppTranslationListController } from './controllers/app-translation-list.controller';
import { TranslationController } from './controllers/translation.controller';
import { ConfigService } from '@nestjs/config';
import {
  LocalizationConfigDto,
  validateLocalizationConfig,
} from './helpers/localization-config.validation';
import { LanguageController } from "./controllers/language.controller";
import { TranslationCombinationController } from "./controllers/translation-combination.controller";

@Module({})
export class LocalizationModule implements NestModule, OnModuleInit {
  private readonly logger = new Logger(LocalizationModule.name);
  private static config: LocalizationConfigDto;

  static forRoot(): DynamicModule {
    return {
      module: LocalizationModule,
      imports: [
        MongooseModule.forFeature([
          { name: Translation.name, schema: TranslationSchema },
          { name: Language.name, schema: LanguageSchema },
        ]),
      ],
      controllers: [
        AppLanguageListController,
        AppTranslationListController,
        LanguageController,
        TranslationController,
        TranslationCombinationController
      ],
      providers: [
        {
          provide: 'LOCALIZATION_CONFIG',
          useFactory: (configService: ConfigService) => {
            // Validate configuration at module initialization
            this.config = validateLocalizationConfig({
              apiKey: configService.get<string>('DEEPL_API'),
            });

            return this.config;
          },
          inject: [ConfigService],
        },
        GetNsLocaleService,
        LanguageService,
        TranslationService,
      ],
      exports: ['LOCALIZATION_CONFIG'],
    };
  }

  onModuleInit() {
    this.logger.log(
      'Localization module initialized with validated configuration',
    );
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TranslationLocaleMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
