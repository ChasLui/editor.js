/**
* 类型对象上方的装饰器
*/
type Indexed<T> = { [key: string]: T };

/**
 * I18n字典值的类型，可以是字符串或字典子节点
 *
 * 可以用作:
 *   LeavesDictKeys<typeof myDictionary>
 *
 * 其中 myDictionary 是带有消息的 JSON
 */
export type LeavesDictKeys<D> = D extends string
  /**
   * 如果泛型类型为字符串，则只需返回它
   */
  ? D
  /**
   * 如果泛型类型是仅具有一个级别并且仅包含字符串的对象，则返回其键并集
   *
   * { key: "string", anotherKey: "string" } => "key" | "anotherKey"
   *
   */
  : D extends Indexed<string>
    ? keyof D
    /**
     * 如果泛型类型是对象，但不是上述类型，则对它的值递归使用 LeavesDictKey 并合并结果
     *
     * { "rootKey": { "subKey": "string" }, "anotherRootKey": { "anotherSubKey": "string" } } => "subKey" | "anotherSubKey"
     *
     */
    : D extends Indexed<any>
      ? { [K in keyof D]: LeavesDictKeys<D[K]> }[keyof D]

      /**
       * 在其他情况下，永不返回
       */
      : never;

/**
 * 提供对字典可用命名空间的类型安全访问
 *
 * 可以用作:
 *    DictNamespaces<typeof myDictionary>
 *
 * 其中 myDictionary 是带有消息的 JSON
 */
export type DictNamespaces<D extends object> = {
  /**
   * 遍历泛型类型键
   *
   * 如果当前键下的值是仅具有一个级别并且仅包含字符串的对象，则返回字符串类型
   */
  [K in keyof D]: D[K] extends Indexed<string>
    ? string
    /**
     * 如果当前键下的值是深度大于一的对象，则递归应用 DictNamespaces
     */
    : D[K] extends Indexed<any>
      ? DictNamespaces<D[K]>
      /**
       * 在其他情况下，永不返回
       */
      : never;
}

