import { Injectable } from '@nestjs/common';
import { NS_LOCALE } from '../constants/ng-locale';
import { ConfigService } from '@nestjs/config';
import * as clsHooked from 'cls-hooked';

@Injectable()
export class GetNsLocaleService {
  constructor(private config: ConfigService) {}

  get() {
    const ns = clsHooked.getNamespace(this.config.get<string>('APP_NAMESPACE'));
    if (ns) {
      return ns.get(NS_LOCALE);
    }
  }
}
