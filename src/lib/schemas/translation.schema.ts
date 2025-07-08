import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'translations',
  timestamps: true,
  versionKey: false,
})
export class Translation extends Document {
  @Prop({
    type: String,
    required: [true, 'Translation group is required'],
    maxlength: [50, 'Translation group cannot exceed 50 characters'],
    minlength: [3, 'Translation group must be at least 3 characters'],
    trim: true,
  })
  group: string;

  @Prop({
    type: String,
    required: [true, 'Translation group is required'],
    maxlength: [50, 'Translation key cannot exceed 50 characters'],
    minlength: [3, 'Translation key must be at least 3 characters'],
    trim: true,
  })
  key: string;

  @Prop({
    type: String,
    required: [true, 'Translation language is required'],
    maxlength: [2, 'Translation language must be exactly 2 characters'],
    minlength: [2, 'Translation language must be exactly 2 characters'],
    validate: {
      validator: function (v: string) {
        return /^[a-z]{2}$/.test(v);
      },
      message:
        'Translation language must be exactly 2 lowercase letters (e.g., en, fr, es)',
    },
  })
  language: string;

  @Prop({
    type: String,
  })
  value: string;
}

export const TranslationSchema = SchemaFactory.createForClass(Translation);

// Create compound unique index on group, key, and language
TranslationSchema.index(
  { group: 1, key: 1, language: 1 },
  {
    unique: true,
    name: 'unique_group_key_language',
  },
);

// Custom validation to provide better error messages
TranslationSchema.pre('save', async function (next) {
  if (
    this.isNew ||
    this.isModified('group') ||
    this.isModified('key') ||
    this.isModified('language')
  ) {
    const existingTranslation = await this.model(Translation.name).findOne({
      group: this.group,
      key: this.key,
      language: this.language,
      _id: { $ne: this._id },
    });

    if (existingTranslation) {
      const error = new Error(
        `Translation already exists for group: '${this.group}', key: '${this.key}', language: '${this.language}'`,
      );
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});
