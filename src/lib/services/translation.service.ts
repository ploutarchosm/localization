import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetNsLocaleService } from './get-ns-locale.service';
import { Language } from '../schemas/language.schema';
import { Translation } from '../schemas/translation.schema';
import { CreateTranslationDTO } from '../dto/translation.dto';
import { isEmpty, uniq } from 'lodash';
import * as deepl from 'deepl-node';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private _translator: deepl.Translator;

  constructor(
    @InjectModel(Translation.name)
    private translationModel: Model<Translation>,
    @InjectModel(Language.name)
    private languageModel: Model<Language>,
    private getNsLocaleService: GetNsLocaleService,
    private config: ConfigService
  ) {}

  private get translator(): deepl.Translator {
    if (!this._translator) {
      this._translator = new deepl.Translator(this.config.get<string>('DEEPL_API'));
    }
    return this._translator;
  }

  /**
   * @description - Create a new translation
   * @param data
   */
  async create(data: CreateTranslationDTO) {
    let existing: Translation | null;

    try {
      // Check for existing translation
      existing = await this.translationModel.findOne({
        group: data.group,
        key: data.key,
        language: data.language,
      });
    } catch (error) {
      this.logger.error('Error checking existing translation:', error);
      throw new BadRequestException('Failed to validate translation request');
    }

    if (existing) {
      throw new BadRequestException(
        `Translation already exists for group: ${data.group}, key: ${data.key}, language: ${data.language}`,
      );
    }

    try {
      return await new this.translationModel(data).save();
    } catch (error) {
      this.logger.error('Error creating translation:', error);
      throw new BadRequestException('Failed to create translation');
    }
  }

  /**
   * @description - Read translations as a list
   * @param take
   * @param skip
   * @param search
   */
  async list(take: number, skip: number, search?: string) {
    // Input validation
    if (take <= 0 || skip < 0) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    let searchQuery: any = {};

    if (search) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      searchQuery = {
        $or: [{ group: searchRegex }, { key: searchRegex }],
      };
    }

    try {
      const result = await this.translationModel.aggregate([
        { $match: searchQuery },
        {
          $group: {
            _id: { group: '$group', key: '$key' },
            languages: { $push: '$language' },
          },
        },
        {
          $facet: {
            metadata: [{ $count: 'totalCount' }],
            data: [
              { $sort: { '_id.group': 1, '_id.key': 1 } },
              { $skip: skip },
              { $limit: take },
              {
                $project: {
                  _id: 0,
                  group: '$_id.group',
                  key: '$_id.key',
                  languages: '$languages',
                },
              },
            ],
          },
        },
      ]);

      const totalCount = result[0]?.metadata[0]?.totalCount || 0;
      const data = result[0]?.data || [];
      return [data, totalCount];
    } catch (error) {
      this.logger.error('Error in translation aggregation:', error);
      throw new BadRequestException('Failed to retrieve translations');
    }
  }

  /**
   * @description - Read a translation by group and value
   * @param group
   * @param value
   * @param lang
   */
  async translateGroupKey(
    group: string,
    value: string,
    lang = this.getNsLocaleService.get(),
  ): Promise<Translation | null> {
    if (!group || !value) {
      throw new BadRequestException('Group and value are required');
    }

    try {
      return await this.translationModel
        .findOne({
          group: group,
          value: { $regex: new RegExp(value, 'i') },
          language: lang,
        })
        .exec();
    } catch (error) {
      this.logger.error('Error in translateGroupKey:', error);
      throw new BadRequestException('Failed to find translation by value');
    }
  }

  /**
   *
   * @param group
   * @param key
   * @param lang
   */
  async translate(
    group: string,
    key: string,
    lang = this.getNsLocaleService.get(),
  ): Promise<string> {
    if (!group || !key) {
      throw new BadRequestException('Group and key are required');
    }
    try {
      const translation = await this.translationModel.findOne({
        group: group,
        language: lang,
        key: key,
      });
      return translation?.value || key;
    } catch (error) {
      this.logger.error('Error in translate:', error);
      return key; // Fallback to key if translation fails
    }
  }

  /**
   * @description - Translate application by locale
   * @param locale
   */
  async translateApplication(locale: string): Promise<Translation[]> {
    let translations: Translation[] | null;

    if (!locale) {
      throw new BadRequestException('Locale is required');
    }

    try {
      translations = await this.translationModel.find({
        language: locale,
      });
    } catch (error) {
      this.logger.error('Error checking existing translation:', error);
      throw new BadRequestException('Failed to validate translation request');
    }

    if (!translations || translations.length === 0) {
      throw new BadRequestException(
        `No translations found for locale: ${locale}`,
      );
    }

    return translations;
  }

  /**
   * @description - Get combination by groupd and key
   * @param group
   * @param key
   */
  async getCombination(group: string, key: string) {
    if (!group || !key) {
      throw new BadRequestException('Group and key are required');
    }

    try {
      const [languages, translations] = await Promise.all([
        this.languageModel.find().select('code'),
        this.translationModel.find({ group, key }),
      ]);

      const languageCodes = uniq(languages.map((x: Language) => x.code));

      return languageCodes.map((code: string) => ({
        [code]:
          translations.find((translation) => translation.language === code)
            ?.value || '',
      }));
    } catch (error) {
      this.logger.error('Error in getCombination:', error);
      throw new BadRequestException(
        'Failed to retrieve translation combination',
      );
    }
  }

  /**
   * @description - Update combination by ground and key
   * @param group
   * @param key
   * @param translations
   */
  async updateCombination(
      group: string,
      key: string,
      translations: { [key: string]: string },
  ) {
    for (const [k, v] of Object.entries(translations)) {
      await this.translationModel.deleteOne({
        group: group,
        key: key,
        language: k,
      });
      if (!isEmpty(v)) {
        await new this.translationModel({
          group: group,
          key: key,
          language: k,
          value: v,
        }).save();
      }
    }
  }

  /**
   * @description Delete combination
   * @param group
   * @param key
   */
  async deleteCombination(group: string, key: string): Promise<void> {
    if (!group || !key) {
      throw new BadRequestException('Group and key are required');
    }

    try {
      const result = await this.translationModel.deleteMany({
        group,
        key,
      });

      if (result.deletedCount === 0) {
        throw new BadRequestException(
          `No translations found for group: ${group}, key: ${key}`,
        );
      }

      this.logger.log(
        `Deleted ${result.deletedCount} translations for ${group}.${key}`,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error in deleteCombination:', error);
      throw new BadRequestException('Failed to delete translation combination');
    }
  }

  /**
   * @description Translate deepL
   * @param data
   * @param toLanguage
   */
  async translateDeepL(
    data: CreateTranslationDTO,
    toLanguage: deepl.TargetLanguageCode,
  ): Promise<Translation> {
    if (!data.value) {
      throw new BadRequestException('Translation value is required');
    }

    try {
      const result = await this.translator.translateText(
        data.value,
        null,
        toLanguage,
      );

      const translatedData = {
        ...data,
        language: toLanguage.toString().slice(0, 2),
        value: result.text,
      };

      return await this.create(translatedData);
    } catch (error) {
      this.logger.error('Error in DeepL translation:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to translate text using DeepL');
    }
  }

  /**
   * @description Get available languages
   */
  async getAvailableLanguages(): Promise<string[]> {
    try {
      const languages = await this.languageModel.find().select('code');
      return languages.map(lang => lang.code);
    } catch (error) {
      this.logger.error('Error getting available languages:', error);
      throw new BadRequestException('Failed to retrieve available languages');
    }
  }

  /**
   * @description Get translation stats
   * @returns
   */
  async getTranslationStats(): Promise<{
    totalTranslations: number;
    totalGroups: number;
    totalKeys: number;
    languageDistribution: { [key: string]: number };
  }> {
    try {
      const [statsResult] = await this.translationModel.aggregate([
        {
          $group: {
            _id: null,
            totalTranslations: { $sum: 1 },
            groups: { $addToSet: '$group' },
            keys: { $addToSet: { group: '$group', key: '$key' } },
            languages: { $push: '$language' },
          },
        },
        {
          $project: {
            totalTranslations: 1,
            totalGroups: { $size: '$groups' },
            totalKeys: { $size: '$keys' },
            languages: 1,
          },
        },
      ]);

      const languageDistribution = {};
      if (statsResult?.languages) {
        statsResult.languages.forEach(lang => {
          languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
        });
      }

      return {
        totalTranslations: statsResult?.totalTranslations || 0,
        totalGroups: statsResult?.totalGroups || 0,
        totalKeys: statsResult?.totalKeys || 0,
        languageDistribution,
      };
    } catch (error) {
      this.logger.error('Error getting translation stats:', error);
      throw new BadRequestException(
          'Failed to retrieve translation statistics',
      );
    }
  }
}
