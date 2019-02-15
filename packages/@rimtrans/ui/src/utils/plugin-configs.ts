// tslint:disable:no-reserved-keywords
import Vue, { PluginObject } from 'vue';
import {
  Component,
  Emit,
  Inject,
  Model,
  Prop,
  Provide,
  Watch,
} from 'vue-property-decorator';
import { wsc, Configs } from '@rimtrans/service';
import { Theme } from 'void-ui';

let $$Vue: typeof Vue | undefined;

declare module 'vue/types/vue' {
  interface Vue {
    /**
     * Configs for RimTrans
     */
    $configs: Configs;
  }
}

export function newConfigs(): Configs {
  return {
    _comment: 'DANGER! Do not edit this file!',
    language: 'auto',
    theme: 'lite',
    pathToRimWorld: '',
    pathToWorkshop: '',
    pathToCustom: '',
  };
}

/**
 * Plugin Configs
 */
@Component
export class PluginConfigs extends Vue {
  private silent?: boolean;
  public configs: Configs = newConfigs();

  public reset(): void {
    this.configs = newConfigs();
  }

  private async setLanguage(): Promise<void> {
    await this.$locale.selectLanguage(
      this.configs.language === 'auto' ? navigator.language : this.configs.language,
    );
  }

  @Watch('configs.theme', { immediate: true })
  private watchTheme(value: Theme): void {
    this.$vd_theme.setColor(value);
  }

  @Watch('configs', { deep: true })
  private async watchConfigs(): Promise<void> {
    await this.setLanguage();
    if (this.silent) {
      this.silent = false;
    } else {
      wsc.send('configs', this.configs);
    }
  }

  private async onConfigs(data?: Configs): Promise<void> {
    this.silent = true;
    this.configs = {
      ...newConfigs(),
      ...data,
    };
  }

  public async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const init = async (data?: Configs) => {
        wsc.removeListener('configs', init);
        await this.onConfigs(data);
        wsc.addListener('configs', this.onConfigs);
        resolve();
      };
      wsc.addListener('configs', init);
      wsc.send('configs');
    });
  }

  public install($Vue: typeof Vue): void {
    if ($$Vue && $$Vue === $Vue) {
      return;
    }
    $$Vue = $Vue;

    // tslint:disable-next-line:no-this-assignment
    const self = this;

    Object.defineProperty($Vue.prototype, '$configs', {
      get(): Configs {
        return self.configs;
      },
    });
  }
}