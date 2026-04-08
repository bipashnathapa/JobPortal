const ResumeResult = ({ data }) => {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold">Your Resume Health</h2>
        
        {/* 1. The Circular Score */}
        <div className="flex justify-center my-4">
          <div className="relative size-32">
              <svg className="size-full" viewBox="0 0 36 36">
                  <path className="stroke-current text-blue-500" strokeWidth="3" fill="none"
                        strokeDasharray={`${data.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-bold">
                  {data.score}%
              </div>
          </div>
        </div>
  
        {/* 2. Free Feedback List */}
        <ul className="space-y-2">
          {data.feedback.map((item, index) => (
            <li key={index} className="text-sm text-gray-600">⚠️ {item}</li>
          ))}
        </ul>
  
        {/* 3. The "Paywall" for Groq AI */}
        {!data.is_premium && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-center">
            <p className="mb-3 font-semibold">Want specific AI-powered fixes?</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded">
              Unlock AI Suggestions (NPR 100 via eSewa)
            </button>
          </div>
        )}
      </div>
    );
  };