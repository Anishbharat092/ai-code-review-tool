import api from "@/lib/api/axios";
import type {
  Review,
  SubmitPrPayload,
  SubmitPrResponse,
} from "@/lib/types/review";

export const reviewService = {
  async submitPr(payload: SubmitPrPayload): Promise<SubmitPrResponse> {
    const { data } = await api.post<SubmitPrResponse>("/reviews", payload);
    return data;
  },

  async getReviewById(id: string): Promise<Review> {
    const { data } = await api.get<Review>(`/reviews/${id}`);
    return data;
  },

  async getReviews(): Promise<Review[]> {
    const { data } = await api.get<Review[]>("/reviews");
    return data;
  },
};
