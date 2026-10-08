import { createHash } from "node:crypto";
// Explicit editorial release. This is a technical/editorial review, not Kevin's mastery
// or a claim that a human parent has completed teaching acceptance.
const approved = [
  {
    id: "G3-U01-TH1",
    contentHash:
      "8ed11835e6d8f254efb6aaf30eb4d453bfdd414b3c97a8954a61e5b98cbcaf5b",
  },
  {
    id: "G3-U02-TH1",
    contentHash:
      "61c517fad239b4d9bd67beff4e0559712ea63d495b3f27c8bb7c21fa93add7a1",
  },
  {
    id: "G3-U03-TH1",
    contentHash:
      "35973512cded772063296e6bebfd516276eefb5592ccf0a0722c0654d73e0c9b",
  },
  {
    id: "G3-UP01-TH1",
    contentHash:
      "30a497216ccb8b695db8ac5a5d9c63b43a2a4ca77f1ced34ab3955fb871f4f23",
  },
  {
    id: "G3-U04-TH1",
    contentHash:
      "28396e139f91a045925ade81c8690ba0e220c4577d7fc4cc1cb4d81c4cd1438c",
  },
  {
    id: "G3-UP02-TH1",
    contentHash:
      "d30a5d3e8aaf430b0525597aedfd1db0527e290aca1f32e9c220d05326d0ce6c",
  },
  {
    id: "G3-U05-TH1",
    contentHash:
      "43ab176afd4d250d404d3b405bf6be5f2ab19a98447fa138bc79b5d399bc80e9",
  },
  {
    id: "G3-U06-TH1",
    contentHash:
      "f6cab72f8cfdd1531b920a00ac88c412295797948ae07f3f9de5f47fbd3dfa21",
  },
  {
    id: "G3-U07-TH1",
    contentHash:
      "3eb16039fb24bf8dfa38f2a29632c1b6e41f4975e52fbaf06bc8e9b120182c85",
  },
  {
    id: "G3-L01-TH1",
    contentHash:
      "9d220aa5024a81123e38d61edc38ab61ba398804f381d0098da308b803065007",
  },
  {
    id: "G3-L02-TH1",
    contentHash:
      "d8e4bf01be85affeb8b6cc25ebf88f6ca5e0e98f77017b9a88dc3a3296b51069",
  },
  {
    id: "G3-L03-TH1",
    contentHash:
      "45ee519913fd1d4307499be2a492748eb78806dbdf44529655b607a4f407336a",
  },
  {
    id: "G3-L04-TH1",
    contentHash:
      "58770734f4a752fd23606bf2748881c75b1421074ba7a6f4b261b818bc842d80",
  },
  {
    id: "G3-L05-TH1",
    contentHash:
      "297246a09c7a640398818637f6837d960e3999536ea5f7f96bcdaf44ddd4145f",
  },
  {
    id: "G3-LP01-TH1",
    contentHash:
      "0f39b01a9d86a73f992e0767b98e3bce9ecb4c74fb954296086da6567f35b883",
  },
  {
    id: "G3-L06-TH1",
    contentHash:
      "6dbb2336bd4e37668d77f7fa34ac0f3eec4819a20fdb0338a3b84412e3021b04",
  },
  {
    id: "G3-L07-TH1",
    contentHash:
      "11573566a4e5fae016acd6c3841a92d5ba63ff2b12742c52c652ed4b0c64586c",
  },
];
export const publicationManifest = Object.freeze(
  approved.map((row) =>
    Object.freeze({
      ...row,
      teachingReview: "editorial-reviewed-awaiting-parent-trial",
      mathReview: "checked",
      figureReview: "condition-figure-checked",
      figureVersion: "condition-figure.v1",
      version: "thinking.2026-10-08.1",
      batch: "grade3-transfer-01",
      publishedAt: "2026-10-08",
      reviewSource: "repository-editorial-review",
      studentMastery: "not-assessed",
    }),
  ),
);
export const contentFingerprint = (t) =>
  createHash("sha256")
    .update(
      JSON.stringify([
        t.id,
        t.question,
        t.answer,
        t.reason,
        t.solutionSteps,
        t.hints,
        t.applicability,
        t.thinkingEvidence,
      ]),
    )
    .digest("hex");
export const isApprovedThinkingCard = (id, card) =>
  publicationManifest.some(
    (r) =>
      r.id === id &&
      card &&
      contentFingerprint(card) === r.contentHash &&
      r.mathReview === "checked" &&
      r.figureReview === "condition-figure-checked" &&
      r.teachingReview === "editorial-reviewed-awaiting-parent-trial",
  );
