# Localization Module For Nest.js

This localization module is responsible for translations and languages. It uses
Authentication for creating multiple translations for different languages and also
supports auto-translation using [DeepL](https://www.deepl.com/)

## Installation

```bash
npm install @ploutos/localization
```

## Variables
```dotenv
DEEPL_API=sdfsdfsdfsdfsdf
```
## Usage
```typescript
import { LocalizationModule } from '@ploutos/localization';

@Module({
  imports: [LocalizationModule.forRoot()]
})
export class AppModule {}
```
## Notes
***DEEPL_API*** variable is required.	
