/* Copyright 2021, Milkdown by Mirone. */

import { Ctx } from '@milkdown/core';
import { EditorView } from '@milkdown/prose';
import { Utils } from '@milkdown/utils';

import { button, ButtonConfig } from './button';
import { MenuConfig, MenuConfigItem } from './config';
import { divider, DividerConfig } from './divider';
import { select, SelectConfig } from './select';
import { MenuBar } from './menuBar';

type InnerConfig = (MenuConfigItem | DividerConfig) & { $: HTMLElement };

export type ManagerOptions = {
  enabled: boolean;
};

export class Manager {
  private config: InnerConfig[];

  constructor(
    originalConfig: MenuConfig,
    private utils: Utils,
    private ctx: Ctx,
    view: EditorView,
    private options: ManagerOptions
  ) {
    this.config = originalConfig
      .map((xs) =>
        xs.map((x) => ({
          ...x,
          $: this.$create(x, view),
        }))
      )
      .map((xs, i): Array<InnerConfig> => {
        if (i === originalConfig.length - 1) {
          return xs;
        }
        const dividerConfig: DividerConfig = {
          type: 'divider',
          group: xs.map((x) => x.$),
        };
        return [
          ...xs,
          {
            ...dividerConfig,
            $: this.$create(dividerConfig, view),
          },
        ];
      })
      .flat();

    const menu = MenuBar(utils, view);
    this.config.forEach((x) => menu.appendChild(x.$));
  }

  public update(view: EditorView) {
    const { enabled } = this.options;

    this.config.forEach((config) => {
      switch (config.type) {
        case 'button': {
          if (config.active) {
            const active = config.active(view);
            if (active) {
              config.$.classList.add('active');
            } else {
              config.$.classList.remove('active');
            }
          }

          if (config.alwaysVisible) {
            config.$.removeAttribute('disabled');
            return;
          }

          const disabled =
            !enabled || (config.disabled && config.disabled(view));
          if (disabled) {
            config.$.setAttribute('disabled', 'true');
          } else {
            config.$.removeAttribute('disabled');
          }
          break;
        }

        case 'select': {
          if (config.alwaysVisible) {
            config.$.removeAttribute('disabled');
            return;
          }

          const disabled =
            !enabled || (config.disabled && config.disabled(view));
          if (disabled) {
            config.$.classList.add('disabled');
            config.$.children[0].setAttribute('disabled', 'true');
          } else {
            config.$.classList.remove('disabled');
            config.$.children[0].removeAttribute('disabled');
          }
          break;
        }

        case 'divider': {
          const disabled = config.group.every(
            (x) =>
              x.getAttribute('disabled') || x.classList.contains('disabled')
          );
          if (disabled) {
            config.$.classList.add('disabled');
          } else {
            config.$.classList.remove('disabled');
          }
          break;
        }
      }
    });
  }

  private $create(
    item: ButtonConfig | DividerConfig | SelectConfig,
    view: EditorView
  ): HTMLElement {
    const { utils, ctx } = this;

    switch (item.type) {
      case 'button': {
        const $ = button(utils, item, ctx, view, this.options);
        return $;
      }
      case 'select': {
        const $ = select(utils, item, ctx, view, this.options);
        return $;
      }
      case 'divider': {
        const $ = divider(utils, item);
        return $;
      }
      default:
        throw new Error();
    }
  }
}
