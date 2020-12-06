'use strict';

import { EditorConfig } from '../types';

/**
 * 应用垫片
 */
import '@babel/register';

import 'components/polyfills';
import Core from './components/core';
import * as _ from './components/utils';

declare const VERSION: string;

/**
 * Editor.js
 *
 * 简述 (눈_눈;)
 *
 * @version 2.18.0
 *
 * @license Apache-2.0
 * @author CodeX-Team <https://ifmo.su>
 */
export default class EditorJS {
  /**
   * Promise 在核心模块准备好并且 UI 呈现在页面上时解析
   */
  public isReady: Promise<void>;

  /**
   * 存储销毁方法实现。
   * 清除编辑器占用的堆，并从 DOM 中删除 UI 组件。
   */
  public destroy: () => void;

  /** 编辑器版本 */
  public static get version(): string {
    return VERSION;
  }

  /**
   * @param {EditorConfig|string|undefined} [configuration] - 用户配置
   */
  constructor(configuration?: EditorConfig|string) {
    /**
     * 设置默认的onReady函数
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let onReady = (): void => {};

    /**
     * 如果在配置中传了 `onReady`，则重新定义 onReady 函数
     */
    if (_.isObject(configuration) && _.isFunction(configuration.onReady)) {
      onReady = configuration.onReady;
    }

    /**
     * 创建 Editor.js 实例
     */
    const editor = new Core(configuration);

    /**
     * 我们需要在构造函数中导出 isReady Promise，因此可以在导出其他 API 方法之前使用它
     *
     * @type {Promise<void>}
     */
    this.isReady = editor.isReady.then(() => {
      this.exportAPI(editor);
      onReady();
    });
  }

  /**
   * 导出外部 API 方法
   *
   * @param {Core} editor — Editor's 实例
   */
  public exportAPI(editor: Core): void {
    const fieldsToExport = [ 'configuration' ];
    const destroy = (): void => {
      Object.values(editor.moduleInstances)
        .forEach((moduleInstance) => {
          if (_.isFunction(moduleInstance.destroy)) {
            moduleInstance.destroy();
          }
        });

      editor = null;

      for (const field in this) {
        if (Object.prototype.hasOwnProperty.call(this, field)) {
          delete this[field];
        }
      }

      Object.setPrototypeOf(this, null);
    };

    fieldsToExport.forEach((field) => {
      this[field] = editor[field];
    });

    this.destroy = destroy;

    Object.setPrototypeOf(this, editor.moduleInstances.API.methods);

    delete this.exportAPI;

    const shorthands = {
      blocks: {
        clear: 'clear',
        render: 'render',
      },
      caret: {
        focus: 'focus',
      },
      events: {
        on: 'on',
        off: 'off',
        emit: 'emit',
      },
      saver: {
        save: 'save',
      },
    };

    Object.entries(shorthands)
      .forEach(([key, methods]) => {
        Object.entries(methods)
          .forEach(([name, alias]) => {
            this[alias] = editor.moduleInstances.API.methods[key][name];
          });
      });
  }
}
