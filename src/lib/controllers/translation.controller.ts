import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  Permissions,
  AuthorizedGuard,
  PermissionsGuard,
  SECURITY_API_TOKEN_HEADER_KEY,
  TRANSLATOR,
  CListQuery,
} from '@ploutos/common';
import { TranslationService } from '../services/translation.service';
import { CreateTranslationDTO } from '../dto/translation.dto';
import * as deepl from 'deepl-node';

@ApiTags('Translations')
@ApiSecurity(SECURITY_API_TOKEN_HEADER_KEY)
@UseGuards(AuthorizedGuard, PermissionsGuard)
@Controller('common/translations')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new translation' })
  @Permissions(TRANSLATOR)
  async create(
    @Body(new ValidationPipe({ transform: true }))
    data: CreateTranslationDTO,
  ) {
    return this.translationService.create(data);
  }

  @Post(':targetLangCode')
  @ApiOperation({ summary: 'Translate using DeepL.' })
  @Permissions(TRANSLATOR)
  async createTranslation(
    @Body(new ValidationPipe({ transform: true }))
    data: CreateTranslationDTO,
    @Query('targetLangCode') targetLangCode: deepl.TargetLanguageCode,
  ) {
    return this.translationService.translateDeepL(data, targetLangCode);
  }

  @Get()
  @Permissions(TRANSLATOR)
  @ApiOperation({ summary: 'Get the list of translations' })
  async list(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )
    params: CListQuery,
  ) {
    const [translations, count] = await this.translationService.list(
      params.take,
      params.skip,
      params.search,
    );
    return {
      data: translations,
      count: count,
    };
  }
}
