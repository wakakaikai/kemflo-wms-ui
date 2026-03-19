import Sortable from 'sortablejs';

/**
 * 拖拽函数
 */
let sortableInstance: Sortable | null = null; // 定义一个变量来存储Sortable实例

/**
 * @description 排序函数--对外暴露
 * @param setNewSortArray 回调函数，将排序后的表单数据传递回去
 * @param data 排序数据
 * @param isSort  控制表单是否开启拖拽排序
 * @param id 表单唯一标识，用于获取表单dom
 */
export const enableRowDrop = (setNewSortArray: any, data: any, isSort: boolean, id: string) => {
  let tbody = document.querySelector('.el-table__body-wrapper tbody') as any;

  // 如果传了 id，就根据 id 获取表单dom
  if (id) {
    tbody = document.querySelector(`#${id} tbody`) as any;
  }

  // 销毁现有Sortable实例（如果存在）
  if (sortableInstance) {
    sortableInstance.destroy();
  }
  interface newFormTableType {
    id: number;
  }

  const newFormTable = ref<newFormTableType[]>([]);
  // 深拷贝数据
  newFormTable.value = JSON.parse(JSON.stringify(data));

  // 使用更新后的isSort值创建新的Sortable实例
  sortableInstance = new Sortable(tbody, {
    disabled: !isSort,
    // ms, number 单位：ms，定义排序动画的时间
    animation: 150,
    // 设置拖拽样式类名
    dragClass: 'drop-dragClass',
    // 设置拖拽停靠样式类名
    ghostClass: 'drop-ghostClass',
    // 设置选中样式类名
    chosenClass: 'drop-chosenClass',

    onAdd(evt: any) {
      // 拖拽时候添加有新的节点的时候发生该事件
      console.log('onAdd.foo:', [evt.item, evt.from]);
    },
    onUpdate() {
      // 拖拽更新节点位置发生该事件
    },
    onRemove(evt: any) {
      // 删除拖拽节点的时候促发该事件
      console.log('onRemove.foo:', [evt.item, evt.from]);
    },
    onStart() {
      // 开始拖拽出发该函数
    },
    onSort(evt: any) {
      // 发生排序发生该事件
      console.log('onUpdate.foo:', [evt.item, evt.from]);
    },
    onEnd(evt: any) {
      // 通过index更改数据，获取拖拽排序之后的数据
      const changeData = newFormTable.value.splice(evt.oldIndex || 0, 1);
      newFormTable.value.splice(evt.newIndex || 0, 0, changeData[0]);
      // newFormTable.value 就是排序之后的数组
      setNewSortArray(newFormTable.value.map((item) => item.id));
    }
  });
};
