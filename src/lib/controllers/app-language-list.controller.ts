import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LanguageService } from '../services/language.service';

@ApiTags('Languages')
@Controller('languages')
export class AppLanguageListController {
  constructor(private readonly languageService: LanguageService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all supported language for non-authentication users.',
  })
  async get() {
    return this.languageService.getSupportedLanguages();
  }
}
