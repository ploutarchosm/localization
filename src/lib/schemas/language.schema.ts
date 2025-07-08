import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'languages',
  timestamps: true,
  versionKey: false,
})
export class Language extends Document {
  @Prop({
    type: String,
    required: [true, 'Language name is required'],
    maxlength: [30, 'Language name cannot exceed 30 characters'],
    minlength: [2, 'Language name must be at least 2 characters'],
    trim: true,
  })
  name: string;

  @Prop({
    required: [true, 'Language code is required'],
    maxlength: [2, 'Language code must be exactly 2 characters'],
    minlength: [2, 'Language code must be exactly 2 characters'],
    unique: true,
    trim: true,
    validate: {
      validator: function (v: string) {
        return /^[a-z]{2}$/.test(v);
      },
      message:
        'Language code must be exactly 2 lowercase letters (e.g., en, fr, es)',
    },
  })
  code: string;
}

export const LanguageSchema = SchemaFactory.createForClass(Language);
