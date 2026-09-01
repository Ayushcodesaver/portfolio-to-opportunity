import { PageHeader } from "@/components/common/PageHeader";
import { ResumeUploadManager } from "@/components/common/ResumeUploadManager";

export default function MyResume() {
  return (
    <div className="container max-w-3xl py-8">
      <PageHeader
        title="My Resume"
        description="Upload and manage the resume HR sees when reviewing your applications."
      />
      <div className="mt-6">
        <ResumeUploadManager />
      </div>
    </div>
  );
}
