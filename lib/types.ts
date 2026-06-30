export type Language = "en" | "zh";

export interface ArticleData {
  headline: string;
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  future_quote: string;
  reward: string;
  image_prompt: string;
}

export interface CapsuleInput {
  name: string;
  team: string;
  achievement: string;
  futureDate: string;
  language: Language;
  /** Achievement category id — drives the pre-built fallback flavor. */
  category: string;
}
