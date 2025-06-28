/**
 * @descripttion: 元素聚焦
 * @param {HTMLElement} el
 * @return {*}
 */
export const onFocus = <T extends HTMLElement>(el: T) => {
  el.focus();
};
/**
 * @descripttion: 元素失焦
 * @param {HTMLElement} el
 * @return {*}
 */
export const onBlur = <T extends HTMLElement>(el: T) => {
  el.blur();
};
/**
 * @descripttion: 元素选中
 * @param {HTMLInputElement} el
 * @return {*}
 */
export const onSelect = (el: HTMLInputElement) => {
  el.select();
};
