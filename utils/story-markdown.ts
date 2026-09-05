import type { Parent, Root, RootContent } from "mdast";

/** Give unmarked dialogue in older stories the same emphasis as generated dialogue. */
export function remarkStoryDialogue() {
  return (tree: Root) => {
    function visit(parent: Parent) {
      if (parent.type === "emphasis" || parent.type === "strong") return;
      const children: RootContent[] = [];
      for (const child of parent.children) {
        if ("children" in child) visit(child);
        if (child.type !== "text") {
          children.push(child);
          continue;
        }
        let offset = 0;
        for (const match of child.value.matchAll(/“[^”\n]+”|"[^"\n]+"/g)) {
          if (match.index > offset) {
            children.push({ type: "text", value: child.value.slice(offset, match.index) });
          }
          children.push({
            type: "emphasis",
            children: [{
              type: "strong",
              children: [{ type: "text", value: match[0] }],
            }],
          });
          offset = match.index + match[0].length;
        }
        if (offset < child.value.length) {
          children.push({ type: "text", value: child.value.slice(offset) });
        }
      }
      parent.children = children;
    }
    visit(tree);
  };
}
