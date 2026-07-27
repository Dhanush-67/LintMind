import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../llm/githubModels.js", () => ({
  generateModelResponse: vi.fn(),
}));

import { generateModelResponse } from "../llm/githubModels.js";
import { reviewChunksWithAI } from "./aiReviewEngine.js";

describe("reviewChunksWithAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns no comments without calling the model when chunks are empty", async () => {
    const result = await reviewChunksWithAI([]);

    expect(result).toEqual([]);
    expect(generateModelResponse).not.toHaveBeenCalled();
  });

  test("returns a valid comment produced by the model", async () => {
    const chunks = [
      {
        filename: "src/example.js",
        line: 10,
        content: "console.log(user.password);",
      },
    ];

    const modelResponse = {
      comments: [
        {
          filename: "src/example.js",
          line: 10,
          body: "Avoid logging sensitive user information.",
        },
      ],
    };

    generateModelResponse.mockResolvedValue(JSON.stringify(modelResponse));

    const result = await reviewChunksWithAI(chunks);

    expect(result).toEqual(modelResponse.comments);
    expect(generateModelResponse).toHaveBeenCalledTimes(1);
  });

  test("discards comments with invented locations", async () => {
    const chunks = [
      {
        filename: "src/example.js",
        line: 10,
        content: "console.log(user.password);",
      },
    ];

    const modelResponse = {
      comments: [
        {
          filename: "src/invented.js",
          line: 50,
          body: "This location was invented by the model.",
        },
      ],
    };

    generateModelResponse.mockResolvedValue(JSON.stringify(modelResponse));

    const result = await reviewChunksWithAI(chunks);

    expect(result).toEqual([]);
    expect(generateModelResponse).toHaveBeenCalledTimes(1);
  });

  test("rejects malformed JSON returned by the model", async () => {
    const chunks = [
      {
        filename: "src/example.js",
        line: 10,
        content: "console.log(user.password);",
      },
    ];

    generateModelResponse.mockResolvedValue("this is not valid JSON");

    await expect(reviewChunksWithAI(chunks)).rejects.toThrow();
  });

  test("rejects JSON that fails Zod validation", async () => {
    const chunks = [
      {
        filename: "src/example.js",
        line: 10,
        content: "console.log(user.password);",
      },
    ];

    const modelResponse = {
      comments: [
        {
          filename: "src/example.js",
          line: 10,
          // body is intentionally missing
        },
      ],
    };

    generateModelResponse.mockResolvedValue(JSON.stringify(modelResponse));

    await expect(reviewChunksWithAI(chunks)).rejects.toThrow();
  });
});
