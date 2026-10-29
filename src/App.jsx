import { useState } from "react";
import diseaseGuidance from "./diseaseGuidance";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    setResult(null);
    setError("");

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setFile(null);
      setPreview("");
      setError("Please select a valid image file.");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a leaf image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://localhost:8080/api/crop-scans/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Image upload failed.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Make sure Spring Boot is running on port 8080."
          : err.message || "Could not connect to the backend.",
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDiseaseName(name) {
    if (!name) return "Prediction unavailable";

    return name
      .replace(/^Tomato_+/, "")
      .replace(/^Tomato/, "")
      .replaceAll("_", " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const confidence =
    result?.confidence != null
      ? Number(result.confidence)
      : result?.confidencePercentage != null
        ? Number(result.confidencePercentage)
        : null;

  const validConfidence = confidence !== null && Number.isFinite(confidence);

  const confidencePercent = validConfidence
    ? confidence <= 1
      ? confidence * 100
      : confidence
    : null;

  const isUnknownCrop = result?.crop === "unknown";

  const guidance =
    result?.disease && !isUnknownCrop ? diseaseGuidance[result.disease] : null;
  console.log("Disease:", result?.disease);
  console.log("Matched guidance:", guidance);
  return (
    <div className="min-h-screen bg-stone-50 text-gray-800">
      <header className="border-b border-green-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-bold text-green-700">🌱 KrishiMitra</h1>

          <span className="text-sm text-gray-500">Smart Farming Assistant</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-14">
        <section className="mb-10 text-center">
          <p className="mb-3 font-semibold text-green-700">
            HEALTHIER CROPS, BETTER HARVESTS
          </p>

          <h2 className="text-3xl font-bold leading-tight sm:text-5xl">
            Take a step towards
            <span className="block text-green-700">healthier crops</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-gray-600">
            Upload a tomato leaf photograph to check for possible diseases using
            our AI-powered image classifier.
          </p>
        </section>

        <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm sm:p-10">
          <h3 className="text-xl font-bold">Tomato leaf disease detection</h3>

          <p className="mt-2 text-sm text-gray-500">
            Choose a clear, well-lit image of a single tomato leaf.
          </p>

          <label className="mt-6 flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-green-300 bg-green-50 p-5 text-center transition hover:bg-green-100">
            {preview ? (
              <img
                src={preview}
                alt="Selected tomato leaf"
                className="max-h-64 max-w-full rounded-lg object-contain"
              />
            ) : (
              <>
                <span className="mb-3 text-5xl">📷</span>

                <span className="font-semibold text-green-800">
                  Click to choose a tomato leaf image
                </span>

                <span className="mt-2 text-sm text-gray-500">
                  JPG or PNG recommended
                </span>
              </>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && (
            <p className="mt-3 break-all text-sm text-gray-600">
              Selected: {file.name}
            </p>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-6 w-full rounded-xl bg-green-700 px-5 py-3.5 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? "Analyzing leaf..." : "Detect Tomato Disease"}
          </button>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {result && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-5">
              <h4 className="text-lg font-bold text-green-800">
                {isUnknownCrop
                  ? "Unable to confirm a tomato leaf"
                  : formatDiseaseName(result.disease)}
              </h4>

              <p className="mt-2 text-sm text-gray-700">
                Status: {result.status || "Completed"}
              </p>

              <p className="mt-1 text-sm text-gray-700">
                Crop: {result.crop || "Not available"}
              </p>

              {validConfidence && (
                <div className="mt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-700">
                      Model confidence
                    </span>

                    <span className="text-sm font-semibold text-gray-800">
                      {confidencePercent.toFixed(2)}%
                    </span>
                  </div>

                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200"
                    role="progressbar"
                    aria-label="Model confidence"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.max(
                      0,
                      Math.min(100, confidencePercent),
                    )}
                  >
                    <div
                      className={`h-full rounded-full ${
                        confidencePercent < 60
                          ? "bg-amber-500"
                          : confidencePercent < 80
                            ? "bg-yellow-500"
                            : "bg-green-600"
                      }`}
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, confidencePercent),
                        )}%`,
                      }}
                    />
                  </div>

                  {confidencePercent < 60 && (
                    <p className="mt-2 text-sm font-medium text-amber-800">
                      Low confidence: upload another clear image and verify the
                      result with an agricultural expert.
                    </p>
                  )}

                  {!isUnknownCrop &&
                    confidencePercent >= 60 &&
                    confidencePercent < 80 && (
                      <p className="mt-2 text-sm text-amber-800">
                        Moderate model confidence. Verify the symptoms before
                        making crop-treatment decisions.
                      </p>
                    )}

                  {confidencePercent >= 80 && (
                    <p className="mt-2 text-sm text-green-800">
                      Higher model confidence does not confirm a diagnosis.
                      Verify the result before treatment.
                    </p>
                  )}
                </div>
              )}

              <p className="mt-3 text-sm text-gray-700">
                {result.message || "Analysis completed."}
              </p>

              {isUnknownCrop ? (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h5 className="font-bold text-amber-800">
                    Unable to confirm tomato leaf
                  </h5>

                  <p className="mt-2 text-sm text-amber-900">
                    The model's top prediction was outside its tomato
                    categories. This does not necessarily mean the image is not
                    a tomato leaf.
                  </p>

                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-900">
                    <li>Upload a clear image showing a single tomato leaf.</li>
                    <li>
                      Use good lighting and avoid blurry or distant images.
                    </li>
                    <li>Make sure the leaf is clearly visible in the image.</li>
                  </ul>

                  <p className="mt-3 text-sm text-amber-900">
                    If the problem continues, the model's preprocessing or
                    classification may need improvement.
                  </p>
                </div>
              ) : guidance ? (
                <div className="mt-5 rounded-xl border border-green-200 bg-white p-4">
                  <h5 className="text-lg font-bold text-green-800">
                    Symptoms to check
                  </h5>

                  <p className="mt-2 text-sm text-gray-700">
                    {guidance.symptoms}
                  </p>

                  <h5 className="mt-4 font-bold text-green-800">
                    Recommended next steps
                  </h5>

                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-gray-700">
                    {guidance.actions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-600">
                  No specific guidance is available for this prediction yet.
                  Please consult an agricultural expert.
                </p>
              )}

              <p className="mt-4 text-xs text-gray-600">
                AI results are estimates, not a confirmed diagnosis. Consult an
                agricultural expert before treating your crop.
              </p>

              <details className="mt-4 text-sm text-gray-600">
                <summary className="cursor-pointer font-semibold">
                  View technical response
                </summary>

                <pre className="mt-2 overflow-auto rounded-lg bg-white p-3 text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-sm text-gray-500">
          KrishiMitra · Supporting smarter farming through technology
        </p>
      </main>
    </div>
  );
}

export default App;
