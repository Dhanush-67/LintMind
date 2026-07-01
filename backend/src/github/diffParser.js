export function parsePatch(filename, patch) {
  if (!patch) {
    return [];
  }

  const chunks = [];
  const lines = patch.split("\n");

  let newLineNumber = null;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      const match = line.match(/\+(\d+)(?:,\d+)?/);

      if (match) {
        newLineNumber = Number(match[1]);
      }

      continue;
    }

    if (newLineNumber === null) {
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      chunks.push({
        filename,
        line: newLineNumber,
        content: line.slice(1),
      });

      newLineNumber += 1;
    } else if (!line.startsWith("-")) {
      newLineNumber += 1;
    }
  }

  return chunks;
}
