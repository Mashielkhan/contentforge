export type WritePromptInput = {
  topic: string;
  brandProfile: {
    name: string;
    productDetails: string;
    audience: string;
    voice: string;
  };
};

export function buildWritePrompt(input: WritePromptInput) {
  return {
    system: 'You are ContentForge, an AI content suite for creators. Return JSON only. Never invent product claims, audience details, or brand facts that are not in the selected profile.',
    user: JSON.stringify({
      task: 'Create three Instagram captions, three TikTok hooks, one email newsletter, and a hashtag list.',
      topic: input.topic,
      selectedBrandProfile: input.brandProfile,
      constraints: {
        captions: 3,
        hooks: 3,
        newsletter: 1,
        hashtags: 'relevant, lowercase strings without duplicates',
        voice: 'Follow selectedBrandProfile.voice exactly while keeping the writing useful and natural.',
      },
    }),
  };
}
