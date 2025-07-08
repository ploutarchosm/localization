import {Inject, Injectable} from '@nestjs/common';
import { NS_LOCALE } from '../constants/ng-locale';
import * as clsHooked from 'cls-hooked';
import { AppConfigDto } from "@ploutos/application";

@Injectable()
export class GetNsLocaleService {
  constructor(
      @Inject('APP_CONFIG') private readonly appConfig: AppConfigDto,
  ) {}

  get() {
    const ns = clsHooked.getNamespace(this.appConfig.namespace);
    if (ns) {
      return ns.get(NS_LOCALE);
    }
  }
}
