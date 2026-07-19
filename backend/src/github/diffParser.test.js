import { describe, expect, test } from "vitest";
import { parsePatch } from "./diffParser";

describe("parsePatch", () => {
  test("returns an empty array when the patch is missing", () => {
    const result = parsePatch("src/example.js", undefined);

    expect(result).toEqual([]);
  });

  test("extracts an added line with its new-file line number", () => {
    const patch = `@@ -1,2 +1,3 @@
 const first = 1;
+const second = 2;
 console.log(first);`;

    const result = parsePatch("src/example.js", patch);

    expect(result).toEqual([
      {
        filename: "src/example.js",
        line: 2,
        content: "const second = 2;",
      },
    ]);
  });
});
