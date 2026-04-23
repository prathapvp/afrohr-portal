type NsfwClassName = "Drawing" | "Hentai" | "Neutral" | "Porn" | "Sexy";

interface NsfwPrediction {
  className: NsfwClassName;
  probability: number;
}

interface ModerationModel {
  classify: (img: HTMLImageElement, topk?: number) => Promise<NsfwPrediction[]>;
}

export interface ImageModerationResult {
  isAllowed: boolean;
  blockedReason?: string;
  scores: Record<NsfwClassName, number>;
}

let modelPromise: Promise<ModerationModel> | null = null;

const BLOCK_THRESHOLDS = {
  Porn: 0.2,
  Hentai: 0.2,
  Sexy: 0.85,
} as const;

const defaultScores = (): Record<NsfwClassName, number> => ({
  Drawing: 0,
  Hentai: 0,
  Neutral: 0,
  Porn: 0,
  Sexy: 0,
});

const getModel = async (): Promise<ModerationModel> => {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const nsfwjs = await import("nsfwjs");
      return nsfwjs.load();
    })();
  }
  return modelPromise;
};

const fileToImageElement = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to parse image for moderation"));
    };

    img.src = objectUrl;
  });

export const moderateImageForProfileUpload = async (file: File): Promise<ImageModerationResult> => {
  const model = await getModel();
  const image = await fileToImageElement(file);
  const predictions = await model.classify(image);

  const scores = defaultScores();
  predictions.forEach((prediction) => {
    if (prediction.className in scores) {
      scores[prediction.className] = prediction.probability;
    }
  });

  const pornScore = scores.Porn;
  const hentaiScore = scores.Hentai;
  const sexyScore = scores.Sexy;

  if (pornScore >= BLOCK_THRESHOLDS.Porn) {
    return {
      isAllowed: false,
      blockedReason: "Explicit content detected. Please upload a different image.",
      scores,
    };
  }

  if (hentaiScore >= BLOCK_THRESHOLDS.Hentai) {
    return {
      isAllowed: false,
      blockedReason: "Sexual/anime adult content detected. Please upload a different image.",
      scores,
    };
  }

  if (sexyScore >= BLOCK_THRESHOLDS.Sexy) {
    return {
      isAllowed: false,
      blockedReason: "Potentially sexual content detected. Please upload a professional image.",
      scores,
    };
  }

  return {
    isAllowed: true,
    scores,
  };
};
