import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined, IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTranslationDTO {
  @ApiProperty({
    required: true,
    maxLength: 50,
  })
  @IsDefined()
  @IsString()
  @MaxLength(50)
  group: string;

  @ApiProperty({
    required: true,
    maxLength: 50,
  })
  @IsDefined()
  @IsString()
  @MaxLength(50)
  key: string;

  @ApiProperty({
    required: true,
    maxLength: 2,
    minLength: 2,
  })
  @IsDefined()
  @IsString()
  @Matches(/^[a-z]{2}$/, {
    message:
      'Language code must be exactly 2 letters lowercase (e.g., en, fr, es)',
  })
  language: string;

  @ApiProperty()
  @IsString()
  value: string;
}

export class TranslationSingleRequestParamsModel {
  @ApiProperty()
  @IsString()
  @IsOptional()
  group: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  key: string;
}


export class TranslationUpdateDto {
  @ApiProperty({
    description: 'Translation values for different languages',
    example: {
      'en': 'Hello',
      'es': 'Hola',
      'fr': 'Bonjour'
    },
    additionalProperties: {
      type: 'string'
    }
  })
  @IsObject()
  translations: { [key: string]: string };
}
