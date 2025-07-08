import { IsNotEmpty, IsString, validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class LocalizationConfigDto {
  @IsString()
  @IsNotEmpty({ message: 'DEEPL_API is required for Localization module' })
  apiKey: string;
}

export function validateLocalizationConfig(
  config: Record<string, any>,
): LocalizationConfigDto {
  const validatedConfig = plainToClass(LocalizationConfigDto, config);
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints || {}).join(', '))
      .join('; ');
    throw new Error(
      `Localization configuration validation failed: ${errorMessages}`,
    );
  }

  return validatedConfig;
}
