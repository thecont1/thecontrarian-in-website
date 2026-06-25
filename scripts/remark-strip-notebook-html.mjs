/**
 * remark-strip-notebook-html — Remark plugin that removes notebook HTML
 * embedded between <!-- NOTEBOOK_HTML_START --> and <!-- NOTEBOOK_HTML_END -->
 * markers from the markdown AST before rendering.
 *
 * The Datastory layout reads the raw .md file to extract the notebook HTML
 * separately; this plugin ensures it doesn't appear in <Content />.
 */
import { visit } from "unist-util-visit";

const MARKER_START = "<!-- NOTEBOOK_HTML_START -->";
const MARKER_END = "<!-- NOTEBOOK_HTML_END -->";

export default function stripNotebookHtml() {
  return (tree) => {
    let inBlock = false;

    visit(tree, (node, index, parent) => {
      if (node.type !== "html" || !parent) return;

      if (node.value.includes(MARKER_START)) {
        inBlock = true;
      }

      if (inBlock) {
        // Mark for removal by nullifying
        parent.children[index] = null;
      }

      if (node.value.includes(MARKER_END)) {
        inBlock = false;
      }
    });

    // Clean up nulls
    if (tree.children) {
      tree.children = tree.children.filter(Boolean);
    }
  };
}
