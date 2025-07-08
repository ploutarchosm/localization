import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Language } from '../schemas/language.schema';
import {
  getErrorMessage,
  isMongoError,
  throwErrorStack,
} from '@ploutos/common';
import { CreateLanguageDto } from '../dto/language.dto';

@Injectable()
export class LanguageService {
  private readonly logger = new Logger(LanguageService.name);

  constructor(
    @InjectModel(Language.name)
    private languageModel: Model<Language>,
  ) {}

  /**
   * Create new language with proper error handling
   * @param {CreateLanguageDto} languageDto - Language data to create
   * @returns {Promise<Object>} Created language without version field
   * @throws {BadRequestException} When validation fails
   * @throws {ConflictException} When language code already exists
   */
  async create(languageDto: CreateLanguageDto): Promise<object> {
    try {
      const newLanguage = new this.languageModel(languageDto);
      const savedLanguage = await newLanguage.save();

      return {
        success: true,
        message: 'Language created successfully',
        data: savedLanguage.toObject(),
      };
    } catch (error: unknown) {
      this.getThrowMongoError(error);

      // Handle custom duplicate errors from schema post-hook
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('already exists')) {
        throw new ConflictException({
          success: false,
          message: errorMessage,
        });
      }

      // Generic server error for unexpected issues
      throw new BadRequestException({
        success: false,
        message: 'Failed to create language',
        error: errorMessage,
      });
    }
  }

  /**
   * @Description Get language by id
   * @returns {Promise<Language>} Language object
   * @param id
   */
  async read(id: string): Promise<Language> {
    let language: Language | null;
    try {
      language = await this.languageModel
        .findOne({ _id: id })
        .select('-__v')
        .lean()
        .exec();
    } catch (error) {
      this.logger.error('Error checking existing language:', error);
      throw new BadRequestException('Failed to validate language request');
    }
    if (!language) {
      throw new NotFoundException(`Language with ID ${id} not found`);
    }
    return language;
  }

  /**
   * Update language with proper error handling
   * @param {Language} data - Language data to update
   * @returns {Promise<Object>} Success message with updated language
   */
  async update(data: Language): Promise<object> {
    let updatedLanguage: Language | null;

    try {
      updatedLanguage = await this.languageModel
        .findOneAndUpdate(
          { _id: data._id },
          {
            name: data.name,
            code: data.code,
          },
          {
            new: true,
            runValidators: true, // This ensures validation runs on update
          },
        )
        .select('-__v')
        .lean()
        .exec();
    } catch (error: unknown) {
      // Handle not found
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Handle validation errors
      this.getThrowMongoError(error);

      throw new BadRequestException({
        success: false,
        message: 'Failed to update language',
        error: getErrorMessage(error),
      });
    }

    if (!updatedLanguage) {
      throw new NotFoundException({
        success: false,
        message: `Language with ID ${data._id} not found`,
      });
    }

    return {
      success: true,
      message: 'Language updated successfully',
      data: updatedLanguage,
    };
  }

  /**
   * Delete language by id
   * @param {string} id - Language ID to delete
   * @returns {Promise<Object>} Success message with deleted language info
   * @throws {NotFoundException} When language not found
   * @throws {Error} When deletion fails
   */
  async delete(id: string): Promise<object> {
    try {
      // Use findOneAndDelete to get the deleted document and delete in one operation
      const deletedLanguage = await this.languageModel
        .findOneAndDelete({ _id: id })
        .select('-__v')
        .lean()
        .exec();

      if (!deletedLanguage) {
        throw new NotFoundException(`Language with ID ${id} not found`);
      }

      return {
        success: true,
        message: 'Language deleted successfully',
        data: {
          id: deletedLanguage._id,
          name: deletedLanguage.name,
          code: deletedLanguage.code,
        },
      };
    } catch (error) {
      throwErrorStack(error, 'Failed to delete language: ');
    }
  }

  /**
   * @Description Get all languages but with pagination and search
   * @param skip
   * @param take
   * @param search
   */
  async list(skip: number, take: number, search?: string) {
    let searchQuery: any;

    if (search) {
      searchQuery = search
        ? {
            $or: [
              { name: { $regex: search, $options: 'i' } }, // Case-insensitive search for name
              { code: { $regex: search, $options: 'i' } }, // Case-insensitive search for code
            ],
          }
        : {};
    }

    const list = await this.languageModel
      .find(searchQuery)
      .select('-__v')
      .skip(skip)
      .limit(take)
      .sort('name')
      .exec();

    const totalItems = await this.languageModel
      .countDocuments(searchQuery)
      .exec();

    return {
      data: list,
      count: totalItems,
    };
  }

  /**
   * Retrieves all supported languages from the database
   * @returns {Promise<Object[]>} Array of language objects
   */
  async getSupportedLanguages(): Promise<object[]> {
    return this.languageModel
      .find({}, { __v: 0, _id: 0, createdAt: 0, updatedAt: 0 })
      .lean();
  }

  private getThrowMongoError(error: unknown) {
    if (isMongoError(error) && error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      throw new BadRequestException({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    // Handle duplicate key errors (409 Conflict)
    if (
      isMongoError(error) &&
      error.name === 'MongoServerError' &&
      error.code === 11000
    ) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      throw new ConflictException({
        success: false,
        message: `Language ${field} '${value}' already exists`,
        field: field,
        value: value,
      });
    }
  }
}
