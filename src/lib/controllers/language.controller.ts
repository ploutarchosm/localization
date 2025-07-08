import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Put,
  Query,
  Param,
  BadRequestException,
  Delete,
  DefaultValuePipe,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  ADMIN,
  AuthorizedGuard,
  CleanObjectIdPipe,
  PermissionsGuard,
  SECURITY_API_TOKEN_HEADER_KEY,
  ValidateEmptyObjectPipe,
  ValidateObjectIdPipe,
  ValidatePaginationPipe,
  ValidateSystemRepositoryModelPipe,
} from '@ploutos/common';
import { LanguageService } from '../services/language.service';
import { CreateLanguageDto, UpdateLanguageDto } from '../dto/language.dto';
import { Permissions } from '@ploutos/common';
import { Types } from 'mongoose';
import { assign } from 'lodash';

@ApiTags('Languages')
@ApiSecurity(SECURITY_API_TOKEN_HEADER_KEY)
@UseGuards(AuthorizedGuard, PermissionsGuard)
@Controller('common/language')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  /**
   * @description Create system language
   * @param dto
   */
  @Post()
  @ApiOperation({ summary: 'Create new language.' })
  @Permissions(ADMIN)
  async create(
    @Body(
      ValidateEmptyObjectPipe,
      new ValidationPipe({
        skipMissingProperties: true,
        whitelist: true,
      }),
      CleanObjectIdPipe,
    )
    dto: CreateLanguageDto,
  ) {
    return this.languageService.create(dto);
  }

  /**
   * @description Read system language by id
   * @param id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Read language by id.' })
  @Permissions(ADMIN)
  async read(@Param('id', ValidateObjectIdPipe) id: string) {
    return await this.languageService.read(id);
  }

  /**
   * @description Update system language by id
   * @param dto
   */
  @Put()
  @ApiOperation({ summary: 'Update language by id.' })
  @Permissions(ADMIN)
  async update(
    @Body(
      new ValidationPipe({
        skipMissingProperties: true,
        whitelist: true,
      }),
      ValidateEmptyObjectPipe,
    )
    dto: UpdateLanguageDto,
  ) {
    // Validate ObjectId format before proceeding
    if (!Types.ObjectId.isValid(dto._id)) {
      throw new BadRequestException(`Invalid ObjectId format: ${dto._id}`);
    }
    // Let NotFoundException bubble up naturally - it becomes 404
    const item = await this.languageService.read(dto._id);
    assign(item, dto);
    return this.languageService.update(item);
  }

  /**
   * @description Delete system language by id
   * @param id
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete language by id.' })
  @Permissions(ADMIN)
  async delete(
    @Param('id', ValidateObjectIdPipe, ValidateSystemRepositoryModelPipe)
    id: string,
  ) {
    return this.languageService.delete(id);
  }

  /**
   * @description Get system supported language.
   * @param take
   * @param skip
   * @param search
   */
  @Get()
  @ApiOperation({ summary: 'Get supported language.' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Permissions(ADMIN)
  async list(
    @Query(
      'take',
      new DefaultValuePipe(10),
      ParseIntPipe,
      ValidatePaginationPipe,
    )
    take: number,
    @Query(
      'skip',
      new DefaultValuePipe(0),
      ParseIntPipe,
      ValidatePaginationPipe,
    )
    skip: number,
    @Query('search') search: string,
  ) {
    return this.languageService.list(skip, take, search);
  }
}
