import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CustomAnswer } from "./entities/custom-answer.entity";

export interface QASearchResult {
  id: string;
  question_text: string;
  answer_text: string;
  similarity: number;
  tags: string[];
  use_count: number;
}

@Injectable()
export class QABankService {
  private genAI: GoogleGenerativeAI;
  private embedding_model: any;

  constructor(
    @InjectRepository(CustomAnswer)
    private customAnswerRepository: Repository<CustomAnswer>,
    private configService: ConfigService
  ) {
    const api_key = this.configService.get<string>("GEMINI_API_KEY");
    if (api_key) {
      this.genAI = new GoogleGenerativeAI(api_key);
      this.embedding_model = this.genAI.getGenerativeModel({
        model: "text-embedding-004",
      });
    }
    // No warning needed — user-provided key from extension header will be used
  }

  /**
   * Get an embedding model using user-provided key or fall back to server key.
   */
  private getEmbeddingModel(userApiKey?: string) {
    if (userApiKey) {
      const genAI = new GoogleGenerativeAI(userApiKey);
      return genAI.getGenerativeModel({ model: "text-embedding-004" });
    }
    return this.embedding_model;
  }

  /**
   * Generate embedding for a question text using Gemini embedding model
   */
  async generateEmbedding(
    text: string,
    apiKey?: string
  ): Promise<number[] | null> {
    try {
      const model = this.getEmbeddingModel(apiKey);
      if (!model) return null;

      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error("[QABank] Failed to generate embedding:", error);
      return null;
    }
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;

    let dot_product = 0;
    let norm_a = 0;
    let norm_b = 0;

    for (let i = 0; i < a.length; i++) {
      dot_product += a[i] * b[i];
      norm_a += a[i] * a[i];
      norm_b += b[i] * b[i];
    }

    const denominator = Math.sqrt(norm_a) * Math.sqrt(norm_b);
    if (denominator === 0) return 0;

    return dot_product / denominator;
  }

  /**
   * Create a new Q&A entry
   */
  async createAnswer(
    user_id: string,
    question_text: string,
    answer_text: string,
    tags: string[] = [],
    auto_saved: boolean = false,
    apiKey?: string
  ): Promise<CustomAnswer> {
    const embedding = await this.generateEmbedding(question_text, apiKey);

    const answer = this.customAnswerRepository.create({
      userId: user_id,
      questionText: question_text,
      answerText: answer_text,
      questionEmbedding: embedding,
      tags,
      autoSaved: auto_saved,
    });

    return this.customAnswerRepository.save(answer);
  }

  /**
   * Update an existing Q&A entry
   */
  async updateAnswer(
    id: string,
    user_id: string,
    updates: { question_text?: string; answer_text?: string; tags?: string[] },
    apiKey?: string
  ): Promise<CustomAnswer | null> {
    const answer = await this.customAnswerRepository.findOne({
      where: { id, userId: user_id },
    });

    if (!answer) return null;

    if (updates.question_text) {
      answer.questionText = updates.question_text;
      // Re-generate embedding if question changed
      const embedding = await this.generateEmbedding(
        updates.question_text,
        apiKey
      );
      if (embedding) answer.questionEmbedding = embedding;
    }

    if (updates.answer_text) {
      answer.answerText = updates.answer_text;
    }

    if (updates.tags) {
      answer.tags = updates.tags;
    }

    return this.customAnswerRepository.save(answer);
  }

  /**
   * Delete a Q&A entry
   */
  async deleteAnswer(id: string, user_id: string): Promise<boolean> {
    const result = await this.customAnswerRepository.delete({
      id,
      userId: user_id,
    });
    return (result.affected || 0) > 0;
  }

  /**
   * Get all Q&A entries for a user
   */
  async getAllAnswers(user_id: string): Promise<CustomAnswer[]> {
    return this.customAnswerRepository.find({
      where: { userId: user_id },
      order: { useCount: "DESC", updatedAt: "DESC" },
    });
  }

  /**
   * Search for the most similar saved answer using semantic similarity
   */
  async findSimilarAnswer(
    user_id: string,
    question_text: string,
    threshold: number = 0.75,
    apiKey?: string
  ): Promise<QASearchResult | null> {
    const query_embedding = await this.generateEmbedding(
      question_text,
      apiKey
    );

    // Get all user's answers
    const all_answers = await this.customAnswerRepository.find({
      where: { userId: user_id },
    });

    if (all_answers.length === 0) return null;

    let best_match: CustomAnswer | null = null;
    let best_similarity = 0;

    for (const answer of all_answers) {
      let similarity = 0;

      if (query_embedding && answer.questionEmbedding) {
        // Use embedding-based similarity
        similarity = this.cosineSimilarity(
          query_embedding,
          answer.questionEmbedding
        );
      } else {
        // Fallback to text-based similarity
        similarity = this.textSimilarity(
          question_text,
          answer.questionText
        );
      }

      if (similarity > best_similarity) {
        best_similarity = similarity;
        best_match = answer;
      }
    }

    if (!best_match || best_similarity < threshold) return null;

    // Increment use count
    await this.customAnswerRepository.update(best_match.id, {
      useCount: best_match.useCount + 1,
      lastUsedAt: new Date(),
    });

    return {
      id: best_match.id,
      question_text: best_match.questionText,
      answer_text: best_match.answerText,
      similarity: best_similarity,
      tags: best_match.tags || [],
      use_count: best_match.useCount + 1,
    };
  }

  /**
   * Search for multiple similar answers (returns top N)
   */
  async findSimilarAnswers(
    user_id: string,
    question_text: string,
    top_n: number = 3,
    threshold: number = 0.5,
    apiKey?: string
  ): Promise<QASearchResult[]> {
    const query_embedding = await this.generateEmbedding(
      question_text,
      apiKey
    );

    const all_answers = await this.customAnswerRepository.find({
      where: { userId: user_id },
    });

    if (all_answers.length === 0) return [];

    const scored: { answer: CustomAnswer; similarity: number }[] = [];

    for (const answer of all_answers) {
      let similarity = 0;

      if (query_embedding && answer.questionEmbedding) {
        similarity = this.cosineSimilarity(
          query_embedding,
          answer.questionEmbedding
        );
      } else {
        similarity = this.textSimilarity(
          question_text,
          answer.questionText
        );
      }

      if (similarity >= threshold) {
        scored.push({ answer, similarity });
      }
    }

    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, top_n).map((s) => ({
      id: s.answer.id,
      question_text: s.answer.questionText,
      answer_text: s.answer.answerText,
      similarity: s.similarity,
      tags: s.answer.tags || [],
      use_count: s.answer.useCount,
    }));
  }

  /**
   * Simple text-based similarity using word overlap (Jaccard-like)
   * Used as fallback when embeddings are not available
   */
  private textSimilarity(text_a: string, text_b: string): number {
    const normalize = (t: string) =>
      t
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2);

    const words_a = new Set(normalize(text_a));
    const words_b = new Set(normalize(text_b));

    if (words_a.size === 0 || words_b.size === 0) return 0;

    let intersection = 0;
    for (const word of words_a) {
      if (words_b.has(word)) intersection++;
    }

    const union = words_a.size + words_b.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Record that a saved answer was used (increment use count)
   */
  async recordUsage(id: string, user_id: string): Promise<void> {
    const answer = await this.customAnswerRepository.findOne({
      where: { id, userId: user_id },
    });

    if (answer) {
      await this.customAnswerRepository.update(id, {
        useCount: answer.useCount + 1,
        lastUsedAt: new Date(),
      });
    }
  }
}

