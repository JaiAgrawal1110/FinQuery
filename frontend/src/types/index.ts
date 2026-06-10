export interface Document {
  document_id: string;
  filename: string;
  pages_processed: number;
  chunks_created: number;
}

export interface Source {
  document: string;
  page: number;
  score: number;
}

export interface QueryResponse {
  answer: string;
  sources: Source[];
  tokens_used?: number;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: Date;
}
