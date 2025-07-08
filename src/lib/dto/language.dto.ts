import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateLanguageDto {
  @ApiProperty({
    minimum: 2,
    maximum: 30,
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Language name is required' })
  @Length(2, 30, {
    message: 'Language name must be between 2 and 30 characters',
  })
  name: string;

  @ApiProperty({
    required: true,
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @IsNotEmpty({ message: 'Language code is required' })
  @Matches(/^[a-z]{2}$/, {
    message:
      'Language code must be exactly 2 letters lowercase (e.g., en, fr, es)',
  })
  code: string;
}

export class UpdateLanguageDto extends CreateLanguageDto {
  @ApiProperty()
  @IsDefined()
  @IsMongoId()
  _id: string;
}
