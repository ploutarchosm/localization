import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
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
} from '@ploutos/common';
import { TranslationService } from '../services/translation.service';
import { TranslationSingleRequestParamsModel } from '../dto/translation.dto';

@ApiTags('Translations')
@ApiSecurity(SECURITY_API_TOKEN_HEADER_KEY)
@UseGuards(AuthorizedGuard, PermissionsGuard)
@Controller('common/translations/combination')
export class TranslationCombinationController {
  constructor(private readonly translationService: TranslationService) {}

  @Get()
  @ApiOperation({ summary: 'Get the combination of translations' })
  @Permissions(TRANSLATOR)
  async read(
    @Query(new ValidationPipe({ transform: true }))
    params: TranslationSingleRequestParamsModel,
  ) {
    return this.translationService.getCombination(params.group, params.key);
  }

  @Put()
  @ApiOperation({ summary: 'Update the combination of the translation' })
  @Permissions(TRANSLATOR)
  async update(
    @Query(new ValidationPipe({ transform: true }))
    params: TranslationSingleRequestParamsModel,
    @Body() model: { [key: string]: string },
  ) {
    return this.translationService.updateCombination(
      params.group,
      params.key,
      model,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Delete the combination by group/key' })
  @Permissions(TRANSLATOR)
  async delete(
    @Query(new ValidationPipe({ transform: true }))
    params: TranslationSingleRequestParamsModel,
  ) {
    return this.translationService.deleteCombination(params.group, params.key);
  }
}
