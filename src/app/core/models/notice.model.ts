export interface NoticeAuthor {
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export interface Notice {
  id: string;
  content: string;
  imageUrl?: string;
  author: NoticeAuthor;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoticeResponse {
  notices: Notice[];
  total: number;
  pages: number;
}

