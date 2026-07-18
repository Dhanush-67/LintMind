const endpoint = "https://models.github.ai/inference/chat/completions";

const token = process.env.GITHUB_MODELS_TOKEN;
const model = process.env.GITHUB_MODELS_MODEL;

if (!token) {
  throw new Error("Missing GITHUB_MODELS_TOKEN");
}

if (!model) {
  throw new Error("Missing GITHUB_MODELS_MODEL");
}

export async function generateModelResponse(messages, responseFormat = null) {
  const requestBody = {
    model,
    messages,
  };

  if (responseFormat) {
    requestBody.response_format = responseFormat;
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `GitHub Models request failed (${response.status}): ${errorBody}`,
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("GitHub Models response is missing content");
  }
  return content;
}
