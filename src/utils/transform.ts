export function flatToTree(data: any[]) {
  const map = new Map();
  data.forEach((item) => map.set(item.id, { ...item, children: [] }));
  const tree: any[] = [];
  data.forEach((item) => {
    const parent = map.get(item.parentId);
    if (parent) {
      parent.children.push(map.get(item.id));
    } else {
      tree.push(map.get(item.id));
    }
  });
  return tree;
}
