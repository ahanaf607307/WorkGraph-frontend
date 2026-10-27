import { apiClient } from "../../../lib/api-client";
import { APP_CONFIG } from "../../../config";

export interface UploadedFileResponse {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export const uploadActions = {
  uploadFile: async (file: File): Promise<UploadedFileResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient<UploadedFileResponse>("/upload/single", {
      method: "POST",
      body: formData,
    });

    return response;
  },

  uploadMultiple: async (files: File[]): Promise<UploadedFileResponse[]> => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    const response = await apiClient<UploadedFileResponse[]>("/upload/multiple", {
      method: "POST",
      body: formData,
    });

    return response;
  },

  getFileUrl: (pathOrUrl?: string | null): string => {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
      return pathOrUrl;
    }
    const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
    return `${APP_CONFIG.socketUrl}${cleanPath}`;
  },
};
