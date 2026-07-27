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

  test("increments for context lines but not deleted lines", () => {
    const patch = `@@ -10,3 +10,3 @@
 unchanged
-oldValue
+newValue
 end`;

    const result = parsePatch("src/example.js", patch);

    expect(result).toEqual([
      {
        filename: "src/example.js",
        line: 11,
        content: "newValue",
      },
    ]);
  });

  test("handles multiple diff hunks", () => {
    const patch = `@@ -1,2 +1,3 @@
 first
+addedNearTop
 second
@@ -20,2 +21,3 @@
 later
+addedLater
 end`;

    const result = parsePatch("src/example.js", patch);
    expect(result).toEqual([
      {
        filename: "src/example.js",
        line: 2,
        content: "addedNearTop",
      },
      {
        filename: "src/example.js",
        line: 22,
        content: "addedLater",
      },
    ]);
  });
});
