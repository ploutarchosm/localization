import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { groupBy, reduce } from 'lodash';
import { TranslationService } from '../services/translation.service';

@ApiTags('Translations')
@Controller('translations')
export class AppTranslationListController {
  constructor(private readonly translationService: TranslationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all translations and groupBy group' })
  async translate(@Query('lang') lang: string) {
    const translations =
      await this.translationService.translateApplication(lang);

    return reduce(
      groupBy(translations, 'group'),
      (o, v, k) => {
        o[k] = v.reduce((a, b) => ((a[b.key] = b.value), a), {});
        return o;
      },
      {},
    );
  }
}
