import { useParams } from 'react-router-dom';
import ExpertMatchList from './ExpertMatchList';

export default function QuestionMatchingPage() {
  const { questionId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Expert Matching System</h1>
          <p className="mt-2 text-gray-600">Find and notify the best experts for investment research questions</p>
        </div>

        {questionId ? (
          <ExpertMatchList questionId={questionId} />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700">No question ID provided</p>
          </div>
        )}
      </div>
    </div>
  );
}
