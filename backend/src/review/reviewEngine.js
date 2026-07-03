export function reviewChunks(chunks) {
  const comments = [];

  for (const chunk of chunks) {
    const content = chunk.content.trim();

    if (content.length === 0) {
      continue;
    }

    if (content.includes("console.log")) {
      comments.push({
        filename: chunk.filename,
        line: chunk.line,
        body: "Consider removing console.log statements before committing.",
      });
    }

    if (content.includes("debugger")) {
      comments.push({
        filename: chunk.filename,
        line: chunk.line,
        body: "COnsider removing debugger statements before committing.",
      });
    }

    if (content.includes("TODO")) {
      comments.push({
        filename: chunk.filename,
        line: chunk.line,
        body: "This TODO should either be completed or linked to a tracking issue.",
      });
    }

    if (content.length > 120) {
      comments.push({
        filename: chunk.filename,
        line: chunk.line,
        body: "This line is quite long. Consider breaking it up for readability.",
      });
    }
  }

  return comments;
}
